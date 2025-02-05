import { auth, authAny, authPlanner } from '../middleware/auth';
import express from 'express';

import { ExplainerModel, Planner, PlannerModel, Service } from '../db_schema/services';
import { IterationStep, IterationStepModel, PlanRunStatus, StepStatus } from '../db_schema/iteration_step';
import { PlanningTask, toPDDL } from '../db_schema/planning_task';
import { PlanProperty, PlanPropertyModel } from '../db_schema/plan-properties/plan_property';
import { PropertyCheck } from '../services/planner/property_check';
import { environment } from '../app';
import { callServices } from '../services/utils';
import { Project, ProjectModel } from '../db_schema/project';
import { PlannerRequest, PlannerResponse } from '../db_schema/service_communication';
import { RunStepsPage } from 'openai/resources/beta/threads/runs/steps';
import { DemoModel } from '../db_schema/demo';

export const plannerRouter = express.Router();

// plannerRouter.post('/plan-model', authAny, async (req: any, res) => {

//     try {

//         const plannerData: Planner = req.body.data as Planner;

//         const plannerModel = new PlannerModel(plannerData);

//         if (!plannerModel) {
//             return res.status(404).send('Create planner failed.');
//         }

//         let newPlanner: Planner | null = await plannerModel.save();

//         if (!newPlanner) {
//             return res.status(404).send('Create project failed.');
//         }
        
//         res.send({
//             status: true,
//             message: 'Planner registered',
//             data: newPlanner
//         });

//     } catch (ex : any) {
//         console.log(ex.message);
//         res.status(404).send(ex.message);
//     }
// });



plannerRouter.post('/plan-step/:id', authAny, async (req: any, res) => {

    try {

        const refId = req.params.id;
        console.log('Compute plan of: ' + refId)
        const iterationStep: IterationStep | null = await IterationStepModel.findOne({ _id: refId});

        if (!iterationStep) {
            console.log('[Plan Computation] Iteration Step does not exist.')
            return res.status(404).send('compute plan failed');
        }

        iterationStep.plan = {
            createdAt: new Date(Date.now()),
            status: PlanRunStatus.running
        }
        iterationStep.save();
        
        const model = iterationStep.task.model
        const plan_properties = await PlanPropertyModel.find({ project: iterationStep.project}) as PlanProperty[];

        const enforced_goals = plan_properties.filter(pp => !pp._id ? false : iterationStep.hardGoals.includes(pp._id?.toString()));

        const baseURL = process.env.BASE_URL || 'http://host.docker.internal:3000'
        let payload: PlannerRequest = {
            callback:baseURL + '/api/planner/plan-step/finished/' + refId,
            model: JSON.parse(model),
            goals: enforced_goals,
            hardGoals: enforced_goals.map(pp => pp._id).filter(pp => pp !== undefined),
            softGoals: [],
            id: iterationStep._id
        }

        let project = await ProjectModel.findById(iterationStep.project) as Project;
        if(!project){
            project = await DemoModel.findById(iterationStep.project) as Project;
        }

        if (!project) {
            console.log('[Plan Computation] Project does not exist.')
            iterationStep.plan.status = PlanRunStatus.failed;
            iterationStep.save();
            return res.status(200).send('compute plan failed');
        }

        const services: Service[] = [];
        for(const plannerId of project.settings.services.planners) {
            const planner = await PlannerModel.findById(plannerId);
            if(planner){
                services.push(planner);
            }
        }

        if (services.length === 0) {
            console.log('[Plan Computation] No selected planner service selected.')
            iterationStep.plan.status = PlanRunStatus.failed;
            iterationStep.save();
            return res.status(200).send('No existing planner service selected.');
        }

        const success = await callServices(services, JSON.stringify(payload), '/plan');
        if(!success){
            iterationStep.plan.status = PlanRunStatus.failed;
            iterationStep.save();
            console.log('[Plan Computation] No selected planner service reachable.')
            // res.status(500).send('No selected planner service reachable.');
        }

        res.status(201).send({success});

    } catch (ex : any) {
        console.log(ex);
        res.status(404).send(ex.message);
    }
});


plannerRouter.post('/plan-step/finished/:id', authPlanner, async (req: any, res) => {

    try {

        // console.log(req.body)
        const refId = req.params.id;
        const iterationStep: IterationStep | null = await IterationStepModel.findOne({ _id: refId});

        if (!iterationStep) {
            return res.status(404).send('update step failed');
        }

        if (!iterationStep.plan) {
            return res.status(404).send('update plan failed');
        }

        if (iterationStep.plan.status == PlanRunStatus.canceled) {
            return res.status(200).send('Plan run was canceled.');
        }

        if (iterationStep.plan.status == PlanRunStatus.not_solvable || 
            iterationStep.plan.status == PlanRunStatus.plan_found || 
            iterationStep.plan.status == PlanRunStatus.failed 
            // TODO we could update failed runs if multiple planner run in parallel
        ) {
            console.log('Got repeated response for plan call: ' + iterationStep._id);
            return res.status(200).send('Plan run already set.');
        }

        const response = req.body as PlannerResponse;
        const actions = response.actions;
        const status = response.status;

        console.log(status)
        // console.log(actions)

        if(status === PlanRunStatus.plan_found){
            iterationStep.plan.status = PlanRunStatus.plan_found;
            iterationStep.status = StepStatus.solvable;
            iterationStep.plan.actions = JSON.stringify(actions);

            // Check which properties are satisfied
            const plan_properties = (await PlanPropertyModel.find({ project: iterationStep.project}) as PlanProperty[]).filter(pp => pp._id && (iterationStep.hardGoals.includes(pp._id) || iterationStep.softGoals.includes(pp._id)));

            // TODO Numeric Plan Property check
            let check = new PropertyCheck(environment.experimentsRootPath, iterationStep, plan_properties);
            let sat_properties_ids = await check.executeRun();

            console.log('Enforced Properties')
            console.log(iterationStep.hardGoals);
            console.log('Satisfied Properties');
            console.log(sat_properties_ids);

            // Check all enforced goals also satisfied
            if(! iterationStep.hardGoals.map(id => id.toString()).every(id => sat_properties_ids.includes(id))){
                iterationStep.plan.status = PlanRunStatus.failed
                iterationStep.status = StepStatus.unknown;
                iterationStep.save();
                throw Error('Not all enforced goals are identified as satisfied by the property checker!');
            }

            iterationStep.plan.satisfied_properties =  sat_properties_ids.filter(id => id != undefined);

        }

        if(status === PlanRunStatus.not_solvable){
            iterationStep.status = StepStatus.unsolvable
            iterationStep.plan.status = PlanRunStatus.not_solvable;
        }

        if(status === PlanRunStatus.failed){
            iterationStep.status = StepStatus.unknown;
            iterationStep.plan.status = PlanRunStatus.failed;
        }

        // console.log(iterationStep.plan)
        iterationStep.save()
        
        res.send({
            status: true,
            message: 'Plan computation registered',
            data: true
        });

    } catch (ex : any) {
        console.log(ex);
        res.status(404).send(ex.message);
    }
});




