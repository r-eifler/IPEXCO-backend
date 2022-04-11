import { UserStudyDataModel } from './../../db_schema/user-study/user-study-store';
import { IterationStep, IterationStepModel, RelaxationExplanationRun } from './../../db_schema/iteration_step';
import express from 'express';
import mongoose from 'mongoose';

import { deleteIterationStep } from '../utils';
import { authUserStudy } from '../../middleware/auth';


export const runRouter = express.Router();

runRouter.post('/iter-step', authUserStudy, async (req: any, res) => {

    try {
        const iterStepData = req.body.data as IterationStep;
        console.log(iterStepData);
        console.log(iterStepData.task.initUpdates);

        const iterationStep = new IterationStepModel(iterStepData);
        if (!iterationStep) {
            return res.status(403).send('Iteration Step could not be created.');
        }
        await iterationStep.save();
        await iterationStep.populate('depExplanations').execPopulate();
        await iterationStep.populate('task.basetask').execPopulate();
        await iterationStep.populate('plan.satPlanProperties').execPopulate();

        if (req.userStudyUser) {
            const userstudyData = await UserStudyDataModel.findOne({ user: req.userStudyUser._id});

            if (!userstudyData) {
                return res.status(403).send('Iteration Step could not be created.');
            }

            userstudyData.demoSteps.push(iterationStep);
            await userstudyData.save(); 
        }
        console.log(iterationStep.task.initUpdates);
        res.send({
            status: true,
            message: 'Iteration Step is stored.',
            data: iterationStep
        });
    }

    catch (ex) {
        console.log(ex.message);
        res.send(ex.message);
    }

});


runRouter.get('/iter-step/', async (req, res) => {
    const projectId : string = req.query.projectId as string;
    const steps = await IterationStepModel.find({ project: projectId})
        .populate('depExplanations')
        .populate('task.basetask')

    if (!steps) { 
        return res.status(404).send({ message: 'ERROR: No step found.' });
    }

    res.send({
        data: steps
    });

});

runRouter.get('/iter-step/:id', async (req, res) => {
    const id =  req.params.id;
    const run = await IterationStepModel.findOne({ _id: id})
        .populate('depExplanations')
        .populate('task.basetask')

    if (!run) { 
        return res.status(404).send({ message: 'No iteration step found.' });
    }

    res.send({
        data: run
    });

});

runRouter.put('/iter-step/:id', async (req, res) => {
    try {
        const refId = req.params.id;
        const step: IterationStep | null = await IterationStepModel.findOne({ _id: refId});

        if (!step) {
            return res.status(404).send('update step failed');
        }

        const stepData: IterationStep = req.body.data as IterationStep;

        step.status = stepData.status;
        step.plan = stepData.plan
        step.depExplanations = stepData.depExplanations

        await step.save();

        res.send({
            status: true,
            message: 'Step updated',
            data: step
        });

    } catch (ex) {
        res.send(ex.message);
    }

});


runRouter.delete('/iter-step/:id', async (req, res) => {

    const step: IterationStep | null = await IterationStepModel.findOne({ _id: req.params.id });

    if (!step) {
        return res.status(404).send({ message: 'No explanation found.' });
    }

    await deleteIterationStep(step);

    res.send({
        data: step
    });

});




