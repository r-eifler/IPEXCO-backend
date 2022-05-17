import { UserStudyData } from './../../db_schema/user-study/user-study-store';
import { auth, authForward, authUserStudy } from '../../middleware/auth';
import express from 'express';
import { USUser, USUserModel } from '../../db_schema/user-study/user-study-user';
import mongoose from 'mongoose';
import { MetaStudy, MetaStudyModel } from '../../db_schema/user-study/user-study';
import { metaStudyRouter } from './meta-study';
import { UserStudyDataModel } from '../../db_schema/user-study/user-study-store';

export const userStudyUserRouter = express.Router();

userStudyUserRouter.post('/', async (req, res) => {

    try {
        const userData = req.body.data.user
        const userStudyId = req.body.data.userStudyId
        console.log(req.body.data);
        const user = new USUserModel(userData);
        await user.save();
        const token = await user.generateAuthToken();

        const metaData = new UserStudyDataModel({
            user,
            userStudy: userStudyId,
            finished: false,
            accepted: false,
            payment: 0,
            demoSteps: []
        });
        await metaData.save();

        res.status(201).send({ user, token, metaData });

    } catch (error) {
        console.log(error.message);
        res.status(400).send(error.message);
    }
});



userStudyUserRouter.post('/logout', authUserStudy,  async (req: any, res) => {

    try {
        req.userStudyUser.token = null;
        await req.userStudyUser.save();

        const metaData: UserStudyData | null = await UserStudyDataModel.findOne({user: req.userStudyUser._id});

        if(metaData){
            metaData.finished = true;
            await metaData.save();
        }

        res.send();
    } catch (error) {
        res.status(500).send(error);
    }
});
