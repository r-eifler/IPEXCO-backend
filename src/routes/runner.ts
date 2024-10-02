import { auth } from '../middleware/auth';
import express from 'express';

import { ExplainerModel, Planner, PlannerModel } from '../db_schema/runner';
import { IterationStep, IterationStepModel, PlanRunStatus } from '../db_schema/iteration_step';
import { PlanningTask } from '../db_schema/planning_task';

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
            status: PlanRunStatus.pending
        }
        iterationStep.save();
        
        // const headers: Headers = new Headers()
        // headers.set('Content-Type', 'application/json')
        // headers.set('Accept', 'application/json')

        let task = iterationStep.task
        let planning_task = new PlanningTask(task)
        let [domain, problem] = planning_task.toPDDL()

        console.log(domain)
        console.log('\n\n\n\n\n\n\n')
        console.log(problem)

        let payload = JSON.stringify({
            callback:'http://localhost:3000/api/runner/planner/finished/' + refId,
            domain,
            problem  
        })

        const plannerRequest = new Request('http://localhost:3333/plan', 
            {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: payload,
            }
        )

        console.log(plannerRequest.bodyUsed)
        console.log(plannerRequest.body)

        fetch(plannerRequest).then
            (resp => console.log("got response:", resp.body),
            error => console.log(error)
        )

        console.log(plannerRequest.bodyUsed)
        console.log(plannerRequest.body)
        
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
            return res.status(404).send('update step failed');
        }

        let actions = req.body.plan
        let status = req.body.status

        if(status === 'SOLVED'){
            iterationStep.plan.status = PlanRunStatus.plan_found;
            iterationStep.plan.actions = actions;
        }

        if(status === 'UNSOLVABLE'){
            iterationStep.plan.status = PlanRunStatus.not_solvable;
        }
        
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
