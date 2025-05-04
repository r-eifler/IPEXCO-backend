import express from 'express';
import { deriveSuccessor, FlightPlanTreeModel, FlightSectionModel, FlightSectionZ } from '../../db_schema/beluga/flight-section-tree';
import { PlanRunStatus } from '../../db_schema/iteration_step';
import { SimplePlannerRequest, SimplePlannerResponse, SimplePlannerResponseZ } from '../../db_schema/service_communication';
import { ServiceModel } from '../../db_schema/services';
import { authAny, AuthenticatedRequest, authService } from '../../middleware/auth';
import { callServices } from '../../services/utils';
import { BelugaActionType } from '../../db_schema/beluga/beluga_plan';
import { ProjectModel } from '../../db_schema/project';
import { BelugaProblemZ } from '../../db_schema/beluga/beluga_problem';



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
        let section = await FlightSectionModel.findOne({ _id: refId});

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

        const response = SimplePlannerResponseZ.parse(req.body);
        let actions = response.actions;

        const status = response.status;

        if (status == PlanRunStatus.SOLVED){

            const tree = await FlightPlanTreeModel.findById(section.treeId);
            if (!tree) {
                res.status(500).send('section not created');
                return;
            }
            const project = await ProjectModel.findById(tree.project);
            if (!project) {
                res.status(500).send('section not created');
                return;
            }
            const task = BelugaProblemZ.parse(project.baseTask.model);
    
            const branchIndex = tree.branches.findIndex(b => b.sectionIdHead == section?._id);

            // cut plan into flight sections
            // console.log("---------------------------------------------------------")
            // console.log(actions)
            // console.log("---------------------------------------------------------")
            while(true){
                const switch_index = actions.findIndex(a => a.name == "switch_to_next_beluga");
                const sectionActions  = actions.slice(0, switch_index == -1 ? undefined : switch_index);
                // console.log(sectionActions)
                // console.log("---------------------------")

                section.actions =  [...sectionActions, {name: BelugaActionType.SWITCH_TO_NEXT_BELUGA}]
                section.status = PlanRunStatus.SOLVED;
                await section.save();

                if(switch_index == -1){

                    tree.branches = [
                        ...tree.branches.slice(0,branchIndex),
                        {
                            ...tree.branches[branchIndex],
                            sectionIdHead: section._id,
                        },
                        ...tree.branches.slice(branchIndex + 1),
                    ]                      
                    await tree.save()

                    res.status(200).send();
                    return;
                }

                actions = actions.slice(switch_index + 1)

                let nextSectionData = deriveSuccessor(section, task);
                if (!nextSectionData) {
                    res.status(500).send('section not created');
                    return;
                }

                section = new FlightSectionModel(nextSectionData);
                if (!section) {
                    res.status(500).send('section not created');
                    return;
                }

                // if(actions.length == 0 || actions[actions.length - 1].name != "switch_to_next_beluga"){
                //     actions = [...actions, {name: "switch_to_next_beluga"}]
                // }
            }
        }
        else {
            section.status = status;
            await section.save();
        }

        // section.status = status;
        // await section.save();

        // if(status === PlanRunStatus.SOLVED){
        //     section.actions = actions;           
        // }

        // await section.save()
        
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


