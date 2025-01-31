import express from 'express';

import { auth, authAdmin, authAny } from '../middleware/auth';
import { Explainer, ExplainerModel, Planner, PlannerModel } from '../db_schema/services';

export const serviceRouter = express.Router();


serviceRouter.post('/explainer', authAdmin, async (req, res) => {
    try {
        const explainerData = req.body.data as Explainer;

        const explainer = new ExplainerModel(explainerData);
        if (!explainer) {
            return res.status(500).send('explainer not created');
        }
        const data = await explainer.save();

        res.send({
            status: true,
            message: 'explainer saved',
            data
        });
    }
    catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }
});


serviceRouter.post('/planner', authAdmin, async (req, res) => {
    try {
        const plannerData = req.body.data as Planner;

        const planner = new PlannerModel(plannerData);
        if (!planner) {
            return res.status(500).send('explainer not created');
        }
        const data = await planner.save();

        res.send({
            status: true,
            message: 'explainer saved',
            data
        });
    }
    catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }
});


serviceRouter.put('/explainer/:id', authAdmin, async (req, res) => {
    try {
        const refId = req.params.id;

        const explainerData = req.body.data as Explainer;

        await ExplainerModel.replaceOne({ _id: refId}, explainerData);

        const explainer: Explainer | null = await ExplainerModel.findOne({ _id: refId}).lean();

        if (!explainer) {
            return res.status(403).send('update explainer failed');
        }

        res.send({
            status: true,
            message: 'explainer updated',
            data: explainer
        });

    } catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }
});


serviceRouter.put('/planner/:id', authAdmin, async (req, res) => {
    try {
        const refId = req.params.id;

        const plannerData = req.body.data as Explainer;

        await ExplainerModel.replaceOne({ _id: refId}, plannerData);

        const planner: Explainer | null = await ExplainerModel.findOne({ _id: refId}).lean();

        if (!planner) {
            return res.status(403).send('update planner failed');
        }

        res.send({
            status: true,
            message: 'planner updated',
            data: planner
        });

    } catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }
});

serviceRouter.get('/explainer', authAny, async (req, res) => {
    try {

        const explainer = await ExplainerModel.find();

        if (!explainer) { 
            return res.status(404).send({ message: 'No explainer found.' });
        }

        res.send({
            data: explainer
        });
    } catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }

});

serviceRouter.get('/planner', authAny, async (req, res) => {
    try {

        const planner = await PlannerModel.find();

        if (!planner) { 
            return res.status(404).send({ message: 'No planner found.' });
        }

        res.send({
            data: planner
        });
    } catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }

});



serviceRouter.delete('/explainer/:id', authAdmin, async (req, res) => {

    try{
        const result = await ExplainerModel.deleteOne({ _id: req.params.id});

        if (!result) { 
            return res.status(404).send({ message: 'No explainer found.' });
        }

        res.send({
            data: result
        });
    } catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }
});

serviceRouter.delete('/planner/:id', authAdmin, async (req, res) => {

    try{
        const result = await PlannerModel.deleteOne({ _id: req.params.id});

        if (!result) { 
            return res.status(404).send({ message: 'No planner found.' });
        }

        res.send({
            data: result
        });
    } catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }
});


