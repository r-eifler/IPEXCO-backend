import { ProjectModel } from './../db_schema/project';
import { authForward } from './../middleware/auth';
import { PlanProperty, PlanPropertyModel } from '../db_schema/plan-properties/plan_property';
import { Demo, DemoModel, DemoStatus } from './../db_schema/demo';
import express from 'express';
import { auth } from '../middleware/auth';

import multer from 'multer';
import path from 'path';



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



demoRouter.post('/', auth, upload.single('summaryImage'), async (req: any, res) => {

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

        const demoData: Demo = req.body.data as Demo;
        delete demoData._id;

        const demoModel = new DemoModel(demoData);

        demoModel.user = project.user;
        demoModel.summaryImage = imageFilePath;
        demoModel.public = false;
        demoModel.status = DemoStatus.pending;
        demoModel.settings = project.settings;
        demoModel.domainSpecification = project.domainSpecification;

        console.log(demoData);

        if (!demoModel) {
            console.log("create demo failed");
            return res.status(403).send('create demo failed');
        }

        await demoModel.save();
        await demoModel.populate('baseTask');

        // copy plan-properties
        let planProperties = await PlanPropertyModel.find({ project: project?._id, isUsed: true });

        for (const pp of planProperties) {

            let ppData: PlanProperty = pp.toObject()
            delete ppData._id;
            ppData.project = demoModel._id;
            const newPP = new PlanPropertyModel(ppData);
            await newPP.save();
        }

        planProperties = await PlanPropertyModel.find({ project: demoModel._id});

        demoModel.status = DemoStatus.running;
        await demoModel.save();


        // let explanationRun : ExplanationRun = {
        //     name: 'conflict_exp', 
        //     status: ExplanationRunStatus.running, 
        //     hardGoals: planProperties.filter(pp => pp.isUsed && pp.globalHardGoal),
        //     softGoals: planProperties.filter(pp => pp.isUsed && !pp.globalHardGoal)
        // }


        // TODO compute Demo


    } catch (ex) {
        console.log(ex);
        res.status(403);
        return;
    }
});


demoRouter.post('/:id/image', auth, upload.single('summaryImage'), async (req, res) => {

    try {
        const refId = req.params.id;
        const demo: Demo | null = await DemoModel.findById(refId);

        if (!demo) {
            return res.status(403).send('Demo not found');
        }

        const demoData = req.body.data as Demo;

        let imageFilePath = null;
        if (req.file) {
            imageFilePath = '/uploads/' + req.file.filename;
            console.log("new image: " + imageFilePath);

            // if(demo.summaryImage){
            //     deleteUploadFile(demo.summaryImage);
            // }
            demo.summaryImage = imageFilePath;
        }

        await demo.save();

        res.send({
            status: true,
            message: 'Demo updated',
            data: demo
        });
        console.log(res);
    } catch (ex) {
        console.log(ex);
        res.status(500);
        return;
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

        console.log(req.body)

        demo = new DemoModel();
        demo.isNew = true;

        demo.user = project.user;
        demo.domainSpecification = project.domainSpecification;
        demo.description = project.description;
        demo.baseTask = project.baseTask;
        demo.settings = project.settings;
        demo.completion = 0;

        demo.name = req.body.name;
        demo.summaryImage = imageFilePath;
        demo.status = DemoStatus.pending;
        demo.description = req.body.description;
        demo.taskInfo = req.body.taskInfo;
        demo.public = false;

        if (!demo || ! demo._id) {
            return res.status(403).send('create demo failed');
        }

        await demo.save();

        // copy plan-properties
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
                utility: pp.utility,
                class: pp.class,
                icon: pp.icon,
                color: pp.color
            };
            const newPP = new PlanPropertyModel(ppData);
            await newPP.save();
        }

    } catch (ex) {
        res.status(500);
        console.log(ex);
        return;
    }

    // Store precomputed Demo data
    try {

        demo.status = DemoStatus.running;
        await demo.save();

        const demoData = req.body.demoData;
        const maxUtility = req.body.maxUtility;

        console.log("store uploaded demo");
        const planProperties = await PlanPropertyModel.find({ project: demo._id});
        console.log("#planProperties: " + planProperties.length);

        // TODO
        // const demoGen = new DemoPreComputation(demo, planProperties, demoData, maxUtility);
        // demoGen.store();
        
        demo.status = DemoStatus.finished;
        await demo.save();

        console.log(demo)
        res.send({
            status: true,
            message: 'Demo uploaded',
            data: demo
        });

    } catch (ex) {
        DemoModel.updateOne({ _id: demo?._id}, { $set: { status: DemoStatus.failed } });
        res.status(500);
        console.log(ex);
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
        res.status(500);
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
        const allDemos: Demo[] = await DemoModel.find().populate('baseTask');
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
        res.status(500);
    }
});

demoRouter.get('/:id', authForward, async (req, res) => {
    const demo = await DemoModel.findOne({ _id: req.params.id }).populate('baseTask');

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

    // if (demo.summaryImage) {
    //     deleteUploadFile(demo.summaryImage);
    // }

    // deleteResultFile('demo_' + demo._id);

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
