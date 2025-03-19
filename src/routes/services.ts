import express from 'express';

import { Service, ServiceBaseZ, ServiceModel } from '../db_schema/services';
import { authAdmin, authAny } from '../middleware/auth';

export const serviceRouter = express.Router();


serviceRouter.post('', authAdmin, async (req, res) => {
    try {
        const serviceData = ServiceBaseZ.parse(req.body);

        const service = new ServiceModel(serviceData);
        if (!service) {
            return res.status(500).send('service not created');
        }
        const newService = await service.save();

        res.send(newService);
    }
    catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }
});


serviceRouter.put('/:id', authAdmin, async (req, res) => {
    try {
        const refId = req.params.id;

        const serviceData = ServiceBaseZ.parse(req.body);

        await ServiceModel.replaceOne({ _id: refId}, serviceData);

        const service: Service | null = await ServiceModel.findOne({ _id: refId}).lean();

        if (!service) {
            return res.status(403).send('update service failed');
        }

        res.send(service);

    } catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }
});


serviceRouter.get('', authAny, async (req, res) => {
    try {

        const services = await ServiceModel.find();

        if (!services) { 
            return res.status(404).send({ message: 'No service found.' });
        }

        res.send(services);

    } catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }

});


serviceRouter.delete('/:id', authAdmin, async (req, res) => {

    try{
        const result = await ServiceModel.deleteOne({ _id: req.params.id});

        if (result.deletedCount !== 1) { 
            return res.status(404).send({ message: 'No service found.' });
        }

        res.send(true);

    } catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }
});



