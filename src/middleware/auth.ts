import { UserModel, User } from './../db_schema/user';
import * as jwt from 'jsonwebtoken';
import { Response, Request, NextFunction } from 'express';
import { environment } from '../app';

const errorMessage = 'Not authorized to access this resource';

export interface AuthenticatedRequest extends Request{
    user?: User,
    token?: string
}

export const authAny = async(req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (! req.header('Authorization')) {
        console.log(errorMessage)
        res.status(401).send({ error: errorMessage });
        return;
    }

    const token: string | undefined = req.header('Authorization')?.replace('Bearer ', '');
    if (token === undefined) {
        res.status(401).send({ error: errorMessage });
        return;
    }
    const data: User = jwt.verify(token, environment.jwtKey) as User;
    try {
        const user = await UserModel.findOne({ _id: data._id, 'tokens.token': token });
        if (!user) {
            return res.status(401).send({ error: errorMessage });
        }
        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        res.status(401).send({ error: errorMessage });
    }

};


export const auth = async(req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (! req.header('Authorization')) {
        console.log(errorMessage)
        res.status(401).send({ error: errorMessage });
        return;
    }

    const token: string | undefined = req.header('Authorization')?.replace('Bearer ', '');
    if (token === undefined) {
        res.status(401).send({ error: errorMessage });
        return;
    }
    const data: User = jwt.verify(token, environment.jwtKey) as User;
    try {
        const user = await UserModel.findOne({ _id: data._id, 'tokens.token': token });
        if (!user) {
            return res.status(401).send({ error: errorMessage });
        }
        if (user.role != 'admin' && user.role != 'creator') {
            return res.status(401).send({ error: errorMessage });
        }
        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        res.status(401).send({ error: errorMessage });
    }

};


export const authAdmin = async(req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (! req.header('Authorization')) {
        console.log(errorMessage)
        res.status(401).send({ error: errorMessage });
        return;
    }

    const token: string | undefined = req.header('Authorization')?.replace('Bearer ', '');
    if (token === undefined) {
        res.status(401).send({ error: errorMessage });
        return;
    }
    const data: User = jwt.verify(token, environment.jwtKey) as User;
    try {
        const user = await UserModel.findOne({ _id: data._id, 'tokens.token': token });
        if (!user) {
            return res.status(401).send({ error: errorMessage });
        }
        if (user.role != 'admin') {
            return res.status(401).send({ error: errorMessage });
        }
        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        res.status(401).send({ error: errorMessage });
    }

};


export const authForward = async(req: any, res: Response, next: NextFunction) => {
    if (! req.header('Authorization')) {
        next();
        return;
    }

    const token: string | undefined = req.header('Authorization')?.replace('Bearer ', '');
    if (token === undefined) {
        res.status(401).send({ error: errorMessage });
        return;
    }
    const data: User = jwt.verify(token, environment.jwtKey) as User;
    try {
        const user = await UserModel.findOne({ _id: data._id, 'tokens.token': token });
        if (!user) {
            next();
            return;
        }
        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        next();
    }

};


export const authPlanner = async(req: Request, res: Response, next: NextFunction) => {

    try {
        if (! req.header('Authorization')) {
            console.log(errorMessage)
            res.status(401).send({ error: errorMessage });
            return;
        }

        const token: string | undefined = req.header('Authorization')?.replace('Bearer ', '');
        if (token === undefined) {
            res.status(401).send({ error: errorMessage });
            return;
        }
        
        if(token != environment.plannerKey){
            return res.status(401).send({ error: errorMessage });
        }

        next();

    } catch (error) {
        res.status(401).send({ error: errorMessage });
    }

};


export const authExplainer = async(req: Request, res: Response, next: NextFunction) => {

    try {
        if (! req.header('Authorization')) {
            console.log(errorMessage)
            res.status(401).send({ error: errorMessage });
            return;
        }

        const token: string | undefined = req.header('Authorization')?.replace('Bearer ', '');
        if (token === undefined) {
            res.status(401).send({ error: errorMessage });
            return;
        }
        
        if(token != environment.explainerKey){
            return res.status(401).send({ error: errorMessage });
        }

        next();

    } catch (error) {
        res.status(401).send({ error: errorMessage });
    }

};