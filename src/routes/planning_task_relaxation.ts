import express from 'express';
import { PlanningTaskRelaxationSpace, PlanningTaskRelaxationSpaceModel } from '../db_schema/relaxations';

import { auth } from '../middleware/auth';

export const planningTaskRelaxtionRouter = express.Router();


planningTaskRelaxtionRouter.post('/', auth, async (req, res) => {
    try {
        const relaxationData = req.body.data as PlanningTaskRelaxationSpace;
        console.log(relaxationData);

        const relaxSpace = new PlanningTaskRelaxationSpaceModel(relaxationData);
        if (!relaxSpace) {
            return res.status(403).send('Relaxation Space could not be found.');
        }
        const data = await relaxSpace.save();

        res.send({
            status: true,
            message: 'Plan Property is stored.',
            data
        });
    }

    catch (ex : any) {
        console.log(ex.message);
        res.send(ex.message);
    }
});


planningTaskRelaxtionRouter.put('/:id', auth, async (req, res) => {
    try {
        const refId = req.params.id;
        const relaxationData = req.body.data as PlanningTaskRelaxationSpace;

        await PlanningTaskRelaxationSpaceModel.replaceOne({ _id: refId}, relaxationData);

        const relaxSpace: PlanningTaskRelaxationSpace | null = await PlanningTaskRelaxationSpaceModel.findOne({ _id: refId}).lean();

        if (!relaxSpace) {
            return res.status(403).send('update relaxation space failed');
        }

        res.send({
            status: true,
            message: 'relaxation space updated',
            data: relaxSpace
        });

    } catch (ex : any) {
        res.send(ex.message);
    }
});

planningTaskRelaxtionRouter.get('/', async (req, res) => {
    if (req.query.projectId === undefined) {
        return res.status(404).send({ message: 'no projectId specified' });
    }
    const projectId : string = req.query.projectId as string;
    const relaxSpaces = await PlanningTaskRelaxationSpaceModel.find({ project: projectId});

    if (!relaxSpaces) { 
        return res.status(404).send({ message: 'No relaxation space found.' });
    }

    res.send({
        data: relaxSpaces
    });

});

planningTaskRelaxtionRouter.get('/:id', auth, async (req, res) => {

    const property = await PlanningTaskRelaxationSpaceModel.findOne({_id: req.params.id});

    if (!property) { 
        return res.status(404).send({ message: 'No relaxation space found.' });
    }

    res.send({
        data: property
    });

});

planningTaskRelaxtionRouter.delete('/:id', auth, async (req, res) => {

    const property = await PlanningTaskRelaxationSpaceModel.deleteOne({ _id: req.params.id});

    if (!property) { 
        return res.status(404).send({ message: 'No relaxation space found.' });
    }

    res.send({
        data: property
    });

});

