import { ProjectModel } from './../db_schema/project';
import { authForward } from './../middleware/auth';
import { PlanProperty, PlanPropertyModel } from '../db_schema/plan-properties/plan_property';
import { Demo, DemoModel, DemoRunStatus } from './../db_schema/demo';
import express from 'express';
import { auth } from '../middleware/auth';

import multer from 'multer';
import path from 'path';
import { ExplanationRunStatus } from '../db_schema/explanations';



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


demoRouter.post('/image', auth, upload.single('summaryImage'), async (req: any, res) => {

    try {
        console.log(req);
        if (!req.file) {
            return res.status(400).send('upload failed');
        }

        let imageFilePath = '/uploads/' + req.file.filename;
        console.log("Image uploaded: " + imageFilePath);
        
        res.send({
            data: imageFilePath
        });


    } catch (ex) {
        console.log(ex);
        res.status(400);
        return;
    }
});


demoRouter.post('/', auth, async (req: any, res) => {

    try {

        const demoData: Demo = req.body.demo as Demo;
        // console.log(demoData);
        demoData.domainSpecification = JSON.stringify(demoData.domainSpecification)
        demoData.baseTask.model = JSON.stringify(demoData.baseTask.model)

        delete demoData._id;
        const demoModel = new DemoModel(demoData);

        demoModel.user = req.user._id;
        demoModel.public = false;
        demoModel.status = DemoRunStatus.pending;
        demoModel.globalExplanation = {
            createdAt: new Date(Date.now()),
            status: ExplanationRunStatus.running
        }

        // console.log(demoData);

        if (!demoModel) {
            console.log("create demo failed");
            return res.status(403).send('create demo failed');
        }

        await demoModel.save();
        
        const planPropertiesData: PlanProperty[] = req.body.planProperties;
        // console.log(planPropertiesData)
        for (const pp of planPropertiesData) {

            let ppData: PlanProperty = pp;
            delete ppData._id;
            ppData.project = demoModel._id;
            const newPP = new PlanPropertyModel(ppData);
            await newPP.save();
        }

        const planProperties = await PlanPropertyModel.find({ project: demoModel._id});

        demoModel.status = DemoRunStatus.running;
        await demoModel.save();


        const exp_settings = {
            plan_properties: planProperties,
            hard_goals: [],
            soft_goals: planProperties.map(pp => pp.name)
        }

        const model = demoData.baseTask.model
        const baseURL = process.env.BASE_URL
        let payload = JSON.stringify({
            callback:baseURL + '/api/demo/compute-explanations/' + demoModel._id + '/finished',
            model,
            exp_setting: JSON.stringify(exp_settings)
        })

        // console.log(payload)

        const explainerServiceURL = process.env.EXPLAINER_SERVICE
        const explainerRequest = new Request(explainerServiceURL + '/explain/all-mugs-msgs', 
            {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: payload,
            }
        )

        fetch(explainerRequest).then
            (resp => console.log("Explain computation request submitted."),
            error => console.log(error)
        )
        
        res.send({
            status: true,
            message: 'Explain computation registered',
            data: demoModel._id
        });


    } catch (ex) {
        console.log(ex);
        res.status(403);
        return;
    }
});

interface Result {
    complete: false,
    subsets: string[][]
  }


demoRouter.post('/compute-explanations/:id/finished', async (req: any, res) => {

    try {

        console.log(req.body)
        const refId = req.params.id;
        const demo: Demo | null = await DemoModel.findOne({ _id: refId});

        if (!demo) {
            return res.status(404).send('update demo failed');
        }


        let MUGS = req.body.MUGS as Result
        let MGCS = req.body.MGCS as Result
        let status = req.body.status

        console.log(MUGS)
        console.log(MGCS)
        console.log(status)

        if(status === 'FINISHED'){
            demo.status = DemoRunStatus.finished;
            demo.globalExplanation.MUGS = JSON.stringify(MUGS.subsets)
            demo.globalExplanation.MGCS = JSON.stringify(MGCS.subsets)
        }


        if(status === 'FAILED'){
            demo.status = DemoRunStatus.failed;
        }

        demo.save()
        
        res.send({
            status: true,
            message: 'Explanation computation for Demo finished',
            data: true
        });

    } catch (ex : any) {
        console.log(ex);
        res.status(404).send(ex.message);
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
        // demo.status = RunSt.pending;
        demo.description = req.body.description;
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

        // demo.status = DemoRunStatus.running;
        await demo.save();

        const demoData = req.body.demoData;
        const maxUtility = req.body.maxUtility;

        console.log("store uploaded demo");
        const planProperties = await PlanPropertyModel.find({ project: demo._id});
        console.log("#planProperties: " + planProperties.length);

        // TODO
        // const demoGen = new DemoPreComputation(demo, planProperties, demoData, maxUtility);
        // demoGen.store();
        
        demo.status = DemoRunStatus.finished;
        await demo.save();

        console.log(demo)
        res.send({
            status: true,
            message: 'Demo uploaded',
            data: demo
        });

    } catch (ex) {
        DemoModel.updateOne({ _id: demo?._id}, { $set: { status: DemoRunStatus.failed } });
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

        const demoData = req.body.demo as Demo;
        console.log("update Demo settings");
        console.log(demoData.settings);

        demo.name = demoData.name;
        demo.description = demoData.description;
        // demo.taskInfo = demoData.taskInfo;
        demo.settings = demoData.settings;

        await demo.save();

        res.send({
            status: true,
            message: 'Demo updated',
            data: demo
        });
    } catch (ex) {
        console.log(ex);
        res.status(500);
        return;
    }
});

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
        res.status(500);
    }
});

demoRouter.get('/demos', auth, async (req, res) => {
    try {

        if (req.query.projectId === undefined) {
            return res.status(404).send({ message: 'no projectId specified' });
        }
        const projectId : string = req.query.projectId as string;

        const demos = await DemoModel.find({ projectId: projectId});

        if (!demos) 
            { return res.status(404).send({ message: 'Demos not found.' }); 
        }

        // console.log(demos);

        res.send({
            data: demos
        });
    } catch (ex) {
        console.log(ex)
        res.status(500);
    }

});

demoRouter.get('/:id', authForward, async (req, res) => {

    try {
        const demoID = req.params.id ;
        console.log("demo id: " + demoID);

        const demo = await DemoModel.findOne({ _id: demoID});

        if (!demo) 
            { return res.status(404).send({ message: 'Demo not found.' }); 
        }

        res.send({
            data: demo
        });
    } catch (ex) {
        console.log(ex)
        res.status(500);
    }

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

