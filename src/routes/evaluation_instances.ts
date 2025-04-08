import express from 'express';

import { EvaluationInstanceBaseZ, EvaluationInstanceModel } from '../db_schema/evaluation_instances';
import { auth, authAny, AuthenticatedRequest } from '../middleware/auth';
import { environment } from '../app';


export const evalRouter = express.Router();

evalRouter.get('/', async (req: any, res) => {

    try{
        const plans = await EvaluationInstanceModel.find()

        if (!plans) { 
            res.status(404).send({ message: 'ERROR: No plans found.' });
            return;
        }

        res.send(plans);
    }
    catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }

});

evalRouter.get('/:id', authAny, async (req, res) => {
    try{
        const id =  req.params.id;
        const run = await EvaluationInstanceModel.findOne({ _id: id});

        if (!run) { 
            res.status(404).send({ message: 'No plan step found.' });
            return;
        }

        res.send({
            data: run
        });
    }
    catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }
});

evalRouter.post('', authAny, async (req: AuthenticatedRequest, res) => {

    if(!environment.allowEvaluationUploads){
        console.log('No user study users possible.');
        res.status(403).send('No user study users possible.');
        return;
    }

    try {
        if (!req.user) {
            res.status(401).send('Create plan failed.');
            return;
        }
        console.log("create plan");
        let planBase = EvaluationInstanceBaseZ.parse(req.body);
        let planData = {
            ...planBase,
        }

        const plan = new EvaluationInstanceModel(planData);
       
        await plan.save();

        res.send(plan);
    }
    catch (ex) {
        console.log(ex);
        res.status(500);
    }

});


evalRouter.delete('/:id', auth, async (req, res) => {

    if(!environment.allowEvaluationUploads){
        console.log('No user study users possible.');
        res.status(403).send('No user study users possible.');
        return;
    }

    try {
        const result = await EvaluationInstanceModel.deleteOne({ _id: req.params.id });

        if (!result) {
            res.status(404).send({ message: 'No plan found.' });
            return;
        }
    
        res.send(true);
    } catch (ex) {
        res.status(500);
    }

});


