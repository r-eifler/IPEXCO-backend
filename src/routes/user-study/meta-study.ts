import { MetaStudyModel, MetaStudy } from '../../db_schema/user-study/user-study';
import express from 'express';
import { auth } from '../../middleware/auth';

export const metaStudyRouter = express.Router();


metaStudyRouter.post('/', auth, async (req: any, res) => {
    try {
        const metaStudyData = req.body.data
        metaStudyData.user = req.user._id;

        const metaStudy: MetaStudy = new MetaStudyModel(metaStudyData);

        if (!metaStudy) {
            return res.status(403).send('user study failed');
        }

        const data = await metaStudy.save();
        res.send({
            status: true,
            message: 'user study created',
            data
        });
    }

    catch (ex : any) {
        res.send(ex.message);
    }
});


metaStudyRouter.put('/:id', auth, async (req, res) => {
    try {
        const refId = req.params.id;

        await MetaStudyModel.replaceOne({ _id: refId}, req.body);

        const metaStudy: MetaStudy | null = await MetaStudyModel.findOne({ _id: refId});

        if (!metaStudy) {
            return res.status(403).send('update user study failed');
        }

        res.send({
            status: true,
            message: 'user study updated',
            data: metaStudy
        });

    } catch (ex : any) {
        res.send(ex.message);
    }
});


metaStudyRouter.get('/', auth, async (req: any, res) => {
    try {
        const metaStudies = await MetaStudyModel.find({ user: req.user._id});

        if (!metaStudies) { return res.status(404).send({ message: 'Lookup user studies failed.' }); }

        res.send({
            data: metaStudies
        });
    } catch (ex : any) {
        res.send(ex.message);
    }

});


metaStudyRouter.get('/:id', async (req: any, res) => {

    const id = req.params.id;

    const metaStudy = await MetaStudyModel.findOne({ _id: id });

    if (!metaStudy) { 
        return res.status(404).send({ message: 'No user study found.' });
    }

    res.send({
        data: metaStudy
    });

});

metaStudyRouter.delete('/:id', auth, async (req, res) => {

    const id = req.params.id;

    const metaStudy = await MetaStudyModel.deleteOne({ _id: id });

    if (!metaStudy) { 
        return res.status(404).send({ message: 'No user study found.' });
    }

    res.send({
        data: metaStudy
    });

});



