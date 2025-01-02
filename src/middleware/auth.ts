import { UserModel, User } from './../db_schema/user';
import * as jwt from 'jsonwebtoken';
import { Response, Request, NextFunction } from 'express';
import { environment } from '../app';


export interface AuthenticatedRequest extends Request{
    user?: User,
    token?: string
}

export const authAny = async(req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (! req.header('Authorization')) {
        console.log("Not authorized to access this resource")
        res.status(401).send({ error: 'Not authorized to access this resource' });
        return;
    }

    const token: string | undefined = req.header('Authorization')?.replace('Bearer ', '');
    if (token === undefined) {
        res.status(401).send({ error: 'Not authorized to access this resource' });
        return;
    }
    const data: User = jwt.verify(token, environment.jwtKey) as User;
    try {
        const user = await UserModel.findOne({ _id: data._id, 'tokens.token': token });
        if (!user) {
            return res.status(401).send({ error: 'Not authorized to access this resource' });
        }
        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        res.status(401).send({ error: 'Not authorized to access this resource' });
    }

};


export const auth = async(req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (! req.header('Authorization')) {
        console.log("Not authorized to access this resource")
        res.status(401).send({ error: 'Not authorized to access this resource' });
        return;
    }

    const token: string | undefined = req.header('Authorization')?.replace('Bearer ', '');
    if (token === undefined) {
        res.status(401).send({ error: 'Not authorized to access this resource' });
        return;
    }
    const data: User = jwt.verify(token, environment.jwtKey) as User;
    try {
        const user = await UserModel.findOne({ _id: data._id, 'tokens.token': token });
        if (!user) {
            return res.status(401).send({ error: 'Not authorized to access this resource' });
        }
        if (user.role != 'admin' && user.role != 'creator') {
            return res.status(401).send({ error: 'Not authorized to access this resource' });
        }
        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        res.status(401).send({ error: 'Not authorized to access this resource' });
    }

};


export const authAdmin = async(req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (! req.header('Authorization')) {
        console.log("Not authorized to access this resource")
        res.status(401).send({ error: 'Not authorized to access this resource' });
        return;
    }

    const token: string | undefined = req.header('Authorization')?.replace('Bearer ', '');
    if (token === undefined) {
        res.status(401).send({ error: 'Not authorized to access this resource' });
        return;
    }
    const data: User = jwt.verify(token, environment.jwtKey) as User;
    try {
        const user = await UserModel.findOne({ _id: data._id, 'tokens.token': token });
        if (!user) {
            return res.status(401).send({ error: 'Not authorized to access this resource' });
        }
        if (user.role != 'admin') {
            return res.status(401).send({ error: 'Not authorized to access this resource' });
        }
        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        res.status(401).send({ error: 'Not authorized to access this resource' });
    }

};


export const authForward = async(req: any, res: Response, next: NextFunction) => {
    if (! req.header('Authorization')) {
        next();
        return;
    }

    const token: string | undefined = req.header('Authorization')?.replace('Bearer ', '');
    if (token === undefined) {
        res.status(401).send({ error: 'Not authorized to access this resource' });
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
            console.log("Not authorized to access this resource")
            res.status(401).send({ error: 'Not authorized to access this resource' });
            return;
        }

        const token: string | undefined = req.header('Authorization')?.replace('Bearer ', '');
        if (token === undefined) {
            res.status(401).send({ error: 'Not authorized to access this resource' });
            return;
        }
        
        if(token != environment.plannerKey){
            return res.status(401).send({ error: 'Not authorized to access this resource' });
        }

        next();

    } catch (error) {
        res.status(401).send({ error: 'Not authorized to access this resource' });
    }

};


export const authExplainer = async(req: Request, res: Response, next: NextFunction) => {

    try {
        if (! req.header('Authorization')) {
            console.log("Not authorized to access this resource")
            res.status(401).send({ error: 'Not authorized to access this resource' });
            return;
        }

        const token: string | undefined = req.header('Authorization')?.replace('Bearer ', '');
        if (token === undefined) {
            res.status(401).send({ error: 'Not authorized to access this resource' });
            return;
        }
        
        if(token != environment.explainerKey){
            return res.status(401).send({ error: 'Not authorized to access this resource' });
        }

        next();

    } catch (error) {
        res.status(401).send({ error: 'Not authorized to access this resource' });
    }

};