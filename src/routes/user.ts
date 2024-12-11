import { authForward} from './../middleware/auth';
import express from 'express';
import { User, UserData, UserModel } from '../db_schema/user';
import { auth } from '../middleware/auth';
import { Response } from 'express';
import { UserStudy, UserStudyModel } from '../db_schema/user-study/user-study';
import { UserStudyExecution, UserStudyExecutionModel } from '../db_schema/user-study/user-study-execution';
import { finished } from 'stream';

export const userRouter = express.Router();


userRouter.post('/user-study', async (req, res) => {
    try {

        const userStudyId = req.body.userStudyId;
        if(userStudyId === null || userStudyId === undefined){
            return res.status(400).send();
        }

        const userStudy: UserStudy | null = await UserStudyModel.findById(userStudyId);

        if(userStudy === null || userStudy?.startDate === undefined || userStudy?.endDate === undefined){
            return res.status(400).send();
        }

        const now = new Date();
        const start  = new Date(userStudy?.startDate);
        const end = new Date(userStudy.endDate); 
        if (now < start || now > end){
            return res.status(400).send();
        }

        console.log('User study valid and running.');

        const newUser = {
            name: 'participant',
            role: 'user-study',
            password: '1234567',
        }
        const user: User = new UserModel(newUser);
        await user.save();

        const stringId =  user._id.toString();
        user.name = user.name + '-' + stringId.substr(stringId.length - 8);
        await user.save();

        const token = await user.generateAuthToken();

        const userData: UserData = {
            _id: user._id,
            name: user.name,
            role: user.role,
        }

        const userStudyExecutionData = {
            user: user._id,
            userStudy: userStudy._id,
            finished: false,
            accepted: false,
            timeLog: '{}',
            payment: 0,
        }
        const userStudyExecution = new UserStudyExecutionModel(userStudyExecutionData);
        userStudyExecution.save();

        res.status(201).send({data: { 
            user: userData, 
            token: token,
        }});
    } catch (error) {
        console.log(error);
        res.status(500).send();
    }
});

userRouter.post('/', async (req, res) => {
    try {
        const userExists = await UserModel.findOne({ name: req.body.name});
        if (userExists) {
            res.status(400).send('User name already exists.');
            return;
        }

        const user = new UserModel(req.body);
        user.role = 'creator'
        await user.save();

        const token = await user.generateAuthToken();

        const userData: UserData = {
            _id: user._id,
            name: user.name,
            role: user.role,
        }

        res.status(201).send({data: { 
            user: userData, 
            token: token,
        }});
    } catch (error) {
        console.log(error);
        res.status(400).send(error);
    }
});

userRouter.post('/login', authForward, async(req: any, res: Response) => {
    try {
        if (req.user) {
            res.send({ user: req.user, token: req.token });
        }
        const username = req.body.name;
        const password = req.body.password;
        if(username == null || password == null){
            return res.status(401).send({ error: 'Login failed! Check authentication credentials'});
        }

        const user = await (UserModel as any).findByCredentials(username, password);
        if (!user) {
            return res.send({data: {
                user: null,
                token: null
            }})
            // return res.status(401).send({ error: 'Login failed! Check authentication credentials'});
        }

        const token = await user.generateAuthToken();

        const userData: UserData = {
            _id: user._id,
            name: user.name,
            role: user.role,
        }

        res.send({data: {
            user: userData,
            token
         }});
    } catch (error) {
        console.log(error);
        res.status(400).send();
    }

});


userRouter.get('', auth, async(req: any, res) => {
    let user = req.user;
    const userData: UserData = {
        _id: user._id,
        name: user.name,
        role: user.role,
    }
    res.send({ data: userData });
});

userRouter.post('/logout', authForward, async (req: any, res) => {
    try {
        if (req.user) {
            req.user.tokens = req.user.tokens.filter((token: {token: string}) => {
                return token.token !== req.token;
            });
            await req.user.save();
        }

        res.send(true);
    } catch (error) {
        console.log(error);
        res.status(500).send(false);
    }
});

userRouter.post('/user-study', async (req, res) => {
    try {

        const user = req.body as User;

        const user_name_exists= await UserModel.findOne({ name: user.name});
        if (user_name_exists) {
            res.status(400).send('User name already exists.');
            return;
        }

        if (user.password != null) {
            res.status(400).send('User study users must not have a password.');
            return;
        }

        const userModel = new UserModel(req.body);
        userModel.role = 'user-study'
        await userModel.save();

        const token = await userModel.generateAuthToken();

        res.status(201).send({ user: { name: userModel.name}, token });
    } catch (error) {
        console.log(error);
        res.status(400).send(error);
    }
});
