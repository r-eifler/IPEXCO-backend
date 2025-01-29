import express from 'express';

import { auth, authAny } from '../middleware/auth';
import { Prompt, PromptModel } from '../db_schema/prompt';

export const promptRouter = express.Router();


promptRouter.post('', auth, async (req, res) => {
    try {
        const promptData = req.body.data as Prompt;

        const prompt = new PromptModel(promptData);
        if (!prompt) {
            return res.status(500).send('prompt not created');
        }
        const data = await prompt.save();

        res.send({
            status: true,
            message: 'prompt saved',
            data
        });
    }
    catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }
});


promptRouter.put('/:id', auth, async (req, res) => {
    try {
        const refId = req.params.id;

        const promptData = req.body.data as Prompt;

        await PromptModel.replaceOne({ _id: refId}, promptData);

        const prompt: Prompt | null = await PromptModel.findOne({ _id: refId}).lean();

        if (!prompt) {
            return res.status(403).send('update prompt failed');
        }

        res.send({
            status: true,
            message: 'prompt updated',
            data: prompt
        });

    } catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }
});


promptRouter.get('', authAny, async (req, res) => {
    try {

        const prompt = await PromptModel.find();

        if (!prompt) { 
            return res.status(404).send({ message: 'No prompt found.' });
        }

        res.send({
            data: prompt
        });
    } catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }

});

promptRouter.delete('/:id', auth, async (req, res) => {

    try{
        const result = await PromptModel.deleteOne({ _id: req.params.id});

        if (!result) { 
            return res.status(404).send({ message: 'No prompt found.' });
        }

        res.send({
            data: result
        });
    } catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }
});



