import express from 'express';
import { auth } from '../../middleware/auth';
import { ParticipantDistribution, ParticipantDistributionModel } from '../../db_schema/user-study/participant-distribution';
import { error } from 'console';

export const participantDistributerRouter = express.Router();


participantDistributerRouter.post('/', auth, async (req: any, res) => {
    try {
        const participantDistributionData = req.body.data
        participantDistributionData.user = req.user._id;

        const participantDistribution = new ParticipantDistributionModel(participantDistributionData);

        if (!participantDistribution) {
            return res.status(403).send('user study failed');
        }

        const data = await participantDistribution.save();
        res.send({
            status: true,
            message: 'user study created',
            data
        });
    }

    catch (ex : any) {
        console.log(error);
        res.status(500).send();
    }
});


participantDistributerRouter.put('/:id', auth, async (req, res) => {
    try {
        const refId = req.params.id;

        await ParticipantDistributionModel.replaceOne({ _id: refId}, req.body);

        const participantDistribution: ParticipantDistribution | null = await ParticipantDistributionModel.findOne({ _id: refId});

        if (!participantDistribution) {
            return res.status(403).send('update user study failed');
        }

        res.send({
            status: true,
            message: 'user study updated',
            data: participantDistribution
        });

    } catch (ex : any) {
        res.send(ex.message);
    }
});


participantDistributerRouter.get('/', auth, async (req: any, res) => {
    try {
        const metaStudies = await ParticipantDistributionModel.find({ user: req.user._id});

        if (!metaStudies) { return res.status(404).send({ message: 'Lookup user studies failed.' }); }

        res.send({
            data: metaStudies
        });
    } catch (ex : any) {
        res.send(ex.message);
    }

});


participantDistributerRouter.get('/:id', async (req: any, res) => {

    const id = req.params.id;

    const participantDistribution = await ParticipantDistributionModel.findOne({ _id: id });

    if (!participantDistribution) { 
        return res.status(404).send({ message: 'No user study found.' });
    }

    res.send({
        data: participantDistribution
    });

});

participantDistributerRouter.delete('/:id', auth, async (req, res) => {

    const id = req.params.id;

    const participantDistribution = await ParticipantDistributionModel.deleteOne({ _id: id });

    if (!participantDistribution) { 
        return res.status(404).send({ message: 'No user study found.' });
    }

    res.send({
        data: participantDistribution
    });

});



