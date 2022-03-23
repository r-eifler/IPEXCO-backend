import { UserStudyData } from './../../db_schema/user-study/user-study-store';
import { IterationStep, IterationStepModel, StepStatus } from './../../db_schema/iteration_step';
import { PlanProperty} from '../../db_schema/plan-properties/plan_property';
import { PropertyCheck } from '../../planner/property_check';
import express from 'express';

import { PlanRun, RunStatus, DepExplanationRun } from '../../db_schema/iteration_step';
import { ExplanationCall, PlanCall } from '../../planner/general_planner';
import { auth, authUserStudy } from '../../middleware/auth';
import { Project } from '../../db_schema/project';
import { environment } from '../../app';


export const plannerRouter = express.Router();

plannerRouter.post('/plan', authUserStudy, async (req: any, res) => {

    const saveRun: boolean = req.query.save ? JSON.parse(req.query.save) : false;
    const iterStepData = req.body.data;

    try {

        let iterStep: IterationStep | null = null;
        if (saveRun){
            iterStep = await IterationStepModel.findOne({ _id: iterStepData._id });
        }
        else {
            iterStep = new IterationStepModel(iterStepData);
        }

        if (! iterStep ){;
            return res.status(403).send('plan can not be computed');
        }

        const planRun: PlanRun = {name: 'Plan ', status:  RunStatus.pending};
        iterStep.plan = planRun;

        try {
            // load project and plan-properties and compute plan
            await iterStep.populate('hardGoals').execPopulate();
            await iterStep.populate('softGoals').execPopulate();
            await iterStep.populate('task.basetask').execPopulate();

            const planner = new PlanCall(environment.experimentsRootPath, iterStep);

            if (saveRun) {
                iterStep.plan.status = RunStatus.running;

                await iterStep.save();
            }

            const planFound = await planner.executeRun();
            planner.tidyUp();

            // let satPlanProperties: PlanProperty[] = [];
            // if (planFound) {
            //     // check which plan properties are satisfied by the plan
            //     const planProperties: PlanProperty[] = iterStep.hardGoals.concat(iterStep.softGoals);
            //     const propertyChecker = new  PropertyCheck(environment.experimentsRootPath, planProperties, plan);
            //     satPlanProperties = await propertyChecker.executeRun();
            //     // console.log('Sat properties:');
            //     // console.log(propNames);
            //     propertyChecker.tidyUp();
            // }

            iterStep.plan.status = planFound ? RunStatus.finished : RunStatus.noSolution;
            terStep.status = planFound ? StepStatus.solvable : StepStatus.unsolvable;
            iterStep.plan.satPlanProperties = planFound ? iterStep.hardGoals : [];

            if (saveRun) {
                await iterStep.save();
                console.log('saved');
            }
            console.log(iterStep);
            res.send({
                status: true,
                message: 'run successful',
                data: iterStep,
            });
        }
        catch (ex) {
            console.warn(ex.message);
            iterStep.plan.status = RunStatus.failed;
            if (req.query.save) {
                await iterStep.save();
            }
            res.send({
                status: true,
                message: 'run failed',
                data: iterStep
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
        const stepId =  req.params.id;
        const iterStep = await IterationStepModel.findOne({ _id: stepId})
        .populate('hardGoals')
        .populate('softGoals')
        .populate('relaxations')
        .populate('depExplanations');

        if (!iterStep) { 
            return res.status(404).send({ message: 'no run found' }); 
        }

        const depExp = req.body as DepExplanationRun;
        depExp.status = RunStatus.pending;

        iterStep.depExplanations.push(depExp);
        await iterStep.save();

        const planner = new ExplanationCall(environment.experimentsRootPath, iterStep, depExp);
        planner.executeRun().then( async () => {

            planner.tidyUp();
            
            depExp.status = RunStatus.finished;
            await iterStep.save();

            res.send({
                status: true,
                message: 'run successful',
                data: iterStep,
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

        const stepId =  req.params.id;
        const iterStep = await IterationStepModel.findOne({ _id: stepId});

        if (!iterStep) { 
            return res.status(404).send({ message: 'no run found' }); 
        }

        const depExp = req.body as DepExplanationRun;
        depExp.status = RunStatus.finished;

        iterStep.depExplanations.push(depExp);
        await iterStep.save();

        res.send({
            status: true,
            message: 'run saved successfully',
            data: iterStep,
        });
    }
    catch (ex) {
        res.send(ex.message);
    }
});


