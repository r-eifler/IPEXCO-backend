import { UserStudyModel, UserStudy } from '../../db_schema/user-study/user-study';
import express from 'express';
import mongoose from 'mongoose';
import { auth, authForward, authUserStudy } from '../../middleware/auth';
import { USUser, USUserModel } from '../../db_schema/user-study/user-study-user';
import {UserStudyData, UserStudyDemoData, UserStudyDataModel
} from '../../db_schema/user-study/user-study-store';
import { DepExplanationRun, PlanRun } from '../../db_schema/iteration_step';

export const userStudyRouter = express.Router();


userStudyRouter.post('/', auth, async (req: any, res) => {
    try {
        const userStudyData = req.body.data as UserStudy;
        userStudyData.user = req.user._id;

        const userStudy: UserStudy = new UserStudyModel(userStudyData);

        if (!userStudy) {
            return res.status(403).send('user study failed');
        }

        const data = await userStudy.save();

        res.send({
            status: true,
            message: 'user study created',
            data
        });
    }

    catch (ex) {
        res.send(ex.message);
    }
});


userStudyRouter.put('/:id', auth, async (req, res) => {
    try {
        const refId = req.params.id;

        await UserStudyModel.replaceOne({ _id: req.params.id}, req.body);

        const userStudy: UserStudy | null = await UserStudyModel.findOne({ _id: refId});

        if (!userStudy) {
            return res.status(403).send('update user study failed');
        }

        res.send({
            status: true,
            message: 'user study updated',
            data: userStudy
        });

    } catch (ex) {
        res.send(ex.message);
    }
});


userStudyRouter.get('/', authForward, async (req: any, res) => {
    try {
        let userStudies: UserStudy[] = await UserStudyModel.find({ available: true});

        if (req.user) {
            userStudies.concat(await UserStudyModel.find({ user: req.user._id, available: false}));
        } 

        if (!userStudies) { 
            return res.status(404).send({ message: 'Lookup user studies failed.' });
        }

        res.send({
            data: userStudies
        });
    } catch (ex) {
        res.send(ex.message);
    }

});



userStudyRouter.get('/:id', authForward, authUserStudy, async (req: any, res) => {

    if (! req.user && ! req.userStudyUser) {
        return res.status(401).send({ message: 'Not authorized to access this resource' });
    }

    const id = req.params.id;
    const userStudy = await UserStudyModel.findOne({ _id: id });

    if (!userStudy) { 
        return res.status(404).send({ message: 'No user study found.' });
    }

    res.send({
        data: userStudy
    });

});

userStudyRouter.delete('/:id', auth, async (req, res) => {

    const id = req.params.id;
    const userStudy = await UserStudyModel.deleteOne({ _id: id });

    if (!userStudy) { 
        return res.status(404).send({ message: 'No user study found.' });
    }

    res.send({
        data: userStudy
    });

});


userStudyRouter.get('/:id/data', auth, async (req, res) => {
    try {
        const refId = req.params.id;

        const userStudy: UserStudy | null = await UserStudyModel.findOne({ _id: refId});

        if (!userStudy) {
            return res.status(403).send('load data user study failed');
        }

        const users: USUser[] = await  USUserModel.find({ userStudy: userStudy._id});

        const data: UserStudyData[] = [];
        for (const user of users) {

            const userData: UserStudyData | null = await UserStudyDataModel.findOne({user: user._id}).populate('demoSteps');
            if (userData)
                data.push(userData);
        }


        res.send({
            status: true,
            message: 'user study updated',
            data
        });

    } catch (ex) {
        res.send(ex.message);
    }
});



userStudyRouter.get('/:id/users', auth, async (req, res) => {
    try {
        const refId = req.params.id;

        const userStudy: UserStudy | null = await UserStudyModel.findOne({ _id: refId});

        if (!userStudy) {
            return res.status(403).send('update user study failed');
        }

        const users: USUser[] = await  USUserModel.find({ userStudy: userStudy._id});

        res.send({
            status: true,
            message: 'user study updated',
            data: users
        });

    } catch (ex) {
        res.send(ex.message);
    }
});

userStudyRouter.get('/:id/num_accepted_users', async (req, res) => {
    try {
        const refId = req.params.id;

        const userStudy: UserStudy | null = await UserStudyModel.findOne({ _id: refId});

        if (!userStudy) {
            return res.status(403).send('update user study failed');
        }

        const users: USUser[] = await  USUserModel.find({ userStudy: userStudy._id, accepted: true});
        const numUsers = users.length;

        res.send({
            status: true,
            message: 'num accepted users',
            data: numUsers
        });

    } catch (ex) {
        res.send(ex.message);
    }
});
