import { auth } from '../middleware/auth';
import express from 'express';

import { ExplainerModel, Planner, PlannerModel } from '../db_schema/runner';
import { IterationStep, IterationStepModel, PlanRunStatus } from '../db_schema/iteration_step';
import { PlanningTask } from '../db_schema/planning_task';
import { ProjectModel } from '../db_schema/project';
import { PlanProperty, PlanPropertyModel } from '../db_schema/plan-properties/plan_property';
import { PropertyCheck } from '../planner/property_check';
import { environment } from '../app';

export const runnerRouter = express.Router();

runnerRouter.post('/planner', auth, async (req: any, res) => {

    try {

        const plannerData: Planner = req.body.data as Planner;

        const plannerModel = new PlannerModel(plannerData);

        if (!plannerModel) {
            return res.status(404).send('Create planner failed.');
        }

        let newPlanner: Planner | null = await plannerModel.save();

        if (!newPlanner) {
            return res.status(404).send('Create project failed.');
        }
        
        res.send({
            status: true,
            message: 'Planner registered',
            data: newPlanner
        });

    } catch (ex : any) {
        console.log(ex.message);
        res.status(404).send(ex.message);
    }
});


runnerRouter.post('/planner/:id', auth, async (req: any, res) => {

    try {

        const refId = req.params.id;
        console.log('Compute plan of: ' + refId)
        const iterationStep: IterationStep | null = await IterationStepModel.findOne({ _id: refId});

        if (!iterationStep) {
            return res.status(404).send('update step failed');
        }

        iterationStep.plan = {
            createdAt: new Date(Date.now()),
            status: PlanRunStatus.running
        }
        iterationStep.save();
        
        let task = iterationStep.task
        let planning_task = new PlanningTask(task)
        let [domain, problem] = planning_task.toPDDL()


        const baseURL = process.env.BASE_URL
        let payload = JSON.stringify({
            callback:baseURL + '/api/runner/planner/finished/' + refId,
            domain,
            problem  
        })

        const plannerServiceURL = process.env.PLANNER_SERVICE
        const plannerRequest = new Request(plannerServiceURL + '/plan', 
            {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: payload,
            }
        )

        fetch(plannerRequest).then
            (resp => console.log("Plan computation request submitted."),
            error => console.log(error)
        )
        
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


runnerRouter.post('/planner/temp-goals/:id', auth, async (req: any, res) => {

    try {

        const refId = req.params.id;
        console.log('Compute plan of: ' + refId)
        const iterationStep: IterationStep | null = await IterationStepModel.findOne({ _id: refId});

        if (!iterationStep) {
            return res.status(404).send('update step failed');
        }

        iterationStep.plan = {
            createdAt: new Date(Date.now()),
            status: PlanRunStatus.running
        }
        iterationStep.save();
        
        const model = iterationStep.task.model
        const plan_properties = await PlanPropertyModel.find({ project: iterationStep.project}) as PlanProperty[];

        // console.log('Plan Properties: ') // + plan_properties)
        // for(let p of plan_properties){
        //     console.log(p._id?.toString())
        // }
        // console.log('Hard Goals: ' + iterationStep.hardGoals)
        // console.log('Found: ' + iterationStep.hardGoals.find(id => id == plan_properties[0]._id?.toString()))
        const enforced_goals = plan_properties.filter(pp => !pp._id ? false : iterationStep.hardGoals.includes(pp._id?.toString()));
        // console.log('ENFORCED Goals: ' + enforced_goals)
        const exp_settings = {
            plan_properties: enforced_goals,
            hard_goals: enforced_goals.map(enfG => enfG.name),
            soft_goals: []
        }

        const baseURL = process.env.BASE_URL
        let payload = JSON.stringify({
            callback:baseURL + '/api/runner/planner/finished/' + refId,
            model,
            temp_goals: JSON.stringify(exp_settings)
        })

        console.log(payload)

        const plannerServiceURL = process.env.PLANNER_SERVICE
        const plannerRequest = new Request(plannerServiceURL + '/plan/temp-goals', 
            {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: payload,
            }
        )

        fetch(plannerRequest).then
            (resp => console.log("Plan computation request submitted."),
            error => console.log(error)
        )
        
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


runnerRouter.post('/planner/finished/:id', async (req: any, res) => {

    try {

        console.log(req.body)
        const refId = req.params.id;
        const iterationStep: IterationStep | null = await IterationStepModel.findOne({ _id: refId});

        if (!iterationStep) {
            return res.status(404).send('update step failed');
        }

        if (!iterationStep.plan) {
            return res.status(404).send('update plan failed');
        }

        let actions = req.body.actions as string
        let status = req.body.status

        console.log(status)
        console.log(actions)

        if(status === 'SOLVED'){
            iterationStep.plan.status = PlanRunStatus.plan_found;
            iterationStep.plan.actions = JSON.stringify(actions);

            // Check which properties are satisfied
            const plan_properties = (await PlanPropertyModel.find({ project: iterationStep.project}) as PlanProperty[]).filter(pp => pp.isUsed);

            let check = new PropertyCheck(environment.experimentsRootPath, iterationStep, plan_properties);
            let sat_properties = await check.executeRun();

            console.log(sat_properties)
            const sat_properties_ids = plan_properties.filter(pp => sat_properties.includes(pp.name)).map(pp => pp._id);

            iterationStep.plan.satisfied_properties =  sat_properties_ids.filter(id => id != undefined);

        }

        if(status === 'UNSOLVABLE'){
            iterationStep.plan.status = PlanRunStatus.not_solvable;
        }

        if(status === 'FAILED'){
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


runnerRouter.post('/explainer', auth, async (req: any, res) => {

    try {
        const explainerData: Planner = req.body.data as Planner;

        const explainerModel = new PlannerModel(explainerData);

        if (!explainerModel) {
            return res.status(404).send('Create planner failed.');
        }

        let newExplainer: Planner | null = await explainerModel.save();

        if (!newExplainer) {
            return res.status(404).send('Create project failed.');
        }
        
        res.send({
            status: true,
            message: 'Explainer registered',
            data: newExplainer
        });

    } catch (ex : any) {
        console.log(ex.message);
        res.status(404).send(ex.message);
    }
});



runnerRouter.get('/planner', auth, async (req: any, res) => {
    const planner = await PlannerModel.find();
    if (!planner) { 
        return res.status(404).send({ message: 'No planner found.' });
    }
    res.send({
        data: planner
    });

});

runnerRouter.get('/explainer', auth, async (req: any, res) => {
    const explainer = await ExplainerModel.find();
    if (!explainer) { 
        return res.status(404).send({ message: 'No explainer found.' });
    }
    res.send({
        data: explainer
    });

});


runnerRouter.delete('/planner/:id', auth, async (req, res) => {
    const id = req.params.id;

    const deleteResult = await PlannerModel.deleteOne({ _id: id});
    if (!deleteResult) { 
        return res.status(404).send({ message: 'Problem during planner deletion occurred' }); 
    }

    res.send({
        data: deleteResult
    });

});


runnerRouter.delete('/explainer/:id', auth, async (req, res) => {
    const id = req.params.id;

    const deleteResult = await ExplainerModel.deleteOne({ _id: id});
    if (!deleteResult) { 
        return res.status(404).send({ message: 'Problem during explainer deletion occurred' }); 
    }

    res.send({
        data: deleteResult
    });

});
