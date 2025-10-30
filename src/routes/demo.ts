import express from 'express';
import { PlanProperty, PlanPropertyBase, PlanPropertyBaseZ, PlanPropertyModel, PlanPropertyOfProject } from '../db_schema/plan-properties/plan_property';
import { auth, AuthenticatedRequest } from '../middleware/auth';
import { Demo, DemoBaseZ, DemoModel, DemoRunStatus } from './../db_schema/demo';
import { authAny } from './../middleware/auth';

import multer from 'multer';
import path from 'path';
import { string } from 'zod';
import { DomainSpecificationBase, DomainSpecificationBaseZ, DomainSpecificationModel } from '../db_schema/domain_specification';
import { ExplanationRunStatus } from '../db_schema/explanations';
import { ExplainerRequest, ExplainerResponse, ExplainerResponseZ } from '../db_schema/service_communication';
import { Service, ServiceModel, ServiceType } from '../db_schema/services';
import { callServices } from '../services/utils';
import { array } from 'zod';


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
    fileFilter,
    limits: {
        fileSize: 1 * 1024 * 1024 // 1MB limit
    }
});


demoRouter.post('/image', auth, upload.single('summaryImage'), async (req: any, res) => {

    try {
        if (!req.file) {
            res.status(400).send('upload failed');
            return;
        }

        let imageFilePath = '/uploads/' + req.file.filename;
        console.log("Image uploaded: " + imageFilePath);
        
        res.send({
            imagePath: imageFilePath
        });


    } catch (ex) {
        console.log(ex);
        res.status(500);
        return;
    }
});


demoRouter.post('/', auth, async (req: any, res) => {

    try {

        const demoData = DemoBaseZ.parse(req.body.demo);

        // delete demoData._id;
        const demoModel = new DemoModel(demoData);

        demoModel.user = req.user._id;
        demoModel.public = false;
        demoModel.status = DemoRunStatus.PENDING;
        demoModel.globalExplanation = {
            createdAt: new Date(Date.now()),
            status: ExplanationRunStatus.RUNNING
        }


        if (!demoModel) {
            console.log("create demo failed");
            res.status(403).send('create demo failed');
            return;
        }

        await demoModel.save();
        
        const planPropertiesData: PlanPropertyBase[] = array(PlanPropertyBaseZ).parse(req.body.planProperties);

        for (const pp of planPropertiesData) {

            let ppData: PlanPropertyOfProject = {
                ...pp,
                project: demoModel._id
            };
            delete (ppData as any)._id;
            
            const newPP = new PlanPropertyModel(ppData);
            await newPP.save();
        }

        const planProperties = await PlanPropertyModel.find({ project: demoModel._id});

        demoModel.status = DemoRunStatus.RUNNING;
        await demoModel.save();

        const model = demoData.baseTask.model
        const baseURL = process.env.BASE_URL
        let payload: ExplainerRequest = {
            callback:baseURL + '/api/demo/compute-explanations/' + demoModel._id + '/finished',
            id: demoModel._id,
            model,
            goals: planProperties,
            hardGoals: planProperties.filter(pp => pp.globalHardGoal).map(pp => pp.id),
            softGoals: planProperties.filter(pp => !pp.globalHardGoal).map(pp => pp.id)
        };

        const services: Service[] = [];
        for(const serviceId of demoModel.settings.services.services) {
            const service = await ServiceModel.findById(serviceId);
            if(service && service.type == ServiceType.EXPLAINER){
                services.push(service);
            }
        }

        if (services.length === 0) {
            demoModel.globalExplanation.status == ExplanationRunStatus.FAILED;
            await demoModel.save();
            console.log('No existing explainer service selected.');
            res.status(200).send(demoModel._id);
            return;
        }

        const success = await callServices(services, JSON.stringify(payload), '/explanation');

        if(!success){
            demoModel.globalExplanation.status = ExplanationRunStatus.FAILED;
            await demoModel.save();
            console.log('No explainer service available.');
            res.status(200).send(demoModel._id);
            return;
        }
    
        res.send(demoModel._id);


    } catch (ex) {
        console.log(ex);
        res.status(403);
        return;
    }
});


