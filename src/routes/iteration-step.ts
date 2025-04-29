import express from 'express';
import { string } from 'zod';
import { Demo, DemoModel } from '../db_schema/demo';
import { ExplanationRunStatus } from '../db_schema/explanations';
import { IterationStepBaseZ, IterationStepModel, IterationStepZ, PlanRunStatus, StepStatus } from '../db_schema/iteration_step';
import { Project, ProjectModel } from '../db_schema/project';
import { Service, ServiceModel, ServiceType } from '../db_schema/services';
import { auth, authAny, AuthenticatedRequest } from '../middleware/auth';
import { callServices } from '../services/utils';


export const iterationStepRouter = express.Router();

iterationStepRouter.get('/', authAny, async (req: any, res) => {

    try{
        const projectId: string = string().parse(req.query.projectId);
        const userId: string = req.user._id;
        const steps = await IterationStepModel.find({ project: projectId, user: userId})

        if (!steps) { 
            res.status(404).send({ message: 'ERROR: No steps found.' });
            return;
        }

        res.send(steps);
    }
    catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }

});

iterationStepRouter.get('/:id', authAny, async (req, res) => {
    try{
        const id =  req.params.id;
        const step = await IterationStepModel.findOne({ _id: id});

        if (!step) { 
            res.status(404).send({ message: 'No iteration step found.' });
            return;
        }

        res.send(step);
    }
    catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }
});


iterationStepRouter.post('/cancel', authAny, async (req, res) => {

    try {

        const id = string().parse(req.body.id);
        console.log('Cancel: ' + id);

        const step = await IterationStepModel.findById(id);

        if (!step) {
            res.status(404).send({ message: 'No step found.' });
            return;
        }

        if (!step.plan) {
            res.status(404).send({ message: 'No step found.' });
            return;
        }

        const forwardCancelToPlanningService = step.plan.status == PlanRunStatus.RUNNING;
        console.log("Plan status: " + step.plan.status);
        

        step.status = StepStatus.UNKNOWN;
        step.plan.status = PlanRunStatus.CANCELED;
        await step.save();

        if(forwardCancelToPlanningService){
            console.log("forward cancel to planning service");
            let project = await ProjectModel.findById(step.project) as Project;
            if(!project){
                project = await DemoModel.findById(step.project) as Project;
            }
    
            if (!project) {
                console.log('[Cancel Plan Computation] Project does not exist.')
                step.plan.status = PlanRunStatus.FAILED;
                await step.save();
                res.status(200).send({status: false, message:'Project does not exists.'});
                return;
            }
    
            const services: Service[] = [];
            for(const serviceId of project.settings.services.services) {
                const service = await ServiceModel.findById(serviceId);
                if(service && service.type == ServiceType.PLANNER){
                    services.push(service);
                }
            }
    
            if (services.length === 0) {
                console.log('[Cancel Plan Computation] No selected planner service selected.')
                step.plan.status = PlanRunStatus.FAILED;
                await step.save();
                res.status(200).send({status: false, message: 'No existing planner service selected.'});
                return;
            }
    
            const success = await callServices(services, JSON.stringify({id}), '/cancel');
            if(!success){
                step.plan.status = PlanRunStatus.FAILED;
                await step.save();
                console.log('[Cancel Plan Computation] No selected planner service reachable.');
                res.status(201).send({status: false, message:'No selected planner service reachable.'});
                return;
            }
        }

    
        res.send(true);
    } catch (ex) {
        res.status(500);
    }

});


iterationStepRouter.post('', authAny, async (req: AuthenticatedRequest, res) => {

    try {
        if (!req.user) {
            res.status(401).send('Create iteration step failed.');
            return;
        }
        console.log("create iter step");
        const iterStepBaseData = IterationStepBaseZ.parse(req.body);
        let iterStepData = {
            ...iterStepBaseData,
            user: req.user._id,
            status: StepStatus.UNKNOWN,
        }

        console.log(iterStepData.task);


        const step = new IterationStepModel(iterStepData);
        if (!step) {
            res.status(403).send('Iteration Step could not be created.');
            return;
        }
        await step.save();

        const demo: Demo | null = await DemoModel.findOne({ _id: iterStepData?.project});
        if(
            demo !== null && 
            demo.globalExplanation !== undefined && 
            demo.globalExplanation.status === ExplanationRunStatus.FINISHED
        ){
            console.log('Extract explanations from demo.');
            step.globalExplanation = demo.globalExplanation;
            step.globalExplanation.status = ExplanationRunStatus.FINISHED;
            await step.save();
        }

        res.send(step);
    }
    catch (ex) {
        console.log(ex);
        res.status(500);
    }

});



iterationStepRouter.put('/:id', authAny, async (req, res) => {
    try {
        const refId = req.params.id;
        const step = await IterationStepModel.findOne({ _id: refId});

        if (!step) {
            res.status(404).send('update step failed');
            return;
        }

        const stepData = IterationStepZ.parse(req.body);

        step.status = stepData.status;

        await step.save();

        res.send(step);

    } catch (ex) {
        res.status(500);
    }

});


iterationStepRouter.delete('/:id', auth, async (req, res) => {

    try {
        const result = await IterationStepModel.deleteOne({ _id: req.params.id });

        if (!result) {
            res.status(404).send({ message: 'No step found.' });
            return;
        }
    
        res.send(result.deletedCount === 1);
    } catch (ex) {
        res.status(500);
    }

});


