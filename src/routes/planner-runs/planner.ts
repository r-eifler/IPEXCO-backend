import { CallResult } from './../../planner/python-call';
import { IterationStep, IterationStepModel, RelaxationExplanationRun, StepStatus } from './../../db_schema/iteration_step';
import { PlanProperty} from '../../db_schema/plan-properties/plan_property';
import { PropertyCheck } from '../../planner/property_check';
import express from 'express';

import { PlanRun, RunStatus, DepExplanationRun } from '../../db_schema/iteration_step';
import { ExplanationCall, PlanCall, RelaxExplanationCall } from '../../planner/general_planner';
import { auth, authUserStudy } from '../../middleware/auth';
import { Project } from '../../db_schema/project';
import { environment } from '../../app';
import { PlanningTaskRelaxationSpaceModel } from '../../db_schema/relaxations';


export const plannerRouter = express.Router();

plannerRouter.post('/plan', authUserStudy, async (req: any, res) => {

    const saveRun: boolean = req.query.save ? JSON.parse(req.query.save) : false;
    console.log("Save run: " + saveRun);
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

        if (! iterStep.plan){
            const planRun: PlanRun = {name: 'Plan ', status:  RunStatus.pending};
            iterStep.plan = planRun;
        }

        try {
            // load project and plan-properties and compute plan
            await iterStep.populate('hardGoals').execPopulate();
            await iterStep.populate('softGoals').execPopulate();
            await iterStep.populate('task.basetask').execPopulate();

            const planner = new PlanCall(environment.experimentsRootPath, iterStep);

            iterStep.plan.status = RunStatus.running;

            if (saveRun) {
                await iterStep.save();
            }

            const callResult = await planner.executeRun();

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

            iterStep.plan.status = callResult.planFound ? RunStatus.finished : RunStatus.noSolution;
            iterStep.status = callResult.planFound ? StepStatus.solvable : StepStatus.unsolvable;
            iterStep.plan.satPlanProperties = callResult.planFound ? iterStep.hardGoals.filter(hg => !!hg._id).map(hg => hg._id) : [];

            if (saveRun) {
                await iterStep.save();
                console.log('saved');
            }

            await iterStep.depopulate('hardGoals').execPopulate();
            await iterStep.depopulate('softGoals').execPopulate();

            console.log("Final Iteration Step");
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
        .populate('task.basetask');

        if (!iterStep) { 
            return res.status(404).send({ message: 'no run found' }); 
        }

        // console.log(iterStep);

        const depExpData = req.body as DepExplanationRun;
        depExpData.status = RunStatus.running;

        iterStep.depExplanation = depExpData;
        await iterStep.save();
        
        await iterStep.populate('depExplanation.hardGoals').execPopulate();
        await iterStep.populate('depExplanation.softGoals').execPopulate();

        const depExp = iterStep.depExplanation

        console.log(depExp);

        const planner = new ExplanationCall(environment.experimentsRootPath, iterStep, depExp);
        let succesful = await planner.executeRun()
        planner.tidyUp();
        
        depExp.status = succesful ? RunStatus.finished : RunStatus.failed;

        await iterStep.save();
        await iterStep.depopulate('depExplanation.hardGoals').execPopulate();
        await iterStep.depopulate('depExplanation.softGoals').execPopulate();
        await iterStep.depopulate('hardGoals').execPopulate();
        await iterStep.depopulate('softGoals').execPopulate();
        console.log(iterStep.depExplanation);

        res.send({
            status: true,
            message: 'run executed',
            data: iterStep,
        });

    }
    catch (ex) {
        console.log(ex.message);
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

        iterStep.depExplanation = depExp;
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


plannerRouter.post('/relax_exp/:id', auth, async (req, res) => {
    try {
        const stepId =  req.params.id;

        const iterStep: IterationStep | null = await IterationStepModel.findOne({ _id: stepId})
        .populate('hardGoals')
        .populate('softGoals')
        .populate('depExplanations')
        .populate('task.basetask')
        .populate('depExplanations.hardGoals')
        .populate('depExplanations.softGoals');

        if (!iterStep) { 
            return res.status(404).send({ message: 'no run found' }); 
        }

        console.log(iterStep);

        const relaxSpaces = await PlanningTaskRelaxationSpaceModel.find({ project: iterStep.project as string});

        for (let relaxationSpace of relaxSpaces) {

            console.log(relaxationSpace);

            let relaxExp :RelaxationExplanationRun = {name: 'relax_exp', status: RunStatus.running, relaxationSpace: relaxationSpace}

            iterStep.relaxationExplanations.push(relaxExp);

            await iterStep.save();

            relaxExp = iterStep.relaxationExplanations[iterStep.relaxationExplanations.length - 1]

            // console.log(depExp);

            const planner = new RelaxExplanationCall(environment.experimentsRootPath, iterStep, relaxExp, relaxationSpace.dimensions);
            let succesful = await planner.executeRun();

            // planner.tidyUp();

            relaxExp.status = succesful ? RunStatus.finished : RunStatus.failed;
            await iterStep.save();
        }

        await iterStep.depopulate('hardGoals').execPopulate();
        await iterStep.depopulate('softGoals').execPopulate();

        res.send({
            status: true,
            message: 'run successful',
            data: iterStep,
        });
    }
    catch (ex) {
        console.log(ex.message);
        res.send(ex.message);
    }
});