demoRouter.post('/cancel', auth, async (req: AuthenticatedRequest, res) => {

    try {
        if (!req.user) {
            res.status(401).send()
            return;
        }

        const id = string().parse(req.body.demoId);
        console.log('Cancel: ' + id);

        const demo: Demo | null = await DemoModel.findOne({_id: id, user: req.user._id});

        if (! demo) { 
            res.status(404).send({ message: 'Demo not found.' })
            return;
        }

        if (demo.status !== DemoRunStatus.PENDING && demo.status !== DemoRunStatus.RUNNING) { 
            res.status(400).send({ message: 'Demo computation already finished.' });
            return;
        }

        const explainerServiceURL = process.env.EXPLAINER_SERVICE
        const explainerRequest = new Request(explainerServiceURL + '/explain/cancel', 
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    authorization: "Bearer " + process.env.EXPLAINER_KEY
                },
                body: JSON.stringify({id: demo._id}),
            }
        )

        fetch(explainerRequest).then
            (resp => console.log("Cancel computation request submitted."),
            error => console.log(error)
        )

        // delete properties
        const propertyDeleteResult = await PlanPropertyModel.deleteMany({ project: id});
        if (!propertyDeleteResult) { 
            res.status(404).send({ message: 'Demo deletion failed.' });
            return;
        }

        const result = await DemoModel.deleteOne({ _id: id });
        if (!result) { 
            res.status(404).send({ message: 'Demo deletion failed.' });
            return;
        }

        res.send(true);
    } catch (ex) {
        console.log(ex)
        res.status(500);
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

        if (demo === null || demo.globalExplanation === undefined) {
            res.status(404).send('update demo failed');
            return;
        }

        const response = ExplainerResponseZ.parse(req.body);

        let MUGS = response.result.MUGS;
        let MGCS = response.result.MGCS;
        let status = response.status
        // console.log(MUGS)
        // console.log(MGCS)
        // console.log(status)

        if(status === 'FINISHED'){
            demo.status = DemoRunStatus.FINISHED;
            demo.globalExplanation.status = ExplanationRunStatus.FINISHED;
            demo.globalExplanation.MUGS = MUGS.subsets;
            demo.globalExplanation.MGCS = MGCS.subsets;
        }


        if(status === 'FAILED'){
            demo.status = DemoRunStatus.FAILED;
            demo.globalExplanation.status = ExplanationRunStatus.FAILED;
        }

        await demo.save()
        
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
            res.status(403).send('Demo not found');
            return;
        }


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
            res.status(403).send('Demo not found');
            return;
        }

        const demoData = DemoBaseZ.parse(req.body);

        console.log(demoData);

        demo.name = demoData.name;
        demo.description = demoData.description;
        demo.summaryImage = demoData.summaryImage;
        demo.instanceInfo = demoData.instanceInfo;
        demo.settings = demoData.settings;

        await demo.save();

        res.send(demo);
    } catch (ex) {
        console.log(ex);
        res.status(500);
        return;
    }
});


demoRouter.get('', auth, async (req: AuthenticatedRequest, res) => {
    try {
        if (!req.user) {
            res.status(401);
            return;
        }

        let demos = null;
        if (req.query.projectId === undefined) {
            demos = await DemoModel.find({ user: req.user._id});
        }
        else{
            const projectId : string = req.query.projectId as string;
            demos = await DemoModel.find({ projectId: projectId, user: req.user._id});
        }

        if (!demos) { 
            res.status(404).send({ message: 'Demos not found.' });
            return; 
        }

        res.send(demos);
    } catch (ex) {
        console.log(ex)
        res.status(500);
    }

});

demoRouter.get('/user-study', auth, async (req: AuthenticatedRequest, res) => {
    try {
        let user = req.user;
        if (!user) {
            res.status(401);
            return;
        }
        const allDemos: Demo[] = await DemoModel.find();

        const demos = allDemos.filter(
            d => d.public || (req.user && d.user.toString() == user._id.toString())
        );

        if (!demos) { 
            res.status(404).send({ message: 'No demos found' });
            return;
        }

        res.send(demos);
    } catch (ex) {
        console.log(ex)
        res.status(500);
    }

});

demoRouter.get('/:id', authAny, async (req, res) => {

    try {
        const demoID = req.params.id ;

        const demo = await DemoModel.findOne({ _id: demoID});

        if (!demo) { 
            res.status(404).send({ message: 'Demo not found.' });
            return; 
        }

        res.send(demo);
    } catch (ex) {
        console.log(ex)
        res.status(500);
    }

});


