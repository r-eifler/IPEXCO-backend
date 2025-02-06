import express from 'express';

import { Service, ServiceModel } from '../db_schema/services';
import { authAdmin, authAny } from '../middleware/auth';

export const serviceRouter = express.Router();


serviceRouter.post('', authAdmin, async (req, res) => {
    try {
        const serviceData = req.body.data as Service;

        const service = new ServiceModel(serviceData);
        if (!service) {
            return res.status(500).send('service not created');
        }
        const data = await service.save();

        res.send({
            status: true,
            message: 'service saved',
            data
        });
    }
    catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }
});


serviceRouter.put('/:id', authAdmin, async (req, res) => {
    try {
        const refId = req.params.id;

        const serviceData = req.body.data as Service;

        await ServiceModel.replaceOne({ _id: refId}, serviceData);

        const service: Service | null = await ServiceModel.findOne({ _id: refId}).lean();

        if (!service) {
            return res.status(403).send('update service failed');
        }

        res.send({
            status: true,
            message: 'service updated',
            data: service
        });

    } catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }
});


serviceRouter.get('', authAny, async (req, res) => {
    try {

        const service = await ServiceModel.find();

        if (!service) { 
            return res.status(404).send({ message: 'No service found.' });
        }

        res.send({
            data: service
        });
    } catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }

});


serviceRouter.delete('/:id', authAdmin, async (req, res) => {

    try{
        const result = await ServiceModel.deleteOne({ _id: req.params.id});

        if (!result) { 
            return res.status(404).send({ message: 'No service found.' });
        }

        res.send({
            data: result
        });
    } catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }
});



