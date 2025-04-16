import express from 'express';

import { string } from 'zod';
import { PlanProperty, PlanPropertyModel, PlanPropertyOfProjectZ, PlanPropertyZ } from '../db_schema/plan-properties/plan_property';
import { auth, authAny } from '../middleware/auth';

export const planPropertyRouter = express.Router();


planPropertyRouter.post('/', auth, async (req, res) => {
    try {
        console.log(req.body);
        const planPropertyData = PlanPropertyOfProjectZ.parse(req.body);

        const planProperty = new PlanPropertyModel(planPropertyData);
        if (!planProperty) {
            res.status(403).send('Plan-property could not be found.');
            return;
        }
        const data = await planProperty.save();

        res.send(data);
    }
    catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }
});


planPropertyRouter.put('/:id', auth, async (req, res) => {
    try {
        const refId = req.params.id;

        const planPropertyData = PlanPropertyZ.parse(req.body);

        await PlanPropertyModel.replaceOne({ _id: refId}, planPropertyData);

        const planProperty: PlanProperty | null = await PlanPropertyModel.findOne({ _id: refId}).lean();

        if (!planProperty) {
            res.status(403).send('update property failed');
            return;
        }

        res.send(planProperty);

    } catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }
});

planPropertyRouter.get('/', authAny, async (req, res) => {
    try {
        if (req.query.projectId === undefined) {
            res.status(404).send({ message: 'no projectId specified' });
            return;
        }
        const projectId = string().parse(req.query.projectId);
        const properties = await PlanPropertyModel.find({ project: projectId});

        if (!properties) { 
            res.status(404).send({ message: 'No plan-property found.' });
            return;
        }
        console.log("#properties: " + properties.length)
        res.send(properties);

    } catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }

});

planPropertyRouter.get('/:id', authAny, async (req, res) => {
    try{
        const property = await PlanPropertyModel.findOne({_id: req.params.id});

        if (!property) { 
            res.status(404).send({ message: 'No plan-property found.' });
            return;
        }

        res.send(property);
        
    } catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }
});

planPropertyRouter.delete('/:id', auth, async (req, res) => {

    try{
        const result = await PlanPropertyModel.deleteOne({ _id: req.params.id});

        if (!result) { 
            res.status(404).send({ message: 'No plan-property found.' });
            return;
        }

        res.send(result.deletedCount == 1);

    } catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }
});

