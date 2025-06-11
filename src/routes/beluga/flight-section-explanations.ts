import express from 'express';
import { number, string } from 'zod';
import { FlightPlanTreeModel, FlightSectionModel, FlightSectionZ, getExplanationTaskFromSectionWithFullSite, getTaskFromSection } from '../../db_schema/beluga/flight-section-tree';
import { generateSoftGoals } from '../../db_schema/beluga/utils';
import { PlanRunStatus } from '../../db_schema/iteration_step';
import { ExplainerRequest, ExplainerResponseZ, SimplePlannerResponseZ } from '../../db_schema/service_communication';
import { Service, ServiceModel, ServiceType } from '../../db_schema/services';
import { authAny, AuthenticatedRequest, authService } from '../../middleware/auth';
import { callServices } from '../../services/utils';
import { ExplanationRunStatus } from '../../db_schema/explanations';
import { ProjectModel } from '../../db_schema/project';



export const flightSectionExplanationRouter = express.Router();


flightSectionExplanationRouter.post('', authAny, async (req: AuthenticatedRequest, res) => {

    try {
        if (!req.user) {
            res.status(401).send('Create plan failed.');
            return;
        }
        
        const sectionData = FlightSectionZ.parse(req.body.section);
        const configIndex = number().parse(req.body.configIndex);
        const task = getExplanationTaskFromSectionWithFullSite(sectionData)
        console.log("Call explainer for flight section configuration: " + configIndex);
        
        await FlightSectionModel.replaceOne({ _id: sectionData._id}, sectionData);

        const section = await FlightSectionModel.findOne({ _id: sectionData._id});
        if (!section) {
            res.status(403).send('section not available');
            return;
        }

        section.configurations[configIndex].explanationStatus = ExplanationRunStatus.RUNNING;
        await section.save();

        let tree = await FlightPlanTreeModel.findById(section.treeId);
        if (!tree) {
            section.configurations[configIndex].explanationStatus = ExplanationRunStatus.FAILED;
            await section.save();
            console.log('[Explanation Computation] Flight Plan Tree does not exist.');
            res.status(401).send('Explanation could not be created.');
            return;
        }

        let project = await ProjectModel.findById(tree.project);
        if (!project) {
            section.configurations[configIndex].explanationStatus = ExplanationRunStatus.FAILED;
            await section.save();
            console.log('[Explanation Computation] Project does not exist.')
            res.status(401).send('Explanation could not be created.');
            return;
        }

        const services: Service[] = [];
        for(const serviceId of project.settings.services.services) {
            const service = await ServiceModel.findById(serviceId);
            if(service && service.type == ServiceType.EXPLAINER){
                services.push(service);
            }
        }

        if (services.length === 0) {
            section.configurations[configIndex].explanationStatus = ExplanationRunStatus.FAILED;
            await section.save();
            console.log('No existing explainer service selected.');
            res.status(200).send(false);
            return;
        }

        const goals = generateSoftGoals(section.configurations[configIndex])

        section.configurations[configIndex].explanations = {
            MUGS: [],
            MUGScomplete: false,
            MGCS: [],
            MGCScomplete: false,
            goals : goals.reduce((acc, g) => ({...acc, [g._id]: g}), {}),
        }

        await section.save();

        const baseURL = process.env.BASE_URL || 'http://host.docker.internal:3000'
        let payload: ExplainerRequest = {
            callback: baseURL + '/api/flight-section-explanation/finished/' + section._id +'/' + configIndex,
            model: task,
            id: section._id,
            goals,
            softGoals: goals.map(g => g._id),
            hardGoals: []
        }

        console.log(JSON.stringify(payload))

        const success = await callServices(services, JSON.stringify(payload), '/explanation');
        if(!success){
            section.configurations[configIndex].explanationStatus = ExplanationRunStatus.FAILED;
            await section.save();
            console.log('[Section Explanation Computation] Selected planner service not reachable.');
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


flightSectionExplanationRouter.post('/finished/:sectionId/:configurationIndex', authService, async (req: any, res) => {

    try {
        const refId = req.params.sectionId;
        const configurationIndex = req.params.configurationIndex;
        let section = await FlightSectionModel.findOne({ _id: refId});

        if (!section) {
            res.status(404).send('update explanation failed');
            return;
        }

        const explanations = section.configurations[configurationIndex].explanations
        if (explanations === null) {
            res.status(404).send('update explanation failed');
            return;
        }

        if (section.configurations[configurationIndex].explanationStatus == ExplanationRunStatus.FAILED) {
            res.status(200).send('Plan run was canceled.');
            return;
        }

        const response = ExplainerResponseZ.parse(req.body);
        console.log(response.result.MUGS.subsets);

        if (response.status == ExplanationRunStatus.FINISHED){

            
            section.configurations[configurationIndex].explanationStatus = ExplanationRunStatus.FINISHED;
            section.configurations[configurationIndex].explanations = {
                ...explanations,
                MUGS: [
                ...explanations?.MUGS,
                ...response.result.MUGS.subsets
                ],
                MGCS: [
                    ...explanations.MGCS,
                    ...response.result.MGCS.subsets
                ],
            }
            await section.save();

            res.status(200).send();
            return;
        }
        else {
            section.configurations[configurationIndex].explanationStatus = response.status;
            await section.save();
        }
        
        res.status(200).send();
        return;

    } catch (ex : any) {
        console.log(ex);
        res.status(404).send(ex.message);
    }
});


flightSectionExplanationRouter.post('/cancel', authAny, async (req, res) => {

    try {
        console.log(req.body)
        const id = string().parse(req.body.sectionId);

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

