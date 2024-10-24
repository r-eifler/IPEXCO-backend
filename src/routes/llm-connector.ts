import express from 'express';
import { auth } from '../middleware/auth';
// import { convertToCoreMessages, CoreMessage, streamText } from 'ai';
import { openai_client } from '../llm/openai_client';
// import { openai } from '@ai-sdk/openai';
// import { AssistantResponse } from 'ai';
import { prepareGoalTranslatorMessage, prepareQuestionTranslatorMessage, prepareExplanationTranslatorMessage } from '../llm/route';

export const LLMRouter = express.Router();

export const maxDuration = 30;
// const messages: CoreMessage[] = [];


// //TODO add auth
// LLMRouter.post('/test', async (req, res) => {
//     try {

//         // const userMessage = req.body.data as string;
//         console.log(req.body)

//         messages.push({ role: 'user', content: req.body.message });

//         const result = await streamText({
//             model: openai('gpt-4-turbo'),
//             messages,
//         });

//         let fullResponse = '';

//         process.stdout.write('\nAssistant: ');

//         for await (const delta of result.textStream) {
//             fullResponse += delta;
//             process.stdout.write(delta);
//         }
//         process.stdout.write('\n\n');

//         messages.push({ role: 'assistant', content: fullResponse });

//         const message = 'TEST'

//         res.status(200).send({ data: message })

//     } catch (error) {
//         console.log(error);
//         res.status(400).send(error);
//     }
// });

// LLMRouter.post('/stream', async (req, res) => {
//     try {

//         // const userMessage = req.body.data as string;
//         console.log(req.body)

//         const messages = req.body

//         const result = await streamText({
//             model: openai('gpt-4-turbo'),
//             messages: convertToCoreMessages(messages),
//         });

//         res.writeHead(200, {
//             'Content-Type': "text/event-stream",
//             'Cache-Control': "no-cache",
//             'Connection': "keep-alive"
//         });


//         let fullResponse = '';
//         process.stdout.write('\nAssistant: ');

//         for await (const delta of result.textStream) {
//             fullResponse += delta;
//             process.stdout.write(delta, 'utf8',);
//             res.write(`data: ${delta}`)
//         }
//         process.stdout.write('\n\n');
//         messages.push({ role: 'assistant', content: fullResponse });

//         res.end();
//         // res.status(200).send({response: fullResponse})
//         // res.send({response: fullResponse})

//     } catch (error) {
//         console.log(error);
//         res.status(400).send(error);
//     }
// });



// LLMRouter.post('/simple', async (req, res) => {
//     try {

//         // const userMessage = req.body.data as string;
//         console.log(req.body)

//         const messages = req.body.data

//         const result = await streamText({
//             model: openai('gpt-4-turbo'),
//             messages: convertToCoreMessages(messages),
//         });

//         let fullResponse = '';
//         process.stdout.write('\nAssistant: ');

//         for await (const delta of result.textStream) {
//             fullResponse += delta;
//             process.stdout.write(delta, 'utf8',);
//         }
//         process.stdout.write('\n\n');
//         messages.push({ role: 'assistant', content: fullResponse });

//         res.status(200).send({ data: fullResponse })
//         // res.send({response: fullResponse})

//     } catch (error) {
//         console.log(error);
//         res.status(400).send(error);
//     }
// });

