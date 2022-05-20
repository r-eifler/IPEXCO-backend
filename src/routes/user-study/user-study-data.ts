import { UserStudyModel, UserStudy } from '../../db_schema/user-study/user-study';
import express from 'express';
import mongoose from 'mongoose';
import { auth, authForward, authUserStudy } from '../../middleware/auth';
import { USUser, USUserModel } from '../../db_schema/user-study/user-study-user';
import {UserStudyData, UserStudyDataModel} from '../../db_schema/user-study/user-study-store';
import { DepExplanationRun, PlanRun } from '../../db_schema/iteration_step';

export const userStudyDataRouter = express.Router();

userStudyDataRouter.put('/', authUserStudy, async (req, res) => {
    try {
        const userStudyUser = req.userStudyUser;
        const newMetaData: UserStudyData = req.body.data;

        const metaData: UserStudyData | null = await UserStudyDataModel.findOne({ user: userStudyUser._id})
            .populate('user')
            .populate('demosData.iterationSteps');;

        if (!metaData) {
            return res.status(403).send('update user failed');
        }

        metaData.accepted = newMetaData.accepted;
        metaData.finished = newMetaData.finished;
        metaData.payment = newMetaData.payment;
        metaData.timeLog = newMetaData.timeLog;
        await metaData.save();

        res.send({
            status: true,
            message: 'us user updated',
            data: metaData
        });

    } catch (ex) {
        res.send(ex.message);
    }
});


userStudyDataRouter.put('/:id', auth, async (req, res) => {
    try {
        const refId = req.params.id;
        const newMetaData: UserStudyData = req.body.data;

        const metaData: UserStudyData | null = await UserStudyDataModel.findOne({ _id: refId})
            .populate('user')
            .populate('demosData.iterationSteps');

        if (!metaData) {
            return res.status(403).send('update user failed');
        }

        metaData.accepted = newMetaData.accepted;
        metaData.finished = newMetaData.finished;
        metaData.payment = newMetaData.payment;
        metaData.timeLog = newMetaData.timeLog;
        await metaData.save();

        res.send({
            status: true,
            message: 'us user updated',
            data: metaData
        });

    } catch (ex) {
        res.send(ex.message);
    }
});


userStudyDataRouter.get('/', auth, async (req: any, res) => {
    try {
        //TODO find only matching datapoints
        const refIdUserStudy : string = req.query.userStudyId as string;
        console.log("Study ID: " + refIdUserStudy);
        const allData: UserStudyData[] = await UserStudyDataModel.find()
            .populate('user')
            .populate('demosData.iterationSteps');

        // console.log(allData);
        console.log("#allDataPoints: " + allData.length);
        const dataPoints = allData.filter(
            s => (s.userStudy.toString() == refIdUserStudy)
        );

        console.log("#dataPoints: " + dataPoints.length);
        if (!dataPoints) { 
            return res.status(404).send({ message: 'Lookup user study data failed.' });
        }

        res.send({
            data: dataPoints
        });
    } catch (ex) {
        res.send(ex.message);
    }

});


userStudyDataRouter.delete('/:id', auth, async (req, res) => {

    //TODO

    res.send({
        data: "TODO"
    });

});


// userStudyRouter.get('/:id/data', auth, async (req, res) => {
//     try {
//         const refId = req.params.id;

//         const userStudy: UserStudy | null = await UserStudyModel.findOne({ _id: refId});

//         if (!userStudy) {
//             return res.status(403).send('load data user study failed');
//         }

//         const users: USUser[] = await  USUserModel.find({ userStudy: userStudy._id});

//         const data: UserStudyData[] = [];
//         for (const user of users) {

//             const userData: UserStudyData | null = await UserStudyDataModel.findOne({user: user._id}).populate('demoSteps');
//             if (userData)
//                 data.push(userData);
//         }


//         res.send({
//             status: true,
//             message: 'user study updated',
//             data
//         });

//     } catch (ex) {
//         res.send(ex.message);
//     }
// });



userStudyDataRouter.get('/:id/users', auth, async (req, res) => {
    try {
        const refId = req.params.id;

        const dataPoints: any[] = await  UserStudyDataModel.find({ userStudy: refId})
        .populate('user');

        let usUSers: USUser[] = dataPoints.map(dp => dp.user as USUser);

        res.send({
            status: true,
            message: 'user study updated',
            data: usUSers
        });

    } catch (ex) {
        res.send(ex.message);
    }
});


userStudyDataRouter.get('/:id/num_accepted_users', async (req, res) => {
    try {
        const refId = req.params.id;

        const dataPoints: any[] = await  UserStudyDataModel.find({ userStudy: refId});

        const num = dataPoints.filter(dp => dp.accepted).length;

        res.send({
            status: true,
            message: 'num accepted users',
            data: num
        });

    } catch (ex) {
        res.send(ex.message);
    }
});


