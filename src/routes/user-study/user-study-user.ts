import { auth, authForward, authUserStudy } from '../../middleware/auth';
import express from 'express';
import { USUser, USUserModel } from '../../db_schema/user-study/user-study-user';
import mongoose from 'mongoose';
import { MetaStudy, MetaStudyModel } from '../../db_schema/user-study/user-study';
import { metaStudyRouter } from './meta-study';

export const userStudyUserRouter = express.Router();

userStudyUserRouter.post('/', async (req, res) => {

    try {
        const userData = req.body.data
        const user = new USUserModel(userData);
        await user.save();
        const token = await user.generateAuthToken();
        res.status(201).send({ user, token });

    } catch (error) {
        res.status(400).send(error);
    }
});


userStudyUserRouter.post('/timelog', authUserStudy,  async (req: any, res) => {

    try {
        const timeLog = req.body.data;
        const userStudyUser = req.userStudyUser;
        userStudyUser.timeLog = timeLog;
        userStudyUser.save().then(() => res.send(), (err: any) => console.log(err));
    } catch (error) {
        res.status(500).send(error);
    }
});


userStudyUserRouter.put('/payment', authUserStudy,  async (req: any, res) => {

    try {
        const payment = req.body.data;
        const userStudyUser = req.userStudyUser;
        userStudyUser.payment = payment;
        userStudyUser.save().then(() => res.send(), (err: any) => console.log(err));
    } catch (error) {
        res.status(500).send(error);
    }
});

userStudyUserRouter.put('/:id', auth, async (req, res) => {
    try {
        const refId = req.params.id;

        const usUser: USUser | null = await USUserModel.findOne({ _id: refId});

        if (!usUser) {
            return res.status(403).send('update user failed');
        }

        usUser.accepted = req.body.usUser.accepted;
        await usUser.save();

        res.send({
            status: true,
            message: 'us user updated',
            data: usUser
        });

    } catch (ex) {
        res.send(ex.message);
    }
});


userStudyUserRouter.post('/logout', authUserStudy,  async (req: any, res) => {

    try {
        req.userStudyUser.token = null;
        req.userStudyUser.finished = true;
        await req.userStudyUser.save();
        res.send();
    } catch (error) {
        res.status(500).send(error);
    }
});
