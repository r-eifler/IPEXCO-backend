import express from 'express';

import { PlanProperty, PlanPropertyModel } from '../db_schema/plan-properties/plan_property';
import { auth } from '../middleware/auth';

export const planPropertyRouter = express.Router();


planPropertyRouter.post('/', auth, async (req, res) => {
    try {
        console.log(req.body);
        const planPropertyData = req.body.data as PlanProperty;

        const planProperty = new PlanPropertyModel(planPropertyData);
        if (!planProperty) {
            return res.status(403).send('Plan-property could not be found.');
        }
        const data = await planProperty.save();

        res.send({
            status: true,
            message: 'Plan Property is stored.',
            data
        });
    }

    catch (ex) {
        console.log(ex.message);
        res.send(ex.message);
    }
});


planPropertyRouter.put('/:id', auth, async (req, res) => {
    try {
        const refId = req.params.id;

        const planPropertyData = req.body.data as PlanProperty;

        await PlanPropertyModel.replaceOne({ _id: refId}, planPropertyData);

        const planProperty: PlanProperty | null = await PlanPropertyModel.findOne({ _id: refId}).lean();

        if (!planProperty) {
            return res.status(403).send('update property failed');
        }

        res.send({
            status: true,
            message: 'property updated',
            data: planProperty
        });

    } catch (ex) {
        res.send(ex.message);
    }
});

planPropertyRouter.get('/', async (req, res) => {
    if (req.query.projectId === undefined) {
        return res.status(404).send({ message: 'no projectId specified' });
    }
    const projectId : string = req.query.projectId as string;
    const properties = await PlanPropertyModel.find({ project: projectId});

    if (!properties) { 
        return res.status(404).send({ message: 'No plan-property found.' });
    }

    res.send({
        data: properties
    });

});

planPropertyRouter.get('/:id', auth, async (req, res) => {

    const property = await PlanPropertyModel.findOne({_id: req.params.id});

    if (!property) { 
        return res.status(404).send({ message: 'No plan-property found.' });
    }

    res.send({
        data: property
    });

});

planPropertyRouter.delete('/:id', auth, async (req, res) => {

    const property = await PlanPropertyModel.deleteOne({ _id: req.params.id});

    if (!property) { 
        return res.status(404).send({ message: 'No plan-property found.' });
    }

    res.send({
        data: property
    });

});

