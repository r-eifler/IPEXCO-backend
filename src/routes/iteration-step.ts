import { IterationStep, IterationStepModel, PlanRunStatus, StepStatus } from '../db_schema/iteration_step';
import express from 'express';
import { auth, authAny, AuthenticatedRequest } from '../middleware/auth';
import { Demo, DemoModel } from '../db_schema/demo';
import { ExplanationRunStatus } from '../db_schema/explanations';
import { Project, ProjectModel } from '../db_schema/project';
import { Service, ServiceModel, ServiceType } from '../db_schema/services';
import { callServices } from '../services/utils';


export const iterationStepRouter = express.Router();

iterationStepRouter.get('/', authAny, async (req: any, res) => {

    try{
        const projectId: string = req.query.projectId as string;
        const userId: string = req.user._id;
        const steps = await IterationStepModel.find({ project: projectId, user: userId})

        if (!steps) { 
            return res.status(404).send({ message: 'ERROR: No steps found.' });
        }

        res.send({
            data: steps
        });
    }
    catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }

});

iterationStepRouter.get('/:id', authAny, async (req, res) => {
    try{
        const id =  req.params.id;
        const run = await IterationStepModel.findOne({ _id: id});

        if (!run) { 
            return res.status(404).send({ message: 'No iteration step found.' });
        }

        res.send({
            data: run
        });
    }
    catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }
});

iterationStepRouter.post('', authAny, async (req: AuthenticatedRequest, res) => {

    try {
        if (!req.user) {
            return res.status(401).send('Create iteration step failed.');
        }
        console.log("create iter step");
        let iterStepData = req.body.data as IterationStep;
        iterStepData.user = req.user._id;
        iterStepData.task.model = iterStepData.task.model;

        const step = new IterationStepModel(iterStepData);
        if (!step) {
            return res.status(403).send('Iteration Step could not be created.');
        }
        await step.save();

        const demo: Demo | null = await DemoModel.findOne({ _id: iterStepData?.project});
        if(demo){
            console.log('Extract explanations from demo.');
            step.globalExplanation = demo.globalExplanation;
            step.globalExplanation.status = ExplanationRunStatus.FINISHED;
            await step.save();
        }

        res.send({
            status: true,
            message: 'Iteration Step is created.',
            data: step
        });
    }
    catch (ex) {
        console.log(ex);
        res.status(500);
    }

});


iterationStepRouter.post('/cancel', authAny, async (req, res) => {

    try {

        const id = req.body.iterationStepId;
        console.log('Cancel: ' + id);

        const step = await IterationStepModel.findById(id);

        if (!step) {
            return res.status(404).send({ message: 'No step found.' });
        }

        if (!step.plan) {
            return res.status(404).send({ message: 'No step found.' });
        }

        const forwardCancelToPlanningService = step.plan.status == PlanRunStatus.running;

        step.status = StepStatus.unknown;
        step.plan.status = PlanRunStatus.canceled;
        await step.save();

        if(forwardCancelToPlanningService){
            let project = await ProjectModel.findById(step.project) as Project;
            if(!project){
                project = await DemoModel.findById(step.project) as Project;
            }
    
            if (!project) {
                console.log('[Cancel Plan Computation] Project does not exist.')
                step.plan.status = PlanRunStatus.failed;
                await step.save();
                return res.status(200).send({status: false, message:'Project does not exists.'});
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
                step.plan.status = PlanRunStatus.failed;
                await step.save();
                return res.status(200).send({status: false, message: 'No existing planner service selected.'});
            }
    
            const success = await callServices(services, JSON.stringify({id}), '/cancel');
            if(!success){
                step.plan.status = PlanRunStatus.failed;
                await step.save();
                console.log('[Cancel Plan Computation] No selected planner service reachable.')
                return res.status(201).send({status: false, message:'No selected planner service reachable.'});
            }
        }

    
        res.send({
            data: {canceled: true}
        });
    } catch (ex) {
        res.status(500);
    }

});



iterationStepRouter.put('/:id', authAny, async (req, res) => {
    try {
        const refId = req.params.id;
        const step: IterationStep | null = await IterationStepModel.findOne({ _id: refId});

        if (!step) {
            return res.status(404).send('update step failed');
        }

        const stepData: IterationStep = req.body.data as IterationStep;

        step.status = stepData.status;

        await step.save();

        res.send({
            status: true,
            message: 'Step updated',
            data: step
        });

    } catch (ex) {
        res.status(500);
    }

});


iterationStepRouter.delete('/:id', auth, async (req, res) => {

    try {
        const result = await IterationStepModel.deleteOne({ _id: req.params.id });

        if (!result) {
            return res.status(404).send({ message: 'No step found.' });
        }
    
        res.send({
            data: {deleted: true}
        });
    } catch (ex) {
        res.status(500);
    }

});