demoRouter.delete('/:id', auth, async (req: AuthenticatedRequest, res) => {

    try {
        if (!req.user) {
            res.status(401).send();
            return;
        }

        const id = req.params.id;

        const demo: Demo | null = await DemoModel.findOne({_id: id, user: req.user._id});
        if (!demo) { 
            res.status(404).send({ message: 'Demo not found.' });
            return; 
        }

        // if (demo.summaryImage) {
        //     deleteUploadFile(demo.summaryImage);
        // }

        // deleteResultFile('demo_' + demo._id);

        // delete properties
        const propertyDeleteResult = await PlanPropertyModel.deleteMany({ project: id});
        if (!propertyDeleteResult) { 
            res.status(404).send({ message: 'Problem during demo deletion occurred' });
            return;
        }

        const result = await DemoModel.deleteOne({ _id: id });
        if (!result) { 
            res.status(404).send({ message: 'Demo deletion failed.' });
            return;
        }

        res.send(true);
    } catch (ex) {
        console.log(ex)
        res.status(500);
    }

});


demoRouter.post('/upload', auth, async (req: any, res) => {

    try {


        // demo
        const demoData = DemoBaseZ.parse(req.body.demo);
        if(demoData.globalExplanation === undefined ||
            demoData.globalExplanation.MUGS == undefined ||
            demoData.globalExplanation.MGCS == undefined
        ){
            console.log("upload demo failed");
            res.status(403).send('upload demo failed');
            return;
        }

        //domain spec
        const domainSpecData: DomainSpecificationBase = DomainSpecificationBaseZ.parse(req.body.domainSpecification);
        domainSpecData.name = 'UPLOADED: ' + domainSpecData.name;

        const domainSpecModel =  new DomainSpecificationModel(domainSpecData);
        await domainSpecModel.save();


        // demo
        demoData.name = 'UPLOADED: ' + demoData.name;
        demoData.projectId = null;
        demoData.globalExplanation.status = ExplanationRunStatus.FINISHED;
        demoData.summaryImage = null;
        demoData.settings.services.services = [];
        demoData.settings.llmConfig.prompts = [];
        demoData.settings.llmConfig.outputSchema = []

        // demoData._id = null;
        const demoModel = new DemoModel(demoData);

        demoModel.user = req.user._id;
        demoModel.public = false;
        demoModel.status = DemoRunStatus.FINISHED;
        demoModel.domain = domainSpecModel._id;

        if (!demoModel) {
            console.log("upload demo failed");
            res.status(403).send('upload demo failed');
            return;
        }

        await demoModel.save();
        
        // plan properties
        const planPropertiesData: PlanProperty[] = req.body.planProperties;
        
        let planPropertyIdMapping: Record<string, string> = {};

        for (const pp of planPropertiesData) {

            const old_id = pp._id;
            
            if(old_id == undefined){
                res.status(403);
                return;
            }

            let ppData: PlanPropertyOfProject = {
                ...pp,
                project: demoModel._id
            };
            delete (ppData as any)._id;
            
            const newPP = new PlanPropertyModel(ppData);
            const newProperty = await newPP.save();

            planPropertyIdMapping[old_id] = newProperty._id;
        }

        // const planProperties = await PlanPropertyModel.find({ project: demoModel._id});

        if(demoModel.globalExplanation === undefined ||
            demoModel.globalExplanation.MUGS == undefined || 
            demoModel.globalExplanation.MGCS == undefined){
                res.status(403);
                return;
        }

        const MUGS: string[][] = demoModel.globalExplanation.MUGS;
        const newMappedMUGS = MUGS.map((mugs) => mugs.map(id => planPropertyIdMapping[id].toString()))
        demoModel.globalExplanation.MUGS = newMappedMUGS;
        
        const MGCS: string[][] = demoModel.globalExplanation.MGCS;
        const newMappedMGCS= MGCS.map((mgcs) => mgcs.map(id => planPropertyIdMapping[id].toString()))
        demoModel.globalExplanation.MGCS = newMappedMGCS;

        await demoModel.save();
        
        res.send(demoModel._id);


    } catch (ex) {
        console.log(ex);
        res.status(500);
        return;
    }
});

