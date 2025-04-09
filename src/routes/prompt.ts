import express from 'express';

import { auth, authAny } from '../middleware/auth';
import { OutputSchema, OutputSchemaBaseZ, OutputSchemaModel, Prompt, PromptBaseZ, PromptModel } from '../db_schema/prompt';

export const promptRouter = express.Router();


// LLM Prompts

promptRouter.post('/prompt', auth, async (req, res) => {
    try {
        const promptData = PromptBaseZ.parse(req.body.data);

        const prompt = new PromptModel(promptData);
        if (!prompt) {
            res.status(500).send('prompt not created');
            return;
        }
        const data = await prompt.save();

        res.send(data);
    }
    catch (ex : any) {
        console.log(ex);
        console.log(ex.message);
        console.log("--------------------------------");
        res.status(500).send();
    }
});


promptRouter.put('/prompt/:id', auth, async (req, res) => {
    try {
        const refId = req.params.id;

        const promptData = PromptBaseZ.parse(req.body.data);
        console.log(promptData);

        await PromptModel.replaceOne({ _id: refId}, promptData);

        const prompt: Prompt | null = await PromptModel.findOne({ _id: refId}).lean();

        if (!prompt) {
            res.status(403).send('update prompt failed');
            return;
        }

        res.send(prompt);

    } catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }
});


promptRouter.get('/prompt', authAny, async (req, res) => {
    try {

        const prompts = await PromptModel.find();

        if (!prompts) { 
            res.status(404).send({ message: 'No prompt found.' });
            return;
        }

        res.send(prompts);

    } catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }

});


promptRouter.get('/prompt/:id', authAny, async (req, res) => {
    try {

        const prompt = await PromptModel.findById(req.params.id);

        if (!prompt) { 
            res.status(404).send({ message: 'No prompt found.' });
            return;
        }

        res.send(prompt);

    } catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }

});

promptRouter.delete('/prompt/:id', auth, async (req, res) => {

    try{
        const result = await PromptModel.deleteOne({ _id: req.params.id});

        if (result.deletedCount == 1) { 
            res.status(404).send({ message: 'No prompt found.' });
            return;
        }

        res.send(true);

    } catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }
});

// Output Schemas

promptRouter.post('/output-schema', auth, async (req, res) => {
    try {
        const outputSchemaData = OutputSchemaBaseZ.parse(req.body.data);

        const outputSchema = new OutputSchemaModel(outputSchemaData);
        if (!outputSchema) {
            res.status(500).send('output schema not created');
            return;
        }
        const data = await outputSchema.save();

        res.send(data);
    }
    catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }
});


promptRouter.put('/output-schema/:id', auth, async (req, res) => {
    try {
        const refId = req.params.id;

        const outputSchemaData = OutputSchemaBaseZ.parse(req.body.data);

        await OutputSchemaModel.replaceOne({ _id: refId}, outputSchemaData);

        const outputSchema: OutputSchema | null = await OutputSchemaModel.findOne({ _id: refId}).lean();

        if (!outputSchema) {
            res.status(403).send('update output schema failed');
            return;
        }

        res.send(outputSchema);

    } catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }
});


promptRouter.get('/output-schema', authAny, async (req, res) => {
    try {

        const outputSchemas = await OutputSchemaModel.find();

        if (!outputSchemas) { 
            res.status(404).send({ message: 'No output schema found.' });
            return;
        }

        res.send(outputSchemas);

    } catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }

});

promptRouter.get('/output-schema/:id', authAny, async (req, res) => {
    try {

        const outputSchema = await OutputSchemaModel.findById(req.params.id);

        if (!outputSchema) { 
            res.status(404).send({ message: 'No output schema found.' });
            return;
        }

        res.send(outputSchema);

    } catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }

});

promptRouter.delete('/output-schema/:id', auth, async (req, res) => {

    try{
        const result = await OutputSchemaModel.deleteOne({ _id: req.params.id});

        if (result.deletedCount == 1) { 
            res.status(404).send({ message: 'No prompt found.' });
            return;
        }

        res.send(true);
        
    } catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }
});



