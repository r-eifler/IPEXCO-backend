import { authAny, AuthenticatedRequest, authForward} from './../middleware/auth';
import express from 'express';
import { User, UserData, UserModel } from '../db_schema/user';
import { auth } from '../middleware/auth';
import { Response } from 'express';
import { UserStudy, UserStudyModel } from '../db_schema/user-study/user-study';
import { UserStudyExecutionModel } from '../db_schema/user-study/user-study-execution';
import { environment } from '../app';

export const userRouter = express.Router();


userRouter.post('/user-study', async (req, res) => {
    try {
        if(!environment.allowUserStudyUsers){
            console.log('No user study users possible.');
            return res.status(403).send('No user study users possible.');
        }

        const userStudyId = req.body.userStudyId;
        if(userStudyId === null || userStudyId === undefined){
            console.log('No user study specified!')
            return res.status(400).send('No user study specified!');
        }

        const userStudy: UserStudy | null = await UserStudyModel.findById(userStudyId);

        if(userStudy === null || userStudy?.startDate === undefined || userStudy?.endDate === undefined){
            console.log('User Study not available anymore!')
            return res.status(400).send('User Study not available anymore!');
        }

        const now = new Date();
        const start  = new Date(userStudy?.startDate);
        const end = new Date(userStudy.endDate); 
        if (now < start || now > end){
            console.log('User Study not available anymore!')
            return res.status(400).send('User Study not available anymore!');
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
            timeLog: [],
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
        if(!environment.allowRegistration){
            return res.status(403).send('No registration possible.');
        }
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

userRouter.post('/login', authForward, async(req: AuthenticatedRequest, res: Response) => {
    try {
        if (req.user) {
            if(req.user.role == 'user-study'){
                return res.status(401).send({ error: 'Login failed! User study users cannot login'});
            }
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


userRouter.get('', authAny, async(req: AuthenticatedRequest, res) => {
    try {
        if(!req.user){
            return res.status(400).send();
        }
        let user = req.user;
        const userData: UserData = {
            _id: user._id,
            name: user.name,
            role: user.role,
        }
        res.send({ data: userData });
    } catch (error) {
        console.log(error);
        res.status(500).send(false);
    }
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

