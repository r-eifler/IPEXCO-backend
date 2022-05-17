import { UserStudyModel, UserStudy } from '../../db_schema/user-study/user-study';
import express from 'express';
import mongoose from 'mongoose';
import { auth, authForward, authUserStudy } from '../../middleware/auth';
import { USUser, USUserModel } from '../../db_schema/user-study/user-study-user';
import {UserStudyData, UserStudyDataModel} from '../../db_schema/user-study/user-study-store';
import { DepExplanationRun, PlanRun } from '../../db_schema/iteration_step';

export const userStudyRouter = express.Router();


userStudyRouter.post('/', auth, async (req: any, res) => {
    try {
        console.log(req.body.data);
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
        console.log(ex.message);
        res.send(ex.message);
    }
});


userStudyRouter.put('/:id', auth, async (req, res) => {
    try {
        const refId = req.params.id;
        const userStudyData = req.body.data as UserStudy;
        console.log(userStudyData);
        await UserStudyModel.replaceOne({ _id: req.params.id}, userStudyData);

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
        const allStudies: UserStudy[] = await UserStudyModel.find();

        console.log("#allStudies: " + allStudies.length);
        const studies = allStudies.filter(
            s => s.available || (req.user && s.user.toString() == req.user._id.toString())
        );

        console.log("#studies: " + studies.length);
        if (!studies) { 
            return res.status(404).send({ message: 'Lookup user studies failed.' });
        }

        res.send({
            data: studies
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
