import { ProjectModel } from './../db_schema/project';
import { authForward } from './../middleware/auth';
import { RunStatus } from '../db_schema/iteration_step';
import { PlanPropertyModel } from '../db_schema/plan-properties/plan_property';
import { Demo, DemoModel } from './../db_schema/demo';
import express from 'express';
import { DemoComputation, DemoPreComputation } from '../planner/demo-computation';
import { auth } from '../middleware/auth';

import multer from 'multer';
import path from 'path';
import { deleteResultFile, deleteUploadFile } from '../planner/pddl_file_utils';
import { environment } from '../app';
import { PlanningTaskRelaxationSpaceModel } from '../db_schema/relaxations';


export const demoRouter = express.Router();

const imgPort = 'http://localhost:3000';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(path.resolve(__dirname, '..'), 'data/uploads'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + file.originalname);
    },
});

const fileFilter = (req: any, file: any, cb: (arg0: null, arg1: boolean) => void) => {
    cb(null, true);
    // if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
    //     cb(null, true);
    // } else {
    //     cb(null, false);
    // }
};

const upload = multer({
    storage,
    fileFilter
});


async function computeDemo(demoGen: DemoComputation, demo: Demo): Promise<void>{
    try {
        while(demoGen.hasNextRun()){
            console.log("Next Demo Computation Run");
            // console.log(demo.explanations);
            let succ = await demoGen.executeNextRun();
            if (! succ) {
                await DemoModel.updateOne({ _id: demo?._id}, { $set: { status: RunStatus.failed } });
                return;
            }
            console.log("Completion: " + demo.completion);
            if (demo.completion == 1){
                demo.status = RunStatus.finished;
            }
            await demo.save();
            
            // if(demo.explanations[demo.explanations.length-1].relaxationExplanations)
            //     console.log(demo.explanations[demo.explanations.length-1].relaxationExplanations[0]);
        }
        return;
    } catch (ex) {
        console.log(ex.message);
        DemoModel.updateOne({ _id: demo?._id}, { $set: { status: RunStatus.failed } });
    }
}

demoRouter.post('/', auth, upload.single('summaryImage'), async (req, res) => {

    let demo: Demo | null = null;
    try {

        const project = await ProjectModel.findById(req.body.projectId);

        if (!project) {
            return res.status(403).send('create demo failed');
        }

        let imageFilePath = null;
        if (req.file) {
            console.log("save image");
            imageFilePath = '/uploads/' + req.file.filename;
        }

        let demoData = { 
            name: req.body.name,
            user: project.user,
            summaryImage: imageFilePath,
            domainFile: project.domainFile,
            problemFile: project.problemFile,
            settings: project.settings,
            baseTask: project.baseTask,
            domainSpecification: project.domainSpecification,
            status: RunStatus.pending,
            completion: 0.0,
            description: req.body.description,
            introduction: req.body.introduction,
            taskInfo: req.body.taskInfo,
            public: false
        }

        console.log(demoData);

        demo = new DemoModel(demoData);

        if (!demo) {
            console.log("create demo failed");
            return res.status(403).send('create demo failed');
        }

        await demo.save();
        await demo.populate('baseTask').execPopulate();

        // console.log(demo);

        // copy plan-properties
        const planProperties = await PlanPropertyModel.find({ project: project?._id, isUsed: true });
        for (const pp of planProperties) {
            let ppData = {
                name: pp.name,
                type: pp.type,
                formula: pp.formula,
                actionSets: pp.actionSets,
                naturalLanguageDescription: pp.naturalLanguageDescription,
                project: demo._id,
                isUsed: pp.isUsed,
                globalHardGoal: pp.globalHardGoal,
                value: pp.value,
            };
            const newPP = new PlanPropertyModel(ppData);
            await newPP.save();
        }


        // copy relaxation spaces
        const relaxationSpaces = await PlanningTaskRelaxationSpaceModel.find({ project: project?._id});
        for (const space of relaxationSpaces) {
            let spaceData = {
                name: space.name,
                project: demo._id,
                dimensions: space.dimensions
            };
            const newSpace = new PlanningTaskRelaxationSpaceModel(spaceData);
            await newSpace.save();
        }

    } catch (ex) {
        console.log(ex.message);
        res.status(403).send(ex.message);
        return;
    }

    // Pre-compute demo data
    try {
        console.log("Precompute demo");
        const planProperties = await PlanPropertyModel.find({ project: demo._id});
        console.log("#planProperties: " + planProperties.length);
        const taskRelaxations = await PlanningTaskRelaxationSpaceModel.find({ project: demo._id});
        console.log("#relaxationSpaces: " + taskRelaxations.length);

        demo.status = RunStatus.running;
        await demo.save();

        const demoGen = new DemoComputation(environment.experimentsRootPath, demo, planProperties, taskRelaxations);

        computeDemo(demoGen, demo);
        console.log("computeDemo ...")

        // console.log(demo);

        res.send({
            status: true,
            message: 'demo computation is running',
            data: demo
        });

    } catch (ex) {
        console.log(ex.message);
        DemoModel.updateOne({ _id: demo?._id}, { $set: { status: RunStatus.failed } });
        res.status(403).send(ex.message);
    }
});



