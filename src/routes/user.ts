import { authForward} from './../middleware/auth';
import express from 'express';
import { User, UserData, UserModel } from '../db_schema/user';
import { auth } from '../middleware/auth';
import { Response } from 'express';

export const userRouter = express.Router();

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
