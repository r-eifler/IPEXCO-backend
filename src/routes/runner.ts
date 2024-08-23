import { auth } from '../middleware/auth';
import express from 'express';

import { ExplainerModel, Planner, PlannerModel } from '../db_schema/runner';

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
