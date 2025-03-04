import express from 'express';

import { auth, authAny } from '../middleware/auth';
import { DomainSpecification, DomainSpecificationModel, DomainSpecificationZ } from '../db_schema/domain_specification';

export const domainSpecificationRouter = express.Router();


domainSpecificationRouter.post('', auth, async (req, res) => {
    try {
        const domainSpecificationData = DomainSpecificationZ.parse(req.body);

        const domainSpecification = new DomainSpecificationModel(domainSpecificationData);
        if (!domainSpecification) {
            return res.status(500).send('domainSpecification not created');
        }
        const data = await domainSpecification.save();

        res.send(data);
    }
    catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }
});


domainSpecificationRouter.put('/:id', auth, async (req, res) => {
    try {
        const refId = req.params.id;

        const domainSpecificationData = DomainSpecificationZ.parse(req.body);

        await DomainSpecificationModel.replaceOne({ _id: refId}, domainSpecificationData);

        const domainSpecification: DomainSpecification | null = await DomainSpecificationModel.findOne({ _id: refId}).lean();

        if (!domainSpecification) {
            return res.status(403).send('update domain specification failed');
        }

        res.send(domainSpecification);

    } catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }
});


domainSpecificationRouter.get('', authAny, async (req, res) => {
    try {

        const domainSpecifications = await DomainSpecificationModel.find();

        if (!domainSpecifications) { 
            return res.status(404).send({ message: 'No domainSpecification found.' });
        }

        res.send(domainSpecifications);

    } catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }

});

domainSpecificationRouter.get('/:id', authAny, async (req, res) => {
    try {

        const domainSpecification = await DomainSpecificationModel.findById(req.params.id);

        if (!domainSpecification) { 
            return res.status(404).send({ message: 'No domainSpecification found.' });
        }

        res.send(domainSpecification);

    } catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }

});

domainSpecificationRouter.delete('/:id', auth, async (req, res) => {

    try{
        const result = await DomainSpecificationModel.deleteOne({ _id: req.params.id});

        if (result.deletedCount == 1) { 
            return res.status(404).send({ message: 'No domainSpecification found.' });
        }

        res.send(true);

    } catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }
});



