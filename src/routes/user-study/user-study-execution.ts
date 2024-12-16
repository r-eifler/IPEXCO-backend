import express from 'express';
import { auth } from '../../middleware/auth';
import {UserStudyExecution, UserStudyExecutionModel} from '../../db_schema/user-study/user-study-execution';
import { User, UserModel } from '../../db_schema/user';
import { error } from 'console';
import { IterationStepModel } from '../../db_schema/iteration_step';

export const userStudyExecutionRouter = express.Router();

userStudyExecutionRouter.put('/finish', auth, async (req, res) => {
    try {
        const userStudyUser = (req as any).user;

        const executionData: UserStudyExecution | null = await UserStudyExecutionModel.findOne({ user: userStudyUser._id})
            
        if (!executionData) {
            return res.status(403).send();
        }

        executionData.finished = true;
        await executionData.save();

        res.send(true);

    } catch (ex : any) {
        console.log(error);
        res.status(500).send();
    }
});

userStudyExecutionRouter.put('/accept/:id', auth, async (req, res) => {
    try {

        const userId = req.params.id;

        const executionData: UserStudyExecution | null = await UserStudyExecutionModel.findOne({ user: userId})
            
        if (!executionData) {
            return res.status(403).send();
        }

        executionData.accepted = true;
        await executionData.save();

        res.send(true);

    } catch (ex : any) {
        console.log(error);
        res.status(500).send();
    }
});

userStudyExecutionRouter.put('/action', auth, async (req, res) => {
    try {

        console.log('new action ' + req.body.action);
        const userStudyUser = (req as any).user;

        const executionData: UserStudyExecution | null = await UserStudyExecutionModel.findOne({ user: userStudyUser._id})
            
        if (!executionData) {
            return res.status(403).send();
        }

        const action= req.body.action;
        executionData.timeLog?.push(action);
        await executionData.save();

        res.send(true);

    } catch (ex : any) {
        console.log(error);
        res.status(500).send();
    }
});


userStudyExecutionRouter.put('/cancel', auth, async (req, res) => {
    try {
        const userStudyUser = (req as any).user;

        await UserStudyExecutionModel.deleteMany({ user: userStudyUser._id});
        await IterationStepModel.deleteMany({user: userStudyUser._id});
        await UserModel.deleteOne({_id: userStudyUser._id});


        res.send(true);

    } catch (ex : any) {
        console.log(error);
        res.status(500).send();
    }
});



userStudyExecutionRouter.get('/', auth, async (req: any, res) => {
    try {

        const refIdUserStudy : string = req.query.userStudyId as string;
        console.log("Study ID: " + refIdUserStudy);
        const allExecutions: UserStudyExecution[] = await UserStudyExecutionModel.find({userStudy: refIdUserStudy});

        if (!allExecutions) { 
            return res.status(404).send({ message: 'Lookup user study data failed.' });
        }

        res.send({
            data: allExecutions
        });
    } catch (ex : any) {
        console.log(ex)
        res.status(500).send();
    }

});


userStudyExecutionRouter.delete('/:id', auth, async (req, res) => {

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



userStudyExecutionRouter.get('/:id/users', auth, async (req, res) => {
    try {
        const refId = req.params.id;

        const dataPoints: any[] = await  UserStudyExecutionModel.find({ userStudy: refId})
        .populate('user');

        let usUSers: User[] = dataPoints.map(dp => dp.user as User);

        res.send({
            status: true,
            message: 'user study updated',
            data: usUSers
        });

    } catch (ex : any) {
        res.send(ex.message);
    }
});


userStudyExecutionRouter.get('/:id/num_accepted_users', async (req, res) => {
    try {
        const refId = req.params.id;

        const dataPoints: any[] = await  UserStudyExecutionModel.find({ userStudy: refId});

        const num = dataPoints.filter(dp => dp.accepted).length;

        res.send({
            status: true,
            message: 'num accepted users',
            data: num
        });

    } catch (ex : any) {
        res.send(ex.message);
    }
});


