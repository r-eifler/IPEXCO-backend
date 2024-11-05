import { auth } from '../middleware/auth';
import express from 'express';

import { ExplainerModel, Planner, PlannerModel } from '../db_schema/runner';
import { IterationStep, IterationStepModel } from '../db_schema/iteration_step';
import { PlanProperty, PlanPropertyModel } from '../db_schema/plan-properties/plan_property';
import { AnswerType, ExplanationRunStatus, Question } from '../db_schema/explanations';

export const explainerRouter = express.Router();


explainerRouter.post('/explain-step/:id', auth, async (req: any, res) => {

    try {

        const refId = req.params.id;
        console.log('Compute conflicts of: ' + refId)
        const iterationStep: IterationStep | null = await IterationStepModel.findOne({ _id: refId});

        if (!iterationStep) {
            return res.status(404).send('update step failed');
        }

        iterationStep.globalExplanation = {
            createdAt: new Date(Date.now()),
            status: ExplanationRunStatus.running
        }

        iterationStep.save();
        
        const model = iterationStep.task.model
        const plan_properties = await PlanPropertyModel.find({ project: iterationStep.project}) as PlanProperty[];

        const used_plan_properties = plan_properties.filter(pp => !pp._id ? false : 
            iterationStep.hardGoals.includes(pp._id?.toString()) ||
            iterationStep.softGoals.includes(pp._id?.toString())
        );

        const exp_settings = {
            plan_properties: used_plan_properties,
            hard_goals: [],
            soft_goals: used_plan_properties.map(pp => pp.name)
        }

        const baseURL = process.env.BASE_URL || 'host.docker.internal:3000'
        let payload = JSON.stringify({
            callback: baseURL + '/api/explainer/explain-step/' + refId + '/finished',
            model,
            exp_setting: JSON.stringify(exp_settings)
        })

        // console.log(payload)

        const explainerServiceURL = process.env.EXPLAINER_SERVICE
        const explainerRequest = new Request(explainerServiceURL + '/explain/all-mugs-msgs', 
            {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: payload,
            }
        )

        fetch(explainerRequest).then
            (resp => console.log("Explain computation request submitted."),
            error => console.log(error)
        )
        
        res.send({
            status: true,
            message: 'Explain computation registered',
            data: true
        });

    } catch (ex : any) {
        console.log(ex);
        res.status(404).send(ex.message);
    }
});



interface Result {
    complete: false,
    subsets: string[][]
  }

  explainerRouter.post('/explain-step/:id/finished', async (req: any, res) => {

      try {
  
          console.log(req.body)
          const refId = req.params.id;
          const iterationStep: IterationStep | null = await IterationStepModel.findOne({ _id: refId});
  
          if (!iterationStep) {
              return res.status(404).send('update step failed');
          }
  
  
          let MUGS = req.body.MUGS as Result
          let MGCS = req.body.MGCS as Result
          let status = req.body.status
  
          console.log(MUGS)
          console.log(MGCS)
          console.log(status)
  
          if(status === 'FINISHED'){
              iterationStep.globalExplanation.status = ExplanationRunStatus.finished;
              iterationStep.globalExplanation.MUGS = JSON.stringify(MUGS.subsets)
              iterationStep.globalExplanation.MGCS = JSON.stringify(MGCS.subsets)
          }
  
  
          if(status === 'FAILED'){
              iterationStep.globalExplanation.status = ExplanationRunStatus.failed;
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



// explainerRouter.post('/explain-step/:id/question', auth, async (req: any, res) => {

//     try {

//         const refId = req.params.id;
//         console.log('Compute conflicts of: ' + refId)
//         const iterationStep: IterationStep | null = await IterationStepModel.findOne({ _id: refId});

//         if (!iterationStep) {
//             return res.status(404).send('update step failed');
//         }

//         const question = req.body.data.question as Question;

//         if(! iterationStep.explanations){
//             iterationStep.explanations= []
//         }

//         iterationStep.explanations.push({
//             createdAt: new Date(Date.now()),
//             question,
//             status: ExplanationRunStatus.running
//         })
//         iterationStep.save();
        
//         const model = iterationStep.task.model
//         const plan_properties = await PlanPropertyModel.find({ project: iterationStep.project}) as PlanProperty[];

//         // const enforced_goals = plan_properties.filter(pp => !pp._id ? false : iterationStep.hardGoals.includes(pp._id?.toString()));

//         const exp_settings = {
//             plan_properties: plan_properties,
//             hard_goals: [],
//             soft_goals: plan_properties.map(pp => pp.name)
//         }

//         const baseURL = process.env.BASE_URL
//         let payload = JSON.stringify({
//             callback:baseURL + '/api/explainer/explain-step/' + refId + "/question/finished",
//             model,
//             exp_setting: JSON.stringify(exp_settings)
//         })

//         console.log(payload)

//         const plannerServiceURL = process.env.PLANNER_SERVICE
//         const plannerRequest = new Request(plannerServiceURL + '/explain/all-mugs-msgs', 
//             {
//                 method: "POST",
//                 headers: {"Content-Type": "application/json"},
//                 body: payload,
//             }
//         )

//         fetch(plannerRequest).then
//             (resp => console.log("Explain computation request submitted."),
//             error => console.log(error)
//         )
        
//         res.send({
//             status: true,
//             message: 'Explain computation registered',
//             data: true
//         });

//     } catch (ex : any) {
//         console.log(ex);
//         res.status(404).send(ex.message);
//     }
// });



// explainerRouter.post('/explain-step/:id/question/finished', async (req: any, res) => {

//     try {

//         console.log(req.body)
//         const refId = req.params.id;
//         const iterationStep: IterationStep | null = await IterationStepModel.findOne({ _id: refId});

//         if (!iterationStep) {
//             return res.status(404).send('update step failed');
//         }

//         if (!iterationStep.explanations) {
//             return res.status(404).send('update explanation failed');
//         }

//         let MUGS = req.body.MUGS as Result
//         let MSGS = req.body.MSGS as Result
//         let status = req.body.status

//         console.log(MUGS)
//         console.log(status)

//         let explanation = iterationStep.explanations[iterationStep.explanations?.length - 1];

//         if(status === 'FINISHED'){
//             explanation.status = ExplanationRunStatus.finished;
//             explanation.answer = 
//             {
//                 type: AnswerType.MUS,
//                 all_possibilities: MUGS.complete,
//                 computed: MUGS.subsets.map(sets => ({elements:sets})),
//                 selected: [],
//                 output: '',
//             };
//         }


//         if(status === 'FAILED'){
//             explanation.status = ExplanationRunStatus.failed;
//         }

//         iterationStep.save()
        
//         res.send({
//             status: true,
//             message: 'Explanation computation finished',
//             data: true
//         });

//     } catch (ex : any) {
//         console.log(ex);
//         res.status(404).send(ex.message);
//     }
// });


explainerRouter.post('/explainer', auth, async (req: any, res) => {

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



explainerRouter.get('/explainer', auth, async (req: any, res) => {
    const explainer = await ExplainerModel.find();
    if (!explainer) { 
        return res.status(404).send({ message: 'No explainer found.' });
    }
    res.send({
        data: explainer
    });

});



explainerRouter.delete('/explainer/:id', auth, async (req, res) => {
    const id = req.params.id;

    const deleteResult = await ExplainerModel.deleteOne({ _id: id});
    if (!deleteResult) { 
        return res.status(404).send({ message: 'Problem during explainer deletion occurred' }); 
    }

    res.send({
        data: deleteResult
    });

});
