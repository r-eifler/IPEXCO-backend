import express from 'express';
import { auth } from '../middleware/auth';
import { convertToCoreMessages,CoreMessage, streamText } from 'ai';
import { openai_client } from '../llm/openai_client';
import { openai} from '@ai-sdk/openai';
import { AssistantResponse } from 'ai';
import { prepareGoalTranslatorMessage, prepareQuestionTranslatorMessage, prepareExplanationTranslatorMessage } from '../llm/route';

export const LLMRouter = express.Router();

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

LLMRouter.post('/gt', async (req, res) => {
    try {
        console.log(req.body)
        const threadId = req.body.data.threadId ?? (await openai_client.beta.threads.create({})).id;
        const input = req.body.data.input
        const message = prepareGoalTranslatorMessage(input);
        const createdMessage = await openai_client.beta.threads.messages.create(threadId, {
            role: 'user',
            content: message,
        });
        const response = AssistantResponse(
            { threadId, messageId: createdMessage.id },
            async ({ forwardStream, sendDataMessage }) => {
                // Run the assistant on the thread
                const runStream = openai_client.beta.threads.runs.stream(threadId, {
                    assistant_id:
                        process.env.ASSISTANT_ID ??
                        (() => {
                            throw new Error('ASSISTANT_ID is not set');
                        })(),
                });
            
        
              // forward run status would stream message deltas
                let runResult = await forwardStream(runStream);
            }
        );

        res.status(200).send({data: response})
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
});

LLMRouter.post('/et', async (req, res) => {
    try {
        console.log(req.body)
        const threadId = req.body.data.threadId ?? (await openai_client.beta.threads.create({})).id;
        const input = req.body.data.input
        const message = prepareExplanationTranslatorMessage(input);
        const createdMessage = await openai_client.beta.threads.messages.create(threadId, {
            role: 'user',
            content: message,
        });
        const response = AssistantResponse(
            { threadId, messageId: createdMessage.id },
            async ({ forwardStream, sendDataMessage }) => {
                // Run the assistant on the thread
                const runStream = openai_client.beta.threads.runs.stream(threadId, {
                    assistant_id:
                        process.env.ASSISTANT_ID ??
                        (() => {
                            throw new Error('ASSISTANT_ID is not set');
                        })(),
                });
            
        
              // forward run status would stream message deltas
                let runResult = await forwardStream(runStream);
            }
        );

        res.status(200).send({data: response})
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
});

LLMRouter.post('/qt', async (req, res) => {
    try {
        console.log(req.body)
        const threadId = req.body.data.threadId ?? (await openai_client.beta.threads.create({})).id;
        const input = req.body.data.input
        const message = prepareQuestionTranslatorMessage(input);
        const createdMessage = await openai_client.beta.threads.messages.create(threadId, {
            role: 'user',
            content: message,
        });
        const response = AssistantResponse(
            { threadId, messageId: createdMessage.id },
            async ({ forwardStream, sendDataMessage }) => {
                // Run the assistant on the thread
                const runStream = openai_client.beta.threads.runs.stream(threadId, {
                    assistant_id:
                        process.env.ASSISTANT_ID ??
                        (() => {
                            throw new Error('ASSISTANT_ID is not set');
                        })(),
                });
            
        
              // forward run status would stream message deltas
                let runResult = await forwardStream(runStream);
            }
        );

        res.status(200).send({data: response})
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
});
