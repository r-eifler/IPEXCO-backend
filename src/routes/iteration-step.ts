import { UserStudyDataModel, UserStudyDemoData } from '../db_schema/user-study/user-study-store';
import { IterationStep, IterationStepModel } from '../db_schema/iteration_step';
import express from 'express';
import { authUserStudy } from '../middleware/auth';


export const iterationStepRouter = express.Router();

iterationStepRouter.get('/', authUserStudy, async (req, res) => {
    const projectId : string = req.query.projectId as string;
    const steps = await IterationStepModel.find({ project: projectId})

    if (!steps) { 
        return res.status(404).send({ message: 'ERROR: No step found.' });
    }

    res.send({
        data: steps
    });

});

iterationStepRouter.get('/:id', authUserStudy, async (req, res) => {
    const id =  req.params.id;
    const run = await IterationStepModel.findOne({ _id: id});

    if (!run) { 
        return res.status(404).send({ message: 'No iteration step found.' });
    }

    res.send({
        data: run
    });

});

iterationStepRouter.post('', authUserStudy, async (req: any, res) => {

    try {
        console.log("create iter step");
        let iterStepData = req.body.data as IterationStep;
        iterStepData.task.model = JSON.stringify(iterStepData.task.model)

        const iterationStep = new IterationStepModel(iterStepData);
        if (!iterationStep) {
            return res.status(403).send('Iteration Step could not be created.');
        }
        await iterationStep.save();

        // TODO
        // if (req.userStudyUser) {
        //     console.log("Save for user study ...");
        //     const userStudyData = await UserStudyDataModel.findOne({ user: req.userStudyUser._id});

        //     if (!userStudyData) {
        //         return res.status(403).send('Iteration Step could not be created.');
        //     }

        //     if(userStudyData.demosData.length == 0 ||
        //         userStudyData.demosData[userStudyData.demosData.length - 1].demo.toString() != iterationStep.project.toString()){
        //             let demoData: UserStudyDemoData = {demo: iterationStep.project as string, iterationSteps: []}
        //             userStudyData.demosData.push(demoData);
        //     }

        //     userStudyData.demosData[userStudyData.demosData.length - 1].iterationSteps.push(iterationStep);
        //     // console.log(userStudyData)
        //     await userStudyData.save(); 
        // }


        console.log("------------------ New Iteration Step ---------------")
        console.log(iterationStep)
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




iterationStepRouter.put('/:id', authUserStudy, async (req, res) => {
    try {
        const refId = req.params.id;
        const step: IterationStep | null = await IterationStepModel.findOne({ _id: refId});

        if (!step) {
            return res.status(404).send('update step failed');
        }

        const stepData: IterationStep = req.body.data as IterationStep;

        step.status = stepData.status;
        // step.plan_run = stepData.plan_run
        // step.explanation_run = stepData.explanation_run
        // step.relaxationExplanations = stepData.relaxationExplanations

        await step.save();

        console.log("------------------ Updated Iteration Step ---------------")
        console.log(step)

        res.send({
            status: true,
            message: 'Step updated',
            data: step
        });

    } catch (ex) {
        res.status(500);
    }

});


iterationStepRouter.delete('/:id', authUserStudy, async (req, res) => {

    const step: IterationStep | null = await IterationStepModel.findOne({ _id: req.params.id });

    if (!step) {
        return res.status(404).send({ message: 'No explanation found.' });
    }

    // TODO
    // await deleteIterationStep(step);

    res.send({
        data: step
    });

});




