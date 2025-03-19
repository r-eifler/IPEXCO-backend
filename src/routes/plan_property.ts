import express from 'express';

import { PlanProperty, PlanPropertyBaseZ, PlanPropertyModel, PlanPropertyOfProjectZ, PlanPropertyZ } from '../db_schema/plan-properties/plan_property';
import { auth, authAny } from '../middleware/auth';
import { string } from 'zod';

export const planPropertyRouter = express.Router();


planPropertyRouter.post('/', auth, async (req, res) => {
    try {
        console.log(req.body);
        const planPropertyData = PlanPropertyOfProjectZ.parse(req.body);

        const planProperty = new PlanPropertyModel(planPropertyData);
        if (!planProperty) {
            return res.status(403).send('Plan-property could not be found.');
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
            return res.status(403).send('update property failed');
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
            return res.status(404).send({ message: 'no projectId specified' });
        }
        const projectId = string().parse(req.query.projectId);
        const properties = await PlanPropertyModel.find({ project: projectId});

        if (!properties) { 
            return res.status(404).send({ message: 'No plan-property found.' });
        }

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
            return res.status(404).send({ message: 'No plan-property found.' });
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
            return res.status(404).send({ message: 'No plan-property found.' });
        }

        res.send(result.deletedCount == 1);

    } catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }
});

