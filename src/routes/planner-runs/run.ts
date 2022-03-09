import { UserStudyDataModel } from './../../db_schema/user-study/user-study-store';
import { DepExplanationRunModel, IterationStep, IterationStepModel, RelaxationExplanationRun, RelaxationExplanationRunModel } from './../../db_schema/iteration_step';
import express from 'express';
import mongoose from 'mongoose';

import { DepExplanationRun, PlanRun} from '../../db_schema/iteration_step';
import { deleteResultFile } from '../../planner/pddl_file_utils';
import { deleteDepExplanation, deleteIterationStep, deleteRelaxationExplanation } from '../utils';
import { authUserStudy } from '../../middleware/auth';


export const runRouter = express.Router();

runRouter.post('/iter-step', authUserStudy, async (req: any, res) => {

    try {
        const iterStepData = req.body.data as IterationStep;

        const iterationStep = new IterationStepModel(iterStepData);
        if (!iterationStep) {
            return res.status(403).send('Iteration Step could not be created.');
        }
        let data = await iterationStep.save();

        if (req.userStudyUser) {
            const userstudyData = await UserStudyDataModel.findOne({ user: req.userStudyUser._id});

            if (!userstudyData) {
                return res.status(403).send('Iteration Step could not be created.');
            }

            userstudyData.demoSteps.push(data);
            data = await iterationStep.save(); 

        }

        res.send({
            status: true,
            message: 'Plan Property is stored.',
            data
        });
    }

    catch (ex) {
        res.send(ex.message);
    }

});

runRouter.get('/iter-step/:id', async (req, res) => {
    const id =  req.params.id;
    const run = await IterationStepModel.findOne({ _id: id})
        .populate('hardGoals')
        .populate('softGoals')
        .populate('relaxations')
        .populate('depExplanations');

    if (!run) { 
        return res.status(404).send({ message: 'No iteration step found.' });
    }

    res.send({
        data: run
    });

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




runRouter.get('/dep-explanation/:id', async (req, res) => {
    const run = await DepExplanationRunModel.findOne({ _id: req.params.id})
        .populate('hardGoals')
        .populate('softGoals')
        .populate('relaxationExplanations');

    if (!run) { 
        return res.status(404).send({ message: 'no explanation found' }); 
    }

    res.send({
        data: run
    });
});

runRouter.delete('/dep-explanation/:id', async (req, res) => {
    const depExp: DepExplanationRun | null = await DepExplanationRunModel.findOne({ _id: req.params.id });

    if (!depExp) {
        return res.status(404).send({ message: 'No explanation found.' });
    }

    await deleteDepExplanation(depExp);

    res.send({
        data: depExp
    });
});

runRouter.get('/relaxation-explanation/:id', async (req, res) => {
    const run = await RelaxationExplanationRunModel.findOne({ _id: req.params.id})
        .populate('dependency');

    if (!run) { 
        return res.status(404).send({ message: 'no explanation found' }); 
    }

    res.send({
        data: run
    });
});

runRouter.delete('/relaxation-explanation/:id', async (req, res) => {
    const relaxExp: RelaxationExplanationRun | null = await RelaxationExplanationRunModel.findOne({ _id: req.params.id });

    if (!relaxExp) {
        return res.status(404).send({ message: 'No explanation found.' });
    }

    await deleteRelaxationExplanation(relaxExp);

    res.send({
        data: relaxExp
    });
});


