import express from 'express';

import { auth, authAny } from '../middleware/auth';
import { DomainSpecification, DomainSpecificationModel } from '../db_schema/domain_specification';

export const domainSpecificationRouter = express.Router();


domainSpecificationRouter.post('', auth, async (req, res) => {
    try {
        const domainSpecificationData = req.body.data as DomainSpecification;

        const domainSpecification = new DomainSpecificationModel(domainSpecificationData);
        if (!domainSpecification) {
            return res.status(500).send('domainSpecification not created');
        }
        const data = await domainSpecification.save();

        res.send({
            status: true,
            message: 'domain specification saved',
            data
        });
    }
    catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }
});


domainSpecificationRouter.put('/:id', auth, async (req, res) => {
    try {
        const refId = req.params.id;

        const domainSpecificationData = req.body.data as DomainSpecification;

        await DomainSpecificationModel.replaceOne({ _id: refId}, domainSpecificationData);

        const domainSpecification: DomainSpecification | null = await DomainSpecificationModel.findOne({ _id: refId}).lean();

        if (!domainSpecification) {
            return res.status(403).send('update domain specification failed');
        }

        res.send({
            status: true,
            message: 'domain specification updated',
            data: domainSpecification
        });

    } catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }
});


domainSpecificationRouter.get('', authAny, async (req, res) => {
    try {

        const domainSpecification = await DomainSpecificationModel.find();

        if (!domainSpecification) { 
            return res.status(404).send({ message: 'No domainSpecification found.' });
        }

        res.send({
            data: domainSpecification
        });
    } catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }

});

domainSpecificationRouter.delete('/explainer/:id', auth, async (req, res) => {

    try{
        const result = await DomainSpecificationModel.deleteOne({ _id: req.params.id});

        if (!result) { 
            return res.status(404).send({ message: 'No domainSpecification found.' });
        }

        res.send({
            data: result
        });
    } catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }
});



