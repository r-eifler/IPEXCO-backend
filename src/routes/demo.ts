import { ProjectModel } from './../db_schema/project';
import { authAny, AuthenticatedRequest, authForward } from './../middleware/auth';
import { PlanProperty, PlanPropertyModel } from '../db_schema/plan-properties/plan_property';
import { Demo, DemoModel, DemoRunStatus } from './../db_schema/demo';
import express from 'express';
import { auth } from '../middleware/auth';

import multer from 'multer';
import path from 'path';
import { ExplanationRunStatus } from '../db_schema/explanations';



export const demoRouter = express.Router();

demoRouter.use('/uploads', express.static(path.join(__dirname, '..', 'data/uploads')));

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
        return res.status(500);
    }
});


demoRouter.post('/', auth, async (req: any, res) => {

    try {

        const demoData: Demo = req.body.demo as Demo;
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


        if (!demoModel) {
            console.log("create demo failed");
            return res.status(403).send('create demo failed');
        }

        await demoModel.save();
        
        const planPropertiesData: PlanProperty[] = req.body.planProperties;

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

        const explainerServiceURL = process.env.EXPLAINER_SERVICE
        const explainerRequest = new Request(explainerServiceURL + '/explain/all-mugs-msgs', 
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    authorization: "Bearer " + process.env.EXPLAINER_KEY
                },
                body: payload,
            }
        )

        console.log(explainerRequest.headers);

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

        const refId = req.params.id;
        const demo: Demo | null = await DemoModel.findOne({ _id: refId});

        if (!demo) {
            return res.status(404).send('update demo failed');
        }


        let MUGS = req.body.MUGS as Result
        let MGCS = req.body.MGCS as Result
        let status = req.body.status

        // console.log(MUGS)
        // console.log(MGCS)
        // console.log(status)

        if(status === 'FINISHED'){
            demo.status = DemoRunStatus.finished;
            demo.globalExplanation.status = ExplanationRunStatus.finished;
            demo.globalExplanation.MUGS = JSON.stringify(MUGS.subsets)
            demo.globalExplanation.MGCS = JSON.stringify(MGCS.subsets)
        }


        if(status === 'FAILED'){
            demo.status = DemoRunStatus.failed;
            demo.globalExplanation.status = ExplanationRunStatus.failed;
        }

        demo.save()
        
        res.send({
            status: true,
            message: 'Explanation computation for Demo finished',
            data: true
        });

    } catch (ex : any) {
        console.log(ex);
        res.status(500).send();
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

            demo.summaryImage = imageFilePath;
        }

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


demoRouter.put('/:id', auth, async (req, res) => {

    try {
        const refId = req.params.id;
        const demo: Demo | null = await DemoModel.findById(refId);

        if (!demo) {
            return res.status(403).send('Demo not found');
        }

        const demoData = req.body.demo as Demo;

        console.log(demoData);

        demo.name = demoData.name;
        demo.description = demoData.description;
        demo.summaryImage = demoData.summaryImage;
        demo.domainInfo = demoData.domainInfo;
        demo.instanceInfo = demoData.instanceInfo;
        demo.settings = demoData.settings;

        await demo.save();

        res.send({
            status: true,
            message: 'Demo updated',
            data: demo
        });
    } catch (ex) {
        console.log(ex);
        return res.status(500);
    }
});

// demoRouter.get('', auth, async (req: AuthenticatedRequest, res) => {
//     try {
//         const allDemos: Demo[] = await DemoModel.find();
//         const demos = allDemos.filter(
//             d => d.public || (req.user && d.user.toString() == req.user._id.toString())
//         );

//         if (!demos) { 
//             return res.status(404).send({ message: 'No demos found' });
//         }

//         res.send({
//             data: demos
//         });

//     } catch (ex) {
//         res.status(500);
//     }
// });