demoRouter.post('/precomputed', auth, upload.single('summaryImage'), async (req, res) => {


    let demo: Demo | null = null;
    try {

        const project = await ProjectModel.findById(req.body.projectId);

        if (!project) {
            return res.status(403).send('create demo failed');
        }

        let imageFilePath = null;
        if (req.file) {
            imageFilePath = '/uploads/' + req.file.filename;
        }


        demo = new DemoModel();
        demo.isNew = true;

        demo.user = project.user;
        demo.domainFile = project.domainFile;
        demo.domainSpecification = project.domainSpecification;
        demo.problemFile = project.problemFile;
        demo.description = project.description;
        demo.baseTask = project.baseTask;
        demo.settings = project.settings;
        demo.animationSettings = project.animationSettings;

        demo.name = req.body.name;
        demo.summaryImage = imageFilePath;
        demo.status = RunStatus.pending;
        demo.description = req.body.description;
        demo.taskInfo = req.body.taskInfo;
        demo.public = false;

        if (!demo || ! demo._id) {
            return res.status(403).send('create demo failed');
        }

        await demo.save();

        // copy plan-properties
        const planProperties = await PlanPropertyModel.find({ project: project?._id, isUsed: true });
        for (const pp of planProperties) {
            const newPP = new PlanPropertyModel(pp);
            delete newPP._id;
            newPP.project = demo._id;
            newPP.isNew = true;
            await newPP.save();
        }

    } catch (ex) {
        res.send(ex.message);
        return;
    }

    // Store precomputed Demo data
    try {

        demo.status = RunStatus.running;
        await demo.save();

        const demoData = req.body.demoData;
        const maxUtility = req.body.maxUtility;

        const demoGen = new DemoPreComputation(demo, demoData, maxUtility);
        demoGen.store();
        demo.status = RunStatus.finished;
        await demo.save();

        res.send({
            status: true,
            message: 'Demo created',
            data: demo
        });

    } catch (ex) {
        DemoModel.updateOne({ _id: demo?._id}, { $set: { status: RunStatus.failed } });
        res.send(ex.message);
    }
});


demoRouter.put('/:id', auth, async (req, res) => {

    try {
        const refId = req.params.id;
        const demo: Demo | null = await DemoModel.findById(refId);

        if (!demo) {
            return res.status(403).send('Demo not found');
        }

        const demoData = req.body.data as Demo;
        console.log("update Demo settings");
        console.log(demoData.settings);

        demo.name = demoData.name;
        demo.description = demoData.description;
        demo.taskInfo = demoData.taskInfo;
        demo.settings = demoData.settings;

        await demo.save();

        res.send({
            status: true,
            message: 'Demo updated',
            data: demo
        });
    } catch (ex) {
        res.send(ex.message);
        return;
    }
});

// demoRouter.post('/cancel/:id', auth, async (req, res) => {

//     const demo = await DemoModel.findOne({ _id: req.params.id });

//     if (!demo || ! demo._id) {
//         return res.status(404).send({ message: 'not found demo' });
//     }

//     cancelDemoComputation(demo._id.toString()). then(
//         async (canceled) => {
//             await DemoModel.deleteOne({ _id: req.params.id });
//             res.send({
//                 successful: canceled,
//                 data: demo
//     });
//         },
//         (error) => {
//             res.send({
//                 successful: false,
//                 data: demo
//             });
//         });
// });


demoRouter.get('', authForward, async (req: any, res) => {

    console.log(req.user._id.toString());
    try {
        const allDemos: Demo[] = await DemoModel.find();
        console.log("#allDemos: " + allDemos.length);
        const demos = allDemos.filter(
            d => d.public || (req.user && d.user.toString() == req.user._id.toString())
        );
        console.log("#demos: " + demos.length);
        if (!demos) { 
            return res.status(404).send({ message: 'No demos found' });
        }

        res.send({
            data: demos
        });

    } catch (ex) {
        res.send(ex.message);
    }
});

demoRouter.get('/:id', authForward, async (req, res) => {
    const demo = await DemoModel.findOne({ _id: req.params.id });

    if (!demo) 
        { return res.status(404).send({ message: 'Demo not found.' }); 
    }

    res.send({
        data: demo
    });

});

demoRouter.delete('/:id', auth, async (req, res) => {
    const id = req.params.id;

    const demo: Demo | null = await DemoModel.findById(id);
    if (!demo) { return res.status(404).send({ message: 'Demo not found.' }); }

    if (demo.summaryImage) {
        deleteUploadFile(demo.summaryImage);
    }

    deleteResultFile('demo_' + demo._id);

    // delete properties
    const propertyDeleteResult = await PlanPropertyModel.deleteMany({ project: id});
    if (!propertyDeleteResult) { 
        return res.status(404).send({ message: 'Problem during demo deletion occurred' });
    }

    const result = await DemoModel.deleteOne({ _id: id });
    if (!result) { 
        return res.status(404).send({ message: 'Demo deletion failed.' });
    }

    res.send({
        data: result
    });

});
