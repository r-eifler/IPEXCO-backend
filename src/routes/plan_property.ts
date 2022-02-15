import express from 'express';
import mongoose from 'mongoose';

import { PlanProperty, PlanPropertyModel } from '../db_schema/plan-properties/plan_property';
import { auth } from '../middleware/auth';

export const planPropertyRouter = express.Router();


planPropertyRouter.post('/', auth, async (req, res) => {
    try {
        const planProperty = new PlanPropertyModel({
            name: req.body.name,
            type: req.body.type,
            domain: req.body.domain,
            formula: req.body.formula,
            actionSets: req.body.actionSets,
            naturalLanguageDescription: req.body.naturalLanguageDescription,
            project: req.body.project,
            isUsed: req.body.isUsed,
            globalHardGoal: req.body.globalHardGoal,
            value: req.body.value,
        });
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
        res.send(ex.message);
    }
});


planPropertyRouter.put('/:id', auth, async (req, res) => {
    try {
        const refId = mongoose.Types.ObjectId(req.params.id);

        await PlanPropertyModel.replaceOne({ _id: refId}, req.body);

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

    // console.log('GET properties from project: ' + req.query.projectId + ': #' + properties.length);
    if (!properties) { return res.status(404).send({ message: 'No plan-property found.' }); }

    res.send({
        data: properties
    });

});

planPropertyRouter.get('/:id', auth, async (req, res) => {
    const id = mongoose.Types.ObjectId(req.params.id);
    const property = await PlanPropertyModel.findOne({ _id: id });
    if (!property) { return res.status(404).send({ message: 'No plan-property found.' }); }
    res.send({
        data: property
    });

});

planPropertyRouter.delete('/:id', auth, async (req, res) => {
    const id = mongoose.Types.ObjectId(req.params.id);
    const property = await PlanPropertyModel.deleteOne({ _id: id });
    if (!property) { return res.status(404).send({ message: 'No plan-property found.' }); }
    res.send({
        data: property
    });

});

