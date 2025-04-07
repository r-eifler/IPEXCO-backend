import express from 'express';
import { auth, authService } from '../middleware/auth';

import { Demo, DemoModel } from '../db_schema/demo';
import { ExplanationRunStatus } from '../db_schema/explanations';
import { IterationStepModel } from '../db_schema/iteration_step';
import { PlanProperty, PlanPropertyModel } from '../db_schema/plan-properties/plan_property';
import { Project, ProjectModel } from '../db_schema/project';
import { ExplainerRequest, ExplainerResponse } from '../db_schema/service_communication';
import { Service, ServiceModel, ServiceType } from '../db_schema/services';
import { callServices } from '../services/utils';

export const explainerRouter = express.Router();


explainerRouter.post('/explain-step/:id', auth, async (req, res) => {

    try {

        const refId = req.params.id;
        console.log('Compute conflicts of: ' + refId)
        const iterationStep = await IterationStepModel.findOne({ _id: refId});

        if (!iterationStep) {
            res.status(404).send('update step failed');
            return;
        }

        // if iteration step belongs to a demo just extract the pre-computed 
        // explanations and store it in the iteration step
        const demo: Demo | null = await DemoModel.findOne({ _id: refId});
        if(demo !== null && demo.globalExplanation !== undefined && 
            demo.globalExplanation.status === ExplanationRunStatus.FINISHED
        ){
            console.log('Extract explanations from demo.');
            iterationStep.globalExplanation = demo.globalExplanation;
            await iterationStep.save();
            res.send(true);
            return;
        }

        // compute explanations
        iterationStep.globalExplanation = {
            createdAt: new Date(Date.now()),
            status: ExplanationRunStatus.RUNNING
        }

        await iterationStep.save();
        
        const model = iterationStep.task.model
        const plan_properties = await PlanPropertyModel.find({ project: iterationStep.project}) as PlanProperty[];

        const used_plan_properties = plan_properties.filter(pp => !pp._id ? false : 
            iterationStep.hardGoals.includes(pp._id?.toString()) ||
            iterationStep.softGoals.includes(pp._id?.toString())
        );


        const baseURL = process.env.BASE_URL || 'host.docker.internal:3000'
        let payload: ExplainerRequest = {
            callback: baseURL + '/api/explainer/explain-step/' + refId + '/finished',
            model: model,
            goals: used_plan_properties,
            hardGoals: used_plan_properties.filter(pp => pp.globalHardGoal).map(pp => pp._id).filter(pp => pp !== undefined),
            softGoals: used_plan_properties.filter(pp => !pp.globalHardGoal).map(pp => pp._id).filter(pp => pp !== undefined),
            id: iterationStep._id
        };

        const project = await ProjectModel.findById(iterationStep.project) as Project;
        if (!project) {
            iterationStep.globalExplanation.status == ExplanationRunStatus.FAILED;
            await iterationStep.save();
            res.status(200).send(false);
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
            iterationStep.globalExplanation.status == ExplanationRunStatus.FAILED;
            await iterationStep.save();
            console.log('No existing explainer service selected.');
            res.status(200).send(false);
            return;
        }

        const success = await callServices(services, JSON.stringify(payload), '/explanation');

        if(!success){
            iterationStep.globalExplanation.status == ExplanationRunStatus.FAILED;
            await iterationStep.save();
            console.log('No explainer service available.');
            res.status(200).send(false);
            return;
        }

        res.status(200).send(true);

    } catch (ex : any) {
        console.log(ex);
        res.status(404).send(ex.message);
    }
});


  explainerRouter.post('/explain-step/:id/finished', authService, async (req: any, res) => {

      try {
    
            // console.log(req.body)
            const refId = req.params.id;
            const iterationStep = await IterationStepModel.findOne({ _id: refId});
    
            if (!iterationStep || iterationStep.globalExplanation === undefined) {
                res.status(404).send('update step failed');
                return;
            }

            if(iterationStep.globalExplanation.status == ExplanationRunStatus.FINISHED ||
                iterationStep.globalExplanation.status == ExplanationRunStatus.FAILED
               // we could update the result for failed runs if multiple explainer are used 
            ){
                console.log('Got repeated response for explainer call: ' + iterationStep._id);
                res.status(200).send('Explanation already computed.');
                return;
            }
    
            const response = req.body as ExplainerResponse;
    
            let MUGS = response.result.MUGS;
            let MGCS = response.result.MGCS;
            let status = response.status
    
            console.log(MUGS)
            console.log(MGCS)
    
            if(status === ExplanationRunStatus.FINISHED){
                iterationStep.globalExplanation.status = ExplanationRunStatus.FINISHED;
                iterationStep.globalExplanation.MUGS = MUGS.subsets
                iterationStep.globalExplanation.MGCS = MGCS.subsets
            }
    
    
            if(status === ExplanationRunStatus.FAILED){
                iterationStep.globalExplanation.status = ExplanationRunStatus.FAILED;
            }
    
            iterationStep.save()
            
            res.send({
                status: true,
                message: 'Explanation computation finished',
                data: true
            });
  
        } catch (ex : any) {
            console.log(ex);
            res.status(404).send(ex.message);
        }
  });


// explainerRouter.post('/explainer', auth, async (req: any, res) => {

//     try {
//         const explainerData: Planner = req.body.data as Planner;

//         const explainerModel = new PlannerModel(explainerData);

//         if (!explainerModel) {
//             return res.status(404).send('Create planner failed.');
//         }

//         let newExplainer: Planner | null = await explainerModel.save();

//         if (!newExplainer) {
//             return res.status(404).send('Create project failed.');
//         }
        
//         res.send({
//             status: true,
//             message: 'Explainer registered',
//             data: newExplainer
//         });

//     } catch (ex : any) {
//         console.log(ex.message);
//         res.status(404).send(ex.message);
//     }
// });



// explainerRouter.get('/explainer', auth, async (req: any, res) => {
//     const explainer = await ExplainerModel.find();
//     if (!explainer) { 
//         return res.status(404).send({ message: 'No explainer found.' });
//     }
//     res.send({
//         data: explainer
//     });

// });



// explainerRouter.delete('/explainer/:id', auth, async (req, res) => {
//     const id = req.params.id;

//     const deleteResult = await ExplainerModel.deleteOne({ _id: id});
//     if (!deleteResult) { 
//         return res.status(404).send({ message: 'Problem during explainer deletion occurred' }); 
//     }

//     res.send({
//         data: deleteResult
//     });

// });