demoRouter.get('', auth, async (req: AuthenticatedRequest, res) => {
    try {
        if (!req.user) {
            return res.status(401);
        }
        let demos = null;
        if (req.query.projectId === undefined) {
            demos = await DemoModel.find({ user: req.user._id});
        }
        else{
            const projectId : string = req.query.projectId as string;
            demos = await DemoModel.find({ projectId: projectId, user: req.user._id});
        }

        if (!demos) 
            { return res.status(404).send({ message: 'Demos not found.' }); 
        }

        res.send({
            data: demos
        });
    } catch (ex) {
        console.log(ex)
        res.status(500);
    }

});

demoRouter.get('/user-study', auth, async (req: AuthenticatedRequest, res) => {
    try {
        if (!req.user) {
            return res.status(401);
        }
        const allDemos: Demo[] = await DemoModel.find();

        const demos = allDemos.filter(
            d => d.public || (req.user && d.user.toString() == req.user._id.toString())
        );

        if (!demos) { 
            return res.status(404).send({ message: 'No demos found' });
        }

        res.send({
            data: demos
        });
    } catch (ex) {
        console.log(ex)
        res.status(500);
    }

});

demoRouter.get('/:id', authAny, async (req, res) => {

    try {
        const demoID = req.params.id ;

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


demoRouter.delete('/:id', auth, async (req: AuthenticatedRequest, res) => {

    try {
        if (!req.user) {
            return res.status(401).send();
        }

        const id = req.params.id;

        const demo: Demo | null = await DemoModel.findOne({id, user: req.user});
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
    } catch (ex) {
        console.log(ex)
        res.status(500);
    }

});


demoRouter.post('/upload', auth, async (req: any, res) => {

    try {

        const demoData: Demo = req.body.demo as Demo;
        demoData.name = 'UPLOADED: ' + demoData.name;
        delete demoData.projectId;
        demoData.domainSpecification = JSON.stringify(demoData.domainSpecification)
        demoData.baseTask.model = JSON.stringify(demoData.baseTask.model)
        demoData.globalExplanation.status = ExplanationRunStatus.finished;
        demoData.globalExplanation.MUGS = JSON.stringify(demoData.globalExplanation.MUGS)
        demoData.globalExplanation.MGCS = JSON.stringify(demoData.globalExplanation.MGCS)

        delete demoData._id;
        const demoModel = new DemoModel(demoData);

        demoModel.user = req.user._id;
        demoModel.public = false;
        demoModel.status = DemoRunStatus.finished;

        if (!demoModel) {
            console.log("create demo failed");
            return res.status(403).send('create demo failed');
        }

        await demoModel.save();
        
        const planPropertiesData: PlanProperty[] = req.body.planProperties;
        
        let planPropertyIdMapping: Record<string, string> = {};

        for (const pp of planPropertiesData) {

            let ppData: PlanProperty = pp;
            const old_id = ppData._id;
            delete ppData._id;
            ppData.project = demoModel._id;
            const newPP = new PlanPropertyModel(ppData);
            const newProperty = await newPP.save();

            if(old_id == undefined){
                return res.status(403);
            }

            planPropertyIdMapping[old_id] = newProperty._id;
        }

        // const planProperties = await PlanPropertyModel.find({ project: demoModel._id});

        if(demoModel.globalExplanation.MUGS == undefined || demoModel.globalExplanation.MGCS == undefined){
            return res.status(403);
        }

        const MUGS: string[][] = JSON.parse(demoModel.globalExplanation.MUGS);
        const newMappedMUGS = MUGS.map((mugs) => mugs.map(id => planPropertyIdMapping[id].toString()))
        demoModel.globalExplanation.MUGS = JSON.stringify(newMappedMUGS);
        
        const MGCS: string[][] = JSON.parse(demoModel.globalExplanation.MGCS);
        const newMappedMGCS= MGCS.map((mgcs) => mgcs.map(id => planPropertyIdMapping[id].toString()))
        demoModel.globalExplanation.MGCS = JSON.stringify(newMappedMGCS);

        await demoModel.save();
        
        res.send({
            status: true,
            message: 'Explain computation registered',
            data: demoModel._id
        });


    } catch (ex) {
        console.log(ex);
        res.status(500);
        return;
    }
});

