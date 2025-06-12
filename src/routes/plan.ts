import express from 'express';
import { PlanRunStatus } from '../db_schema/iteration_step';
import { PlanBaseZ, PlanModel } from '../db_schema/plan';
import { ProjectModel } from '../db_schema/project';
import { SimplePlannerRequest, SimplePlannerResponse } from '../db_schema/service_communication';
import { ServiceModel } from '../db_schema/services';
import { auth, authAny, AuthenticatedRequest, authService } from '../middleware/auth';
import { callServices } from '../services/utils';


export const planRouter = express.Router();

planRouter.get('/', authAny, async (req: any, res) => {

    try{
        const projectId: string = req.query.projectId as string;
        const userId: string = req.user._id;
        const plans = await PlanModel.find({ project: projectId, user: userId})

        if (!plans) { 
            res.status(404).send({ message: 'ERROR: No plans found.' });
            return;
        }

        res.send(plans);
    }
    catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }

});

planRouter.get('/:id', authAny, async (req, res) => {
    try{
        const id =  req.params.id;
        const run = await PlanModel.findOne({ _id: id});

        if (!run) { 
            res.status(404).send({ message: 'No plan step found.' });
            return;
        }

        res.send({
            data: run
        });
    }
    catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }
});

planRouter.post('', authAny, async (req: AuthenticatedRequest, res) => {

    try {
        if (!req.user) {
            res.status(401).send('Create plan failed.');
            return;
        }
        console.log("create plan");
        let planBase = PlanBaseZ.parse(req.body);
        let planData = {
            ...planBase,
            user: req.user._id,
            status:PlanRunStatus.RUNNING
        }

        const plan = new PlanModel(planData);
        if (!plan) {
            res.status(401).send('Plan could not be created.');
            return;
        }
        await plan.save();

        let project = await ProjectModel.findById(plan.project);
        if (!project) {
            plan.status = PlanRunStatus.FAILED;
            await plan.save();
            console.log('[Plan Computation] Project does not exist.');
            res.status(401).send('Plan could not be created.');
            return;
        }

        let planner = await ServiceModel.findById(plan.planner);
        if (!planner) {
            plan.status = PlanRunStatus.FAILED;
            await plan.save();
            console.log('[Plan Computation] Planner does not exist.');
            res.status(401).send('Plan could not be created.');
            return;
        }

        const baseURL = process.env.BASE_URL || 'http://host.docker.internal:3000'
        let payload: SimplePlannerRequest = {
            callback:baseURL + '/api/plan/finished/' + plan._id,
            model: project.baseTask.model,
            id: plan._id
        }

        const success = await callServices([planner], JSON.stringify(payload), '/plan');
        if(!success){
            plan.status = PlanRunStatus.FAILED;
            await plan.save();
            console.log('[Plan Computation] Selected planner service not reachable.');
            res.status(201).send({status: false, message:'No selected planner service reachable.'});
            return;
        }

        res.send(plan);
    }
    catch (ex) {
        console.log(ex);
        res.status(500);
    }

});


planRouter.post('/finished/:id', authService, async (req: any, res) => {

    try {

        // console.log(req.body)
        const refId = req.params.id;
        const plan = await PlanModel.findOne({ _id: refId});

        if (!plan) {
            res.status(404).send('update plan failed');
            return;
        }

        if (plan.status == PlanRunStatus.CANCELED) {
            res.status(200).send('Plan run was canceled.');
            return;
        }

        if (plan.status == PlanRunStatus.UNSOLVABLE || 
            plan.status == PlanRunStatus.FAILED 
        ) {
            console.log('Got repeated response for plan call: ' + plan._id);
            res.status(200).send('Plan run already set.');
            return;
        }

        const response = req.body as SimplePlannerResponse;
        const actions = response.actions;
        const status = response.status;

        plan.status = status;
        await plan.save();

        if(status === PlanRunStatus.SOLVED){
            plan.actions = actions;           
        }

        await plan.save()
        
        res.status(200).send();
        return;

    } catch (ex : any) {
        console.log(ex);
        res.status(404).send(ex.message);
    }
});


planRouter.post('/cancel/:id', authAny, async (req, res) => {

    try {

        const id = req.params.id;
        console.log('Cancel: ' + id);

        const plan = await PlanModel.findById(id);

        if (!plan) {
            res.status(404).send({ message: 'No plan found.' });
            return;
        }

        const forwardCancelToPlanningService = plan.status == PlanRunStatus.RUNNING;

        plan.status = PlanRunStatus.CANCELED;
        await plan.save();

        if(forwardCancelToPlanningService){

            let plannerId = plan.planner;
            let planner = await ServiceModel.findById(plannerId)

            if (!planner) {
                res.status(200).send(false);
                return;
            }

    
            const success = await callServices([planner], JSON.stringify({id: plan._id}), '/cancel');
            if(!success){
                plan.status = PlanRunStatus.FAILED;
                await plan.save();
                console.log('[Cancel Plan Computation] No selected planner service reachable.');
                res.status(201).send(false);
                return;
            }
        }

    
        res.send(true);
    } catch (ex) {
        res.status(500);
    }

});


planRouter.delete('/:id', auth, async (req, res) => {

    try {
        const result = await PlanModel.deleteOne({ _id: req.params.id });

        if (!result) {
            res.status(404).send({ message: 'No plan found.' });
            return;
        }
    
        res.send({
            data: {deleted: true}
        });
    } catch (ex) {
        res.status(500);
    }

});


