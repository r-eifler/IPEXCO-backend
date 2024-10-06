
import express from 'express';
import { auth } from '../middleware/auth';
import { convertToCoreMessages,CoreMessage, streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export const LLMRouter = express.Router();

// const openai = new OpenAI({
//     apiKey: process.env.OPENAI_API_KEY || '',
//   });

  export const maxDuration = 30;
  const messages: CoreMessage[] = [];


  //TODO add auth
  LLMRouter.post('/test',  async (req, res) => {
    try {

        // const userMessage = req.body.data as string;
        console.log(req.body)

        messages.push({ role: 'user', content: req.body.message });

        const result = await streamText({
            model: openai('gpt-4-turbo'),
            messages,
          });

        let fullResponse = '';

        process.stdout.write('\nAssistant: ');

        for await (const delta of result.textStream) {
            fullResponse += delta;
            process.stdout.write(delta);
        }
        process.stdout.write('\n\n');

        messages.push({ role: 'assistant', content: fullResponse });

        const message = 'TEST'

        res.status(200).send({data: message})

    } catch (error) {
        console.log(error);
        res.status(400).send(error);
    }
});

LLMRouter.post('/stream',  async (req, res) => {
    try {

        // const userMessage = req.body.data as string;
        console.log(req.body)

        const messages = req.body

        const result = await streamText({
            model: openai('gpt-4-turbo'),
            messages: convertToCoreMessages(messages),
        });

        res.writeHead(200, {
            'Content-Type': "text/event-stream",
            'Cache-Control': "no-cache",
            'Connection': "keep-alive"
        });


        let fullResponse = '';
        process.stdout.write('\nAssistant: ');

        for await (const delta of result.textStream) {
            fullResponse += delta;
            process.stdout.write(delta, 'utf8', );
            res.write(`data: ${delta}`)
        }
        process.stdout.write('\n\n');
        messages.push({ role: 'assistant', content: fullResponse });

        res.end(); 
        // res.status(200).send({response: fullResponse})
        // res.send({response: fullResponse})

    } catch (error) {
        console.log(error);
        res.status(400).send(error);
    }
});



LLMRouter.post('/simple',  async (req, res) => {
    try {

        // const userMessage = req.body.data as string;
        console.log(req.body)

        const messages = req.body.data

        const result = await streamText({
            model: openai('gpt-4-turbo'),
            messages: convertToCoreMessages(messages),
        });

        let fullResponse = '';
        process.stdout.write('\nAssistant: ');

        for await (const delta of result.textStream) {
            fullResponse += delta;
            process.stdout.write(delta, 'utf8', );
        }
        process.stdout.write('\n\n');
        messages.push({ role: 'assistant', content: fullResponse });
 
        res.status(200).send({data: fullResponse})
        // res.send({response: fullResponse})

    } catch (error) {
        console.log(error);
        res.status(400).send(error);
    }
});





