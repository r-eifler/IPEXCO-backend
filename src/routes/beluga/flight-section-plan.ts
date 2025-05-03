import express from 'express';
import { FlightSectionModel, FlightSectionZ } from '../../db_schema/beluga/flight-section-tree';
import { PlanRunStatus } from '../../db_schema/iteration_step';
import { SimplePlannerRequest, SimplePlannerResponse } from '../../db_schema/service_communication';
import { ServiceModel } from '../../db_schema/services';
import { authAny, AuthenticatedRequest, authService } from '../../middleware/auth';
import { callServices } from '../../services/utils';



export const flightSectionPlanRouter = express.Router();


flightSectionPlanRouter.post('', authAny, async (req: AuthenticatedRequest, res) => {

    try {
        if (!req.user) {
            res.status(401).send('Create plan failed.');
            return;
        }
        
        console.log("create plan for flight section");
        const sectionData = FlightSectionZ.parse(req.body.section);
        const task = req.body.task;
        
        await FlightSectionModel.replaceOne({ _id: sectionData._id}, sectionData);

        const section = await FlightSectionModel.findOne({ _id: sectionData._id});
        if (!section) {
            res.status(403).send('section not available');
            return;
        }

        section.status = PlanRunStatus.RUNNING;
        await section.save();

        let planner = await ServiceModel.findById(section.planMethod?.serviceId);
        if (!planner) {
            section.status = PlanRunStatus.FAILED;
            await section.save();
            console.log('[Section Plan Computation] Planner does not exist.');
            res.status(401).send('Plan could not be created.');
            return;
        }

        const baseURL = process.env.BASE_URL || 'http://host.docker.internal:3000'
        let payload: SimplePlannerRequest = {
            callback:baseURL + '/api/flight-section-plan/finished/' + section._id,
            model: task,
            id: section._id
        }

        const success = await callServices([planner], JSON.stringify(payload), '/plan');
        if(!success){
            section.status = PlanRunStatus.FAILED;
            await section.save();
            console.log('[Section Plan Computation] Selected planner service not reachable.');
            res.status(201).send({status: false, message:'No selected planner service reachable.'});
            return;
        }

        res.send(section);
    }
    catch (ex) {
        console.log(ex);
        res.status(500);
    }

});


flightSectionPlanRouter.post('/finished/:id', authService, async (req: any, res) => {

    try {

        // console.log(req.body)
        const refId = req.params.id;
        const section = await FlightSectionModel.findOne({ _id: refId});

        if (!section) {
            res.status(404).send('update plan failed');
            return;
        }

        if (section.status == PlanRunStatus.CANCELED) {
            res.status(200).send('Plan run was canceled.');
            return;
        }

        if (section.status == PlanRunStatus.UNSOLVABLE || 
            section.status == PlanRunStatus.FAILED 
        ) {
            console.log('Got repeated response for plan call: ' + section._id);
            res.status(200).send('Plan run already set.');
            return;
        }

        const response = req.body as SimplePlannerResponse;
        let actions = response.actions;
        if(actions.length == 0 || actions[actions.length - 1].name != "switch_to_next_beluga"){
            actions = [...actions, {name: "switch_to_next_beluga"}]
        }
        const status = response.status;

        section.status = status;
        await section.save();

        if(status === PlanRunStatus.SOLVED){
            section.actions = actions;           
        }

        await section.save()
        
        res.status(200).send();
        return;

    } catch (ex : any) {
        console.log(ex);
        res.status(404).send(ex.message);
    }
});


flightSectionPlanRouter.post('/cancel/:id', authAny, async (req, res) => {

    try {

        const id = req.params.id;
        console.log('Cancel: ' + id);

        const section = await FlightSectionModel.findById(id);

        if (!section) {
            res.status(404).send({ message: 'No plan found.' });
            return;
        }

        const forwardCancelToPlanningService = section.status == PlanRunStatus.RUNNING;

        section.status = PlanRunStatus.CANCELED;
        await section.save();

        if(forwardCancelToPlanningService){

            let plannerId = section.planMethod?.serviceId;
            let planner = await ServiceModel.findById(plannerId)

            if (!planner) {
                res.status(200).send(false);
                return;
            }

    
            const success = await callServices([planner], JSON.stringify({id: section._id}), '/cancel');
            if(!success){
                section.status = PlanRunStatus.FAILED;
                await section.save();
                console.log('[Cancel Section Plan Computation] No selected planner service reachable.');
                res.status(201).send(false);
                return;
            }
        }

    
        res.send(true);
    } catch (ex) {
        res.status(500);
    }

});


