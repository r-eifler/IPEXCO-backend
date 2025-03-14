import express from 'express';
import { authAny, authService } from '../middleware/auth';

import { DemoModel } from '../db_schema/demo';
import { IterationStep, IterationStepModel, PlanRunStatus, StepStatus } from '../db_schema/iteration_step';
import { PlanProperty, PlanPropertyModel } from '../db_schema/plan-properties/plan_property';
import { Project, ProjectModel } from '../db_schema/project';
import { PlannerRequest, PlannerResponse, PropertyCheckerResponse, PropertyCheckerResponseZ, PropertyCheckRunStatus } from '../db_schema/service_communication';
import { Service, ServiceModel, ServiceType } from '../db_schema/services';
import { checkProperties } from '../services/pddl/property_check';
import { callServices } from '../services/utils';

export const plannerRouter = express.Router();

plannerRouter.post('/plan-step/:id', authAny, async (req: any, res) => {

    try {

        const refId = req.params.id;
        console.log('Compute plan of: ' + refId)
        const iterationStep = await IterationStepModel.findOne({ _id: refId});

        if (iterationStep == null) {
            console.log('[Plan Computation] Iteration Step does not exist.')
            return res.status(404).send({status: false, message:'Iteration step does not exist.'});
        }

        iterationStep.plan = {
            createdAt: new Date(Date.now()),
            status: PlanRunStatus.RUNNING
        }
        await iterationStep.save();
        
        const model = iterationStep.task.model
        const plan_properties = await PlanPropertyModel.find({ project: iterationStep.project}) as PlanProperty[];

        const enforced_goals = plan_properties.filter(pp => !pp._id ? false : iterationStep.hardGoals.includes(pp._id?.toString()));

        const baseURL = process.env.BASE_URL || 'http://host.docker.internal:3000'
        let payload: PlannerRequest = {
            callback:baseURL + '/api/planner/plan-step/finished/' + refId,
            model: model,
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
            iterationStep.plan.status = PlanRunStatus.FAILED;
            await iterationStep.save();
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
            console.log('[Plan Computation] No planner service selected.')
            iterationStep.plan.status = PlanRunStatus.FAILED;
            await iterationStep.save();
            return res.status(200).send({status: false, message: 'No existing planner service selected.'});
        }

        const success = await callServices(services, JSON.stringify(payload), '/plan');
        if(!success){
            iterationStep.plan.status = PlanRunStatus.FAILED;
            await iterationStep.save();
            console.log('[Plan Computation] No selected planner service reachable.')
            return res.status(201).send({status: false, message:'No selected planner service reachable.'});
        }

        res.status(201).send({status: true, message:'Plan computation registered'});

    } catch (ex : any) {
        console.log(ex);
        res.status(404).send(ex.message);
    }
});


plannerRouter.post('/plan-step/finished/:id', authService, async (req: any, res) => {

    try {

        // console.log(req.body)
        const refId = req.params.id;
        const iterationStep = await IterationStepModel.findOne({ _id: refId});

        if (!iterationStep) {
            return res.status(404).send('update step failed');
        }

        if (!iterationStep.plan) {
            return res.status(404).send('update plan failed');
        }

        if (iterationStep.plan.status == PlanRunStatus.CANCELED) {
            return res.status(200).send('Plan run was canceled.');
        }

        if (iterationStep.plan.status == PlanRunStatus.UNSOLVABLE || 
            iterationStep.plan.status == PlanRunStatus.FAILED 
            // TODO we could update failed runs if multiple planner run in parallel
        ) {
            console.log('Got repeated response for plan call: ' + iterationStep._id);
            return res.status(200).send('Plan run already set.');
        }

        const response = req.body as PlannerResponse;
        const actions = response.actions;
        const status = response.status;

        if(status === PlanRunStatus.NO_PLAN_FOUND){
            iterationStep.status = StepStatus.UNKNOWN
            iterationStep.plan.status = PlanRunStatus.NO_PLAN_FOUND;
            await iterationStep.save();
        }

        if(status === PlanRunStatus.UNSOLVABLE){
            iterationStep.status = StepStatus.UNSOLVABLE
            iterationStep.plan.status = PlanRunStatus.UNSOLVABLE;
            await iterationStep.save();
        }

        if(status === PlanRunStatus.FAILED){
            iterationStep.status = StepStatus.UNKNOWN;
            iterationStep.plan.status = PlanRunStatus.FAILED;
            await iterationStep.save();
        }

        if(status === PlanRunStatus.SOLVED){
            iterationStep.status = StepStatus.SOLVABLE;
            iterationStep.plan.actions = actions;
            iterationStep.plan.satisfied_properties = undefined
            await iterationStep.save()
            checkProperties(iterationStep);
        }
        
        return res.status(200).send();

    } catch (ex : any) {
        console.log(ex);
        res.status(404).send(ex.message);
    }
});




plannerRouter.post('/plan-step/checked/:id', authService, async (req: any, res) => {

    try {

        // console.log(req.body)
        const refId = req.params.id;
        const iterationStep = await IterationStepModel.findOne({ _id: refId});

        if (!iterationStep) {
            return res.status(404).send('update step failed');
        }

        if (!iterationStep.plan) {
            return res.status(404).send('update plan failed');
        }

        if (iterationStep.plan.status == PlanRunStatus.CANCELED) {
            return res.status(200).send('Plan run was canceled.');
        }

        if (iterationStep.plan.status == PlanRunStatus.UNSOLVABLE || 
            iterationStep.plan.status == PlanRunStatus.SOLVED || 
            iterationStep.plan.status == PlanRunStatus.FAILED 
        ) {
            console.log('Got repeated response for check call: ' + iterationStep._id);
            return res.status(200).send('Plan run already checked.');
        }

        const response = PropertyCheckerResponseZ.parse(req.body);
        const status = response.status;
        const satisfiedProperties = response.satisfiedProperties;

        if(status === PropertyCheckRunStatus.CANCELED || 
            status == PropertyCheckRunStatus.FAILED ||
            satisfiedProperties === null
        ){
            iterationStep.status = StepStatus.UNKNOWN;
            iterationStep.plan.status = PlanRunStatus.FAILED;
            iterationStep.plan.actions = undefined;
            await iterationStep.save();
            return res.status(200).send();
        }

        if(status === PropertyCheckRunStatus.FINISHED){
            iterationStep.status = StepStatus.SOLVABLE;
            iterationStep.plan.status = PlanRunStatus.SOLVED;
            
            console.log('Enforced Properties')
            console.log(iterationStep.hardGoals);
            console.log('Satisfied Properties');
            console.log(satisfiedProperties);
    
            // Check all enforced goals also satisfied
            if(! iterationStep.hardGoals.map(id => id.toString()).every(id => satisfiedProperties.includes(id))){
                iterationStep.plan.status = PlanRunStatus.FAILED
                iterationStep.status = StepStatus.UNKNOWN;
                await iterationStep.save();
                throw Error('Not all enforced goals are identified as satisfied by the property checker!');
            }

            iterationStep.plan.satisfied_properties =  satisfiedProperties.filter(id => id != undefined);

            await iterationStep.save()
        
        }
        return res.status(200).send();

    } catch (ex : any) {
        console.log(ex);
        res.status(404).send(ex.message);
    }
});