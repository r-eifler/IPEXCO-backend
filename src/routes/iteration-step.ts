import { IterationStep, IterationStepModel, PlanRunStatus, StepStatus } from '../db_schema/iteration_step';
import express from 'express';
import { auth, authAny, AuthenticatedRequest } from '../middleware/auth';
import { Demo, DemoModel } from '../db_schema/demo';
import { ExplanationRunStatus } from '../db_schema/explanations';


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
        iterStepData.task.model = JSON.stringify(iterStepData.task.model)

        const iterationStep = new IterationStepModel(iterStepData);
        if (!iterationStep) {
            return res.status(403).send('Iteration Step could not be created.');
        }
        await iterationStep.save();

        const demo: Demo | null = await DemoModel.findOne({ _id: iterStepData?.project});
        if(demo){
            console.log('Extract explanations from demo.');
            iterationStep.globalExplanation = demo.globalExplanation;
            iterationStep.globalExplanation.status = ExplanationRunStatus.finished;
            iterationStep.save();
        }

        res.send({
            status: true,
            message: 'Iteration Step is created.',
            data: iterationStep
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

        step.status = StepStatus.unknown;
        step.plan.status = PlanRunStatus.canceled;
        step.save();

        const plannerServiceURL = process.env.PLANNER_SERVICE
        const plannerRequest = new Request(plannerServiceURL + '/plan/cancel', 
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    authorization: "Bearer " + process.env.PLANNER_KEY
                },
                body: JSON.stringify({id}),
            }
        )

        fetch(plannerRequest).then
            (resp => console.log("Cancel computation request submitted."),
            error => console.log(error)
        )
    
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


