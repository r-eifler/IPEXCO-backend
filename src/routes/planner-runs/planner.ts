import { IterationStep, IterationStepModel } from './../../db_schema/iteration_step';
import express from 'express';

import { auth, authUserStudy } from '../../middleware/auth';
import { environment } from '../../app';


export const plannerRouter = express.Router();

plannerRouter.post('/plan', authUserStudy, async (req: any, res) => {

    // const saveRun: boolean = req.query.save ? JSON.parse(req.query.save) : false;
    // console.log("Save run: " + saveRun);
    // const iterStepData = req.body.data;

    // try {

    //     let iterStep: IterationStep | null = null;
    //     if (saveRun){
    //         iterStep = await IterationStepModel.findOne({ _id: iterStepData._id });
    //     }
    //     else {
    //         iterStep = new IterationStepModel(iterStepData);
    //     }

    //     if (! iterStep ){;
    //         return res.status(403).send('plan can not be computed');
    //     }

    //     if (! iterStep.plan_run){
    //         const planRun: PlanRun = {name: 'Plan ', status:  RunStatus.pending};
    //         iterStep.plan_run = planRun;
    //     }

    //     try {
    //         // load project and plan-properties and compute plan
    //         await iterStep.populate('hardGoals');
    //         await iterStep.populate('softGoals');
    //         await iterStep.populate('task.basetask');

    //         const planner = new PlanCall(environment.experimentsRootPath, iterStep);

    //         iterStep.plan_run.status = RunStatus.running;

    //         if (saveRun) {
    //             await iterStep.save();
    //         }

    //         const callResult = await planner.executeRun();

    //         // let satPlanProperties: PlanProperty[] = [];
    //         // if (planFound) {
    //         //     // check which plan properties are satisfied by the plan
    //         //     const planProperties: PlanProperty[] = iterStep.hardGoals.concat(iterStep.softGoals);
    //         //     const propertyChecker = new  PropertyCheck(environment.experimentsRootPath, planProperties, plan);
    //         //     satPlanProperties = await propertyChecker.executeRun();
    //         //     // console.log('Sat properties:');
    //         //     // console.log(propNames);
    //         //     propertyChecker.tidyUp();
    //         // }

    //         iterStep.plan_run.status = callResult.planFound ? RunStatus.finished : RunStatus.noSolution;
    //         iterStep.status = callResult.planFound ? StepStatus.solvable : StepStatus.unsolvable;
    //         iterStep.plan_run.satisfied_properties = callResult.planFound ? iterStep.hardGoals.filter(hg => !!hg._id).map(hg => hg._id) : [];

    //         if (saveRun) {
    //             await iterStep.save();
    //             console.log('saved');
    //         }

    //         await iterStep.depopulate('hardGoals');
    //         await iterStep.depopulate('softGoals');

    //         console.log("Final Iteration Step");
    //         console.log(iterStep);
    //         res.send({
    //             status: true,
    //             message: 'run successful',
    //             data: iterStep,
    //         });
    //     }
    //     catch (ex) {
    //         console.warn(ex);
    //         iterStep.plan_run.status = RunStatus.failed;
    //         if (req.query.save) {
    //             await iterStep.save();
    //         }
    //         res.send({
    //             status: true,
    //             message: 'run failed',
    //             data: iterStep
    //         });
    //     }
    // }
    // catch (ex : any) {
    //     console.warn(ex);
    //     res.status(500);
    // }
});

// plannerRouter.post('/mugs/:id', auth, async (req, res) => {
//     try {
//         const stepId =  req.params.id;
//         const iterStep = await IterationStepModel.findOne({ _id: stepId})
//         .populate('hardGoals')
//         .populate('softGoals')
//         .populate('task.basetask');

//         if (!iterStep) { 
//             return res.status(404).send({ message: 'no run found' }); 
//         }

//         // console.log(iterStep);

//         const depExpData = req.body as DepExplanationRun;
//         depExpData.status = RunStatus.running;

//         iterStep.explanation_run = depExpData;
//         await iterStep.save();
        
//         await iterStep.populate('depExplanation.hardGoals');
//         await iterStep.populate('depExplanation.softGoals');

//         const depExp = iterStep.explanation_run

//         console.log(depExp);

//         const planner = new ExplanationCall(environment.experimentsRootPath, iterStep, depExp);
//         let succesful = await planner.executeRun()
//         planner.tidyUp();
        
//         depExp.status = succesful ? RunStatus.finished : RunStatus.failed;

//         await iterStep.save();
//         await iterStep.depopulate('depExplanation.hardGoals');
//         await iterStep.depopulate('depExplanation.softGoals');
//         await iterStep.depopulate('hardGoals');
//         await iterStep.depopulate('softGoals');
//         console.log(iterStep.explanation_run);

//         res.send({
//             status: true,
//             message: 'run executed',
//             data: iterStep,
//         });

//     }
//     catch (ex : any) {
//         console.log(ex);
//         res.status(500);
//     }
// });


// plannerRouter.post('/mugs-save/:id', authUserStudy, async (req: any, res) => {
//     try {
//         if (! req.userStudyUser) {
//             return res.status(401).send({ message: 'Access denied.' });
//         }

//         const stepId =  req.params.id;
//         const iterStep = await IterationStepModel.findOne({ _id: stepId});

//         if (!iterStep) { 
//             return res.status(404).send({ message: 'no run found' }); 
//         }

//         const depExp = req.body as DepExplanationRun;
//         depExp.status = RunStatus.finished;

//         iterStep.explanation_run = depExp;
//         await iterStep.save();

//         res.send({
//             status: true,
//             message: 'run saved successfully',
//             data: iterStep,
//         });
//     }
//     catch (ex : any) {
//         res.send(ex.message);
//     }
// });