LLMRouter.post('/gt', async (req, res) => {
    try {
        console.log("req.body", req.body)
        const threadId = req.body.threadId=='' ? (await openai_client.beta.threads.create({})).id : req.body.threadId;
        console.log("threadId (req.body.threadId)", threadId)
        const input = req.body.data
        console.log("input (req.body.data)", input)
        const createdMessage = await openai_client.beta.threads.messages.create(threadId, {
            role: "user",
            content: input,
        });

        console.log("createdMessage", createdMessage)
        let run = await openai_client.beta.threads.runs.createAndPoll(
            threadId, 
            { 
              assistant_id: process.env.ASSISTANT_ID_GOALTRANSLATOR ??
                        (() => {
                            throw new Error('ASSISTANT_ID_GOALTRANSLATOR is not set');
                        })()
            }
          );
        

        if (run.status === 'completed') {
            const messages = await openai_client.beta.threads.messages.list(
              run.thread_id
            );
            for (const message of messages.data.reverse()) {
                const content = message.content[0];
                if (content && 'text' in content) {
                    console.log(`${message.role} > ${content.text.value}`);
                } else {
                    console.log(`${message.role} > [Content not available]`);
                }
            }

            // Find the last assistant message
            const lastAssistantMessage = messages.data
                .reverse()
                .find(message => message.role === 'assistant');

            if (lastAssistantMessage) {
                const content = lastAssistantMessage.content[0];
                if (content && 'text' in content) {
                    const response = content.text.value;
                    console.log(`Sent value > ${response}`);
                    res.status(200).send({ data: { "response": response, "threadId": threadId } });
                } else {
                    console.log('No valid content in assistant message');
                    res.status(404).send({ error: 'No valid content in assistant message' });
                }
            } else {
                console.log('No assistant message found');
                res.status(404).send({ error: 'No assistant message found' });
            }
          } else {
            console.log(run.status);
        }
        
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
});

LLMRouter.post('/et', async (req, res) => {
    try {
        console.log("req.body", req.body)
        const threadId = req.body.threadId=='' ? (await openai_client.beta.threads.create({})).id : req.body.threadId;
        console.log("threadId (req.body.threadId)", threadId)
        const input = req.body.data
        console.log("input (req.body.data)", input)
        const createdMessage = await openai_client.beta.threads.messages.create(threadId, {
            role: "user",
            content: input,
        });

        console.log("createdMessage", createdMessage)
        let run = await openai_client.beta.threads.runs.createAndPoll(
            threadId, 
            { 
              assistant_id: process.env.ASSISTANT_ID_EXPLANATIONTRANSLATOR ??
                        (() => {
                            throw new Error('ASSISTANT_ID_EXPLANATIONTRANSLATOR is not set');
                        })()
            }
          );
        
        if (run.status === 'completed') {
            const messages = await openai_client.beta.threads.messages.list(
              run.thread_id
            );
            for (const message of messages.data.reverse()) {
                const content = message.content[0];
                if (content && 'text' in content) {
                    console.log(`${message.role} > ${content.text.value}`);
                } else {
                    console.log(`${message.role} > [Content not available]`);
                }
            }

            const lastAssistantMessage = messages.data
                .reverse()
                .find(message => message.role === 'assistant');

            if (lastAssistantMessage) {
                const content = lastAssistantMessage.content[0];
                if (content && 'text' in content) {
                    const response = content.text.value;
                    console.log(`Sent value > ${response}`);
                    res.status(200).send({ data: { "response": response, "threadId": threadId } });
                } else {
                    console.log('No valid content in assistant message');
                    res.status(404).send({ error: 'No valid content in assistant message' });
                }
            } else {
                console.log('No assistant message found');
                res.status(404).send({ error: 'No assistant message found' });
            }
        } else {
            console.log(run.status);
            res.status(500).send({ error: `Run status: ${run.status}` });
        }
        
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
});

LLMRouter.post('/qt', async (req, res) => {
    try {
        console.log("req.body", req.body)
        const threadId = req.body.threadId=='' ? (await openai_client.beta.threads.create({})).id : req.body.threadId;
        console.log("threadId (req.body.threadId)", threadId)
        const input = req.body.data
        console.log("input (req.body.data)", input)
        const createdMessage = await openai_client.beta.threads.messages.create(threadId, {
            role: "user",
            content: input,
        });

        console.log("createdMessage", createdMessage)
        let run = await openai_client.beta.threads.runs.createAndPoll(
            threadId, 
            { 
              assistant_id: process.env.ASSISTANT_ID_QUESTIONTRANSLATOR ??
                        (() => {
                            throw new Error('ASSISTANT_ID_QUESTIONTRANSLATOR is not set');
                        })()
            }
          );
        
        if (run.status === 'completed') {
            const messages = await openai_client.beta.threads.messages.list(
              run.thread_id
            );
            for (const message of messages.data.reverse()) {
                const content = message.content[0];
                if (content && 'text' in content) {
                    console.log(`${message.role} > ${content.text.value}`);
                } else {
                    console.log(`${message.role} > [Content not available]`);
                }
            }

            const lastAssistantMessage = messages.data
                .reverse()
                .find(message => message.role === 'assistant');

            if (lastAssistantMessage) {
                const content = lastAssistantMessage.content[0];
                if (content && 'text' in content) {
                    const response = content.text.value;
                    console.log(`Sent value > ${response}`);
                    res.status(200).send({ data: { "response": response, "threadId": threadId } });
                } else {
                    console.log('No valid content in assistant message');
                    res.status(404).send({ error: 'No valid content in assistant message' });
                }
            } else {
                console.log('No assistant message found');
                res.status(404).send({ error: 'No assistant message found' });
            }
        } else {
            console.log(run.status);
            res.status(500).send({ error: `Run status: ${run.status}` });
        }
        
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
});

LLMRouter.post('/translate-all', async (req, res) => {
    // req.body.data is a dict with keys: qtRequest:string, gtRequest:string, etRequest:string, threadIdQt:string, threadIdGt:string, threadIdEt:string
    try {
        const input = req.body.data;
        let qtResponse, gtResponse, etResponse, explainerResponse;

        // Call Question Translator (qt)
        const qtResult = await fetch(`${req.protocol}://${req.get('host')}/qt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: input.qtRequest, threadId: input.threadIdQt })
        });
        const qtData = await qtResult.json();
        qtResponse = qtData.data.response;

        const { questionType, goal } = parseQuestionTranslation(qtResponse);
        const gt_input_from_qt = input.gtResponse.replace("{goal}", goal);

        // Call Goal Translator (gt)
        const gtResult = await fetch(`${req.protocol}://${req.get('host')}/gt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: gt_input_from_qt, threadId: input.threadIdGt })
        });
        const gtData = await gtResult.json();
        gtResponse = gtData.data.response; // gtResponse is the LTL formula for the goal
        
        // Call Explainer
        const explainerResult = await fetch(`${req.protocol}://${req.get('host')}/explainer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: gtResponse, questionType: questionType }) //API to check 
        });
        const explainerData = await explainerResult.json();
        explainerResponse = explainerData.data.response;

        // Call Explanation Translator (et)
        const etResult = await fetch(`${req.protocol}://${req.get('host')}/et`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: explainerResponse, threadId: input.threadIdEt })
        });
        const etData = await etResult.json();
        etResponse = etData.data.response;

        res.status(200).send({
            data: {
                questionTranslation: qtResponse,
                goalTranslation: gtResponse,
                explainerResponse: explainerResponse,
                explanationTranslation: etResponse,
                threadIdQt: input.threadIdQt,
                threadIdGt: input.threadIdGt,
                threadIdEt: input.threadIdEt
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
});

interface QuestionTranslation {
    questionType: string;
    goal: string;
}

function parseQuestionTranslation(qtResponse: string): QuestionTranslation {
    try {
        // Assuming qtResponse is a string with format "<questionType>;<goal>"
        const [questionType, goal] = qtResponse.split(';');
        return { questionType, goal };
    } catch (error) {
        console.error('Error parsing question translation:', error);
        return {
            questionType: '',
            goal: ''
        };
    }
}



