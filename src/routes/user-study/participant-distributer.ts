import express from 'express';
import { auth, AuthenticatedRequest } from '../../middleware/auth';
import { ParticipantDistribution, ParticipantDistributionModel } from '../../db_schema/user-study/participant-distribution';
import { error } from 'console';
import { UserStudyExecutionModel } from '../../db_schema/user-study/user-study-execution';

export const participantDistributerRouter = express.Router();


participantDistributerRouter.post('/', auth, async (req: AuthenticatedRequest, res) => {
    try {
        if (!req.user) {
            res.status(401).send();
            return;
        }

        const participantDistributionData = req.body.data
        participantDistributionData.user = req.user._id;

        const participantDistribution = new ParticipantDistributionModel(participantDistributionData);

        if (!participantDistribution) {
            res.status(403).send('user study failed');
            return;
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

        console.log("Update distribution: " + refId);

        await ParticipantDistributionModel.replaceOne({ _id: refId}, req.body.data);

        const participantDistribution: ParticipantDistribution | null = await ParticipantDistributionModel.findOne({ _id: refId});

        console.log(participantDistribution);

        if (!participantDistribution) {
            res.status(403).send('update user study failed');
            return;
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


participantDistributerRouter.get('/', auth, async (req: AuthenticatedRequest, res) => {
    try {
        if (!req.user) {
            res.status(401).send();
            return;
        }

        const metaStudies = await ParticipantDistributionModel.find({ user: req.user._id});

        if (!metaStudies) { 
            res.status(404).send({ message: 'Lookup user studies failed.' });
            return;
        }

        res.send({
            data: metaStudies
        });
    } catch (ex : any) {
        res.send(ex.message);
    }

});


participantDistributerRouter.get('/:id/next', async (req: any, res) => {
    try {
        const id = req.params.id;

        const participantDistribution = await ParticipantDistributionModel.findOne({ _id: id });

        if (!participantDistribution) { 
            res.status(404).send({ message: 'No user study found.' });
            return;
        }

        let numUserStudyParticipants: Record<string, number> = {};
        for(let us of participantDistribution.userStudies){
            const participants = await UserStudyExecutionModel.find({userStudy: us.userStudy});

            if (!participants) { 
                res.status(404).send({ message: 'No user study found.' });
                return;
            }

            numUserStudyParticipants[us.userStudy] = participants.length;
        }

        let minProcessed = 1;
        let minProcessedId = null;

        for(let us of participantDistribution.userStudies){
            let processedFraction = numUserStudyParticipants[us.userStudy] / us.numberParticipants;
            if(processedFraction < minProcessed){
                minProcessed = processedFraction;
                minProcessedId = us.userStudy;
            }
        }

        if (!minProcessedId) { 
            res.status(404).send({ message: 'No user study found.' });
            return;
        }

        res.send({
            data: minProcessedId
        });
    } catch (ex : any) {
        console.log(ex.message)
        res.status(500).send();
    }
});


participantDistributerRouter.get('/:id', async (req: any, res) => {
    try{
        const id = req.params.id;

        const participantDistribution = await ParticipantDistributionModel.findOne({ _id: id });

        if (!participantDistribution) { 
            res.status(404).send({ message: 'No user study found.' });
            return;
        }

        res.send({
            data: participantDistribution
        });
    } catch (ex : any) {
        console.log(ex.message)
        res.status(500).send();
    }

});

participantDistributerRouter.delete('/:id', auth, async (req, res) => {
    try{
        const id = req.params.id;

        const participantDistribution = await ParticipantDistributionModel.deleteOne({ _id: id });

        if (!participantDistribution) { 
            res.status(404).send({ message: 'No user study found.' });
            return;
        }

        res.send({
            data: participantDistribution
        });
    } catch (ex : any) {
        console.log(ex.message)
        res.status(500).send();
    }

});



