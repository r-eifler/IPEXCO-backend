import { error } from 'console';
import express from 'express';
import { IterationStepModel } from '../../db_schema/iteration_step';
import { LLMContext, LLMContextModel } from '../../db_schema/llm-context';
import { UserModel } from '../../db_schema/user';
import { UserStudyExecution, UserStudyExecutionModel } from '../../db_schema/user-study/user-study-execution';
import { auth, authAny, AuthenticatedRequest } from '../../middleware/auth';

export const userStudyExecutionRouter = express.Router();

userStudyExecutionRouter.put('/finish', authAny, async (req: AuthenticatedRequest, res) => {
    try {
        if (!req.user) {
            res.status(401).send();
            return;
        }

        const userStudyUser = req.user;

        const executionData: UserStudyExecution | null = await UserStudyExecutionModel.findOne({ user: userStudyUser._id })

        if (!executionData) {
            res.status(403).send();
            return;
        }

        executionData.finished = true;
        executionData.finishedAt = new Date();
        await executionData.save();

        res.send(true);

    } catch (ex: any) {
        console.log(error);
        res.status(500).send();
    }
});

userStudyExecutionRouter.put('/accept/:id', auth, async (req, res) => {
    try {

        const userId = req.params.id;

        const executionData: UserStudyExecution | null = await UserStudyExecutionModel.findOne({ user: userId })

        if (!executionData) {
            res.status(403).send();
            return;
        }

        executionData.accepted = true;
        await executionData.save();

        res.send(true);

    } catch (ex: any) {
        console.log(error);
        res.status(500).send();
    }
});

userStudyExecutionRouter.put('/action', authAny, async (req: AuthenticatedRequest, res) => {
    try {

        if (!req.user) {
            res.status(401).send();
            return;
        }

        const userStudyUser = req.user;

        const executionData: UserStudyExecution | null = await UserStudyExecutionModel.findOne({ user: userStudyUser._id })

        if (!executionData) {
            res.status(403).send();
            return;
        }

        const action = req.body.action;
        executionData.timeLog?.push(action);
        await executionData.save();

        res.send(true);

    } catch (ex: any) {
        console.log(error);
        res.status(500).send();
    }
});

userStudyExecutionRouter.put('/save-llm-context', authAny, async (req: AuthenticatedRequest, res) => {
    try {

        if (!req.user) {
            res.status(401).send();
            return;
        }

        const userStudyUser = req.user;

        const llmContexts: LLMContext[] = await LLMContextModel.find({ user: userStudyUser._id })
        

        if (llmContexts.length === 0) {
            res.status(404).send("No LLM contexts found for this user");
            return;
        }

        for (const llmContext of llmContexts) {
            let projectId = llmContext.project;
            const executionData: UserStudyExecution | null = await UserStudyExecutionModel.findOne({ user: userStudyUser._id })

            if (!executionData) {
                res.status(403).send("Execution data not found");
                return;
            }
            const action = {
                type: "LLM_CONTEXT",
                timeStamp: new Date(),
                data: llmContext
            };

            executionData.timeLog?.push(action);
            await executionData.save();
        }

            res.send(true);

        } catch (ex: any) {
            console.log(error);
            res.status(500).send();
        }
    });


userStudyExecutionRouter.put('/cancel', authAny, async (req: AuthenticatedRequest, res) => {
    try {
        if (!req.user) {
            res.status(401).send();
            return;
        }

        const userStudyUser = req.user;

        await UserStudyExecutionModel.deleteMany({ user: userStudyUser._id });
        await IterationStepModel.deleteMany({ user: userStudyUser._id });
        await UserModel.deleteOne({ _id: userStudyUser._id });


        res.send(true);

    } catch (ex: any) {
        console.log(error);
        res.status(500).send();
    }
});



userStudyExecutionRouter.get('/', auth, async (req: any, res) => {
    try {

        const refIdUserStudy: string = req.query.userStudyId as string;
        console.log("Study ID: " + refIdUserStudy);
        const allExecutions: UserStudyExecution[] = await UserStudyExecutionModel.find({ userStudy: refIdUserStudy });

        if (!allExecutions) {
            res.status(404).send({ message: 'Lookup user study data failed.' });
            return;
        }

        res.send({
            data: allExecutions
        });
    } catch (ex: any) {
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



// userStudyExecutionRouter.get('/:id/users', auth, async (req, res) => {
//     try {
//         const refId = req.params.id;

//         const dataPoints: any[] = await  UserStudyExecutionModel.find({ userStudy: refId})
//         .populate('user');

//         let usUSers: User[] = dataPoints.map(dp => dp.user as User);

//         res.send({
//             status: true,
//             message: 'user study updated',
//             data: usUSers
//         });

//     } catch (ex : any) {
//         res.send(ex.message);
//     }
// });


// userStudyExecutionRouter.get('/:id/num_accepted_users', async (req, res) => {
//     try {
//         const refId = req.params.id;

//         const dataPoints: any[] = await  UserStudyExecutionModel.find({ userStudy: refId});

//         const num = dataPoints.filter(dp => dp.accepted).length;

//         res.send({
//             status: true,
//             message: 'num accepted users',
//             data: num
//         });

//     } catch (ex : any) {
//         res.send(ex.message);
//     }
// });


