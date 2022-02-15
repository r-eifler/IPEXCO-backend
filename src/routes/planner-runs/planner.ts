import { PlanProperty, PlanPropertyModel } from '../../db_schema/plan-properties/plan_property';
import { PropertyCheck } from '../../planner/property_check';
import express from 'express';
import mongoose from 'mongoose';

import { ExplanationRunModel, PlanRun, PlanRunModel, RunStatus, ExplanationRun } from '../../db_schema/run';
import { ExplanationCall, PlanCall } from '../../planner/general_planner';
import { USExplanationRunModel, USPlanRunModel } from '../../db_schema/user-study/user-study-store';
import { auth, authUserStudy } from '../../middleware/auth';
import { Project } from '../../db_schema/project';
import { environment } from '../../app';


export const plannerRouter = express.Router();

plannerRouter.post('/plan', authUserStudy, async (req: any, res) => {

    const saveRun: boolean = req.query.save ? JSON.parse(req.query.save) : false;

    try {
        const planRun: PlanRun = new PlanRunModel({
            name: req.body.name,
            status: RunStatus.pending,
            type: req.body.type,
            project: req.body.project,
            planProperties: req.body.planProperties,
            hardGoals: req.body.hardGoals,
            previousRun: req.body.previousRun,
        });
        if (!planRun) {
            return res.status(403).send('run could not be stored');
        }
        if (saveRun) {
            await planRun.save();
        }

        if (req.userStudyUser) {
            await planRun.save();
            const usPlanRun = new USPlanRunModel({
                user: req.userStudyUser._id,
                planRun: planRun._id,
            });
            await usPlanRun.save();
            // console.log(usPlanRun);
        }

        try {
            // load project and plan-properties and compute plan
            await planRun.populate('project').execPopulate();
            await planRun.populate('planProperties').execPopulate();
            // console.log('Hard Goals:');
            // console.log(planRun.hardGoals);

            const planner = new PlanCall(environment.experimentsRootPath, planRun);
            const planFound = await planner.executeRun();
            // console.log('Plan Found: ' + planFound);
            planner.tidyUp();

            let propNames: string[] = [];
            if (planFound) {
                // check which plan properties are satisfied by the plan
                const planProperties: PlanProperty[] = await PlanPropertyModel
                    .find({ project: (planRun.project as Project)._id, isUsed: true });
                const propertyChecker = new  PropertyCheck(environment.experimentsRootPath, planProperties, planRun);
                propNames = await propertyChecker.executeRun();
                // console.log('Sat properties:');
                // console.log(propNames);
                propertyChecker.tidyUp();
            }

                planRun.status = planFound ? RunStatus.finished : RunStatus.noSolution;
                planRun.satPlanProperties = propNames;

            if (saveRun) {
                await planRun.save();
                await planRun.populate('explanationRuns').execPopulate();
            }

            res.send({
                status: true,
                message: 'run successful',
                data: planRun,
            });
        }
        catch (ex) {
            planRun.status = RunStatus.failed;
            if (req.query.save) {
                await planRun.save();
            }
            res.send({
                status: true,
                message: 'run failed',
                data: planRun
            });
        }
    }
    catch (ex) {
        console.warn(ex.message);
        res.send(ex.message);
    }
});

plannerRouter.post('/mugs/:id', auth, async (req, res) => {
    try {
        const planRunId =  req.params.id;
        const planRun = await PlanRunModel.findOne({ _id: planRunId}).populate('project');
        if (!planRun) { return res.status(404).send({ message: 'no run found' }); }

        const explanationRun = new ExplanationRunModel({
            name: req.body.name,
            status: RunStatus.pending,
            type: req.body.type,
            planProperties: req.body.planProperties,
            hardGoals: req.body.hardGoals,
            softGoals: req.body.softGoals,
            planRun: planRunId,
        });
        if (!explanationRun) {
            return res.status(403).send('run could not be stored');
        }
        await explanationRun.save();

        await explanationRun.populate('planProperties').execPopulate();

        const planner = new ExplanationCall(environment.experimentsRootPath, (planRun.project as Project), explanationRun);
        planner.executeRun().then( async () => {

            planner.tidyUp();

            await ExplanationRunModel.updateOne({ _id: explanationRun._id},
                { $set: { result: explanationRun.result, log: explanationRun.log, status: RunStatus.finished} });

            const newExpRun: ExplanationRun | null = await ExplanationRunModel.findOne({ _id: explanationRun._id});
            if (! newExpRun) {
                return res.status(403).send('run could not be stored');
            }
            await PlanRunModel.updateOne({ _id: planRunId}, { $set: { explanationRuns: planRun.explanationRuns.concat([newExpRun])}});

            // return the plan run with new questionRun elem
            const runReturn = await PlanRunModel.findOne({ _id: planRunId}).populate('planProperties').populate('explanationRuns');

            res.send({
                status: true,
                message: 'run successful',
                data: runReturn,
            });
        });
    }
    catch (ex) {
        res.send(ex.message);
    }
});


plannerRouter.post('/mugs-save/:id', authUserStudy, async (req: any, res) => {
    try {
        if (! req.userStudyUser) {
            return res.status(401).send({ message: 'Access denied.' });
        }

        const planRunId =  req.params.id;
        const planRun = await PlanRunModel.findOne({ _id: planRunId}).populate('project');
        if (!planRun) { return res.status(404).send({ message: 'no run found' }); }

        const explanationRun = new ExplanationRunModel({
            name: req.body.name,
            status: RunStatus.finished,
            type: req.body.type,
            planProperties: req.body.planProperties,
            hardGoals: req.body.hardGoals,
            softGoals: req.body.softGoals,
            planRun: planRunId,
        });

        if (!explanationRun) {
            return res.status(403).send('run could not be stored');
        }

        await explanationRun.save();
        await PlanRunModel.updateOne({ _id: planRunId}, { $set: { explanationRuns: planRun.explanationRuns.concat([explanationRun])}});

        const usExpRun = new USExplanationRunModel({
            user: req.userStudyUser._id,
            explanationRun: explanationRun._id,
        });
        await usExpRun.save();


        res.send({
            status: true,
            message: 'run saved successfully',
            data: explanationRun,
        });
    }
    catch (ex) {
        res.send(ex.message);
    }
});


