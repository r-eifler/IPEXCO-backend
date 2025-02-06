
import express from 'express';
import { environment } from '../app';
import { auth } from '../middleware/auth';
import { PDDLParser } from '../services/pddl/pddl_parser';

export const pddlRouter = express.Router();


pddlRouter.post('/model', auth,  async (req, res) => {
    try {
        let problemText = req.body.data.problem
        let domainText = req.body.data.domain
       

        const parser = new PDDLParser(environment.experimentsRootPath, Date.now().toString(), domainText, problemText)
        const modelLines = await parser.executeRun()

        const modelString: string = modelLines.reduce((m,l) => m + '\n' + l, '')
        const modelJSON = JSON.parse(modelString);

        //TODO metrics

        res.status(200).send({data: modelJSON})

    } catch (error) {
        console.log(error);
        res.status(500).send();
    }
});
