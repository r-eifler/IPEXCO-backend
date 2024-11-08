import express from 'express';
import { auth } from '../middleware/auth';
// import { convertToCoreMessages, CoreMessage, streamText } from 'ai';
import { openai_client } from '../llm/openai_client';
// import { openai } from '@ai-sdk/openai';
// import { AssistantResponse } from 'ai';
import { prepareGoalTranslatorMessage, prepareQuestionTranslatorMessage, prepareExplanationTranslatorMessage } from '../llm/route';
import { processEtRequest, processGtRequest, processQtRequest } from './llm-process-requests';
import { RunStatus } from 'openai/resources/beta/threads/runs/runs';
import { Message } from 'openai/resources/beta/threads/messages';
import { PlanPropertyModel } from '../db_schema/plan-properties/plan_property';

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
        const threadId = req.body.threadId=='' ? (await openai_client.beta.threads.create({})).id : req.body.threadId;
        console.log("threadId (req.body.threadId)", threadId)
        const input = req.body.data

        const output = await processGtRequest(input, threadId);
        if (output == undefined) {
            res.status(500).send({ error: `Run status is null` });
            return;
        }
        
        const lastAssistantMessage = output.lastAssistantMessage;
        const run_status = output.run_status;

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

        const output = await processEtRequest(input, threadId);
        if (output == undefined) {
            res.status(500).send({ error: `Run status is null` });
            return;
        }
        
        const lastAssistantMessage = output.lastAssistantMessage;
        const run_status = output.run_status;

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

        const output = await processQtRequest(input, threadId);
        if (output == undefined ) {
            res.status(500).send({ error: `Run status is null ` });
            return;
        }
        
        const lastAssistantMessage = output.lastAssistantMessage;
        const run_status = output.run_status;

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

        
        
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
});

// LLMRouter.post('/translate-all', async (req, res) => {
//     // req.body.data is a dict with keys: qtRequest:string, gtRequest:string, etRequest:string, threadIdQt:string, threadIdGt:string, threadIdEt:string
//     try {
//         const input = req.body.data;
//         let qtResponse, gtResponse, etResponse, explainerResponse;

//         // Call Question Translator (qt)
//         const qtResult = await fetch(`${req.protocol}://${req.get('host')}/qt`, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ data: input.qtRequest, threadId: input.threadIdQt })
//         });
//         const qtData = await qtResult.json();
//         qtResponse = qtData.data.response;

//         const { questionType, goal } = parseQuestionTranslation(qtResponse);
//         const gt_input_from_qt = input.gtResponse.replace("{goal}", goal);

//         // Call Goal Translator (gt)
//         const gtResult = await fetch(`${req.protocol}://${req.get('host')}/gt`, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ data: gt_input_from_qt, threadId: input.threadIdGt })
//         });
//         const gtData = await gtResult.json();
//         gtResponse = gtData.data.response; // gtResponse is the LTL formula for the goal
        
//         // Call Explainer
//         const explainerResult = await fetch(`${req.protocol}://${req.get('host')}/explainer`, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ data: gtResponse, questionType: questionType }) //API to check 
//         });
//         const explainerData = await explainerResult.json();
//         explainerResponse = explainerData.data.response;

//         // Call Explanation Translator (et)
//         const etResult = await fetch(`${req.protocol}://${req.get('host')}/et`, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ data: explainerResponse, threadId: input.threadIdEt })
//         });
//         const etData = await etResult.json();
//         etResponse = etData.data.response;

//         res.status(200).send({
//             data: {
//                 questionTranslation: qtResponse,
//                 goalTranslation: gtResponse,
//                 explainerResponse: explainerResponse,
//                 explanationTranslation: etResponse,
//                 threadIdQt: input.threadIdQt,
//                 threadIdGt: input.threadIdGt,
//                 threadIdEt: input.threadIdEt
//             }
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).send(error);
//     }
// });

LLMRouter.post('/qt-then-gt', async (req, res) => {
    try {

        // req is a dict with keys: qtRequest, gtRequest, projectId, threadIdQt, threadIdGt
        console.log("req.body", req.body);
        
        // Create or use existing threads
        const threadIdQt = req.body.threadIdQt === '' ? (await openai_client.beta.threads.create({})).id : req.body.threadIdQt;
        const threadIdGt = req.body.threadIdGt === '' ? (await openai_client.beta.threads.create({})).id : req.body.threadIdGt;
        
        // Process QT request
        const qtOutput = await processQtRequest(req.body.qtRequest, threadIdQt);
        if (qtOutput == undefined) {
            res.status(500).send({ error: `QT run status is null` });
            return;
        }

        // Get QT response
        let qtResponse;
        if (qtOutput.lastAssistantMessage) {
            const content = qtOutput.lastAssistantMessage.content[0];
            if (content && 'text' in content) {
                qtResponse = content.text.value;
            } else {
                res.status(404).send({ error: 'No valid content in QT assistant message' });
                return;
            }
        }

        if (qtResponse == undefined) {
            res.status(404).send({ error: 'No QT response found' });
            return;
        }

        // Parse QT response and prepare GT input
        const { questionType, goal: untranslatedGoal, existing } = parseQuestionTranslation(qtResponse);
        const gtInput = req.body.gtRequest.replace("{goal}", untranslatedGoal);

        // Process GT request
        const gtOutput = await processGtRequest(gtInput, threadIdGt);
        if (gtOutput == undefined) {
            res.status(500).send({ error: `GT run status is null` });
            return;
        }
        let gtResponse;
        if (gtOutput.lastAssistantMessage) {
            const content = gtOutput.lastAssistantMessage.content[0];
            if (content && 'text' in content) {
                gtResponse = content.text.value;
            } else {
                res.status(404).send({ error: 'No valid content in GT assistant message' });
                return;
            }
        }
        if (gtResponse == undefined) {
            res.status(404).send({ error: 'No GT response found' });
            return;
        }
        const { formula, shortName } = parseGoalTranslation(gtResponse);

        // Get GT response
        if (gtOutput.lastAssistantMessage) {
            const content = gtOutput.lastAssistantMessage.content[0];
            if (content && 'text' in content) {
                const gtResponse = content.text.value;


                let planProperty = null;
                // CHECK IF PLAN PROPERTY ALREADY EXISTS
                if (existing == 'EXISTING') {
                    planProperty = await PlanPropertyModel.findOne({
                        name: gtResponse,
                        project: req.body.projectId
                    });
            
                }
                if (existing == 'NONEXISTING' || planProperty == null) {
                    
                    const planProperty = new PlanPropertyModel({
                        name: shortName ,
                        project: req.body.projectId,
                        type: 'LTL',
                        formula: formula,
                        naturalLanguageDescription: untranslatedGoal,
                        isUsed: true,
                        globalHardGoal: false,
                        utility: 1,
                        color: '#FFB6C1', // Light pink color
                        icon: 'chat',
                        class: 'Defined using Natural Language',
                        });
                    await planProperty.save();
                } else {
                    res.status(400).send({ error: 'Invalid existing value' });
                    return;
                }

                if (planProperty == null) {
                    // This should never happen
                    res.status(404).send({ error: 'No plan property found' });
                    return;
                }


                // CHECK IF PLAN PROPERTY IS SATISFIED OR NOT

                // IF SATISFIED, RETURN ERROR

                // IF UNSATISFIED, RETURN PLAN PROPERTY

                res.status(200).send({ 
                    data: {
                        qtResponse,
                        gtResponse,
                        threadIdQt,
                        threadIdGt,
                        questionType,
                        goal: planProperty._id
                    }
                });

            } else {
                res.status(404).send({ error: 'No valid content in GT assistant message' });
            }
        } else {
            res.status(404).send({ error: 'No GT assistant message found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
});


interface QuestionTranslation {
    questionType: string;
    goal: string;
    existing: string;
}

function parseQuestionTranslation(qtResponse: string): QuestionTranslation {
    try {
        // Assuming qtResponse is a string with format "<questionType>;<goal>;<existing>"
        const [questionType, goal, existing] = qtResponse.split(';').map(part => part.trim());
        return { questionType, goal, existing };
    } catch (error) {
        console.error('Error parsing question translation:', error);
        return {
            questionType: 'WHY_PLAN',
            goal: 'NOGOAL',
            existing: 'EXISTING'
        };
    }
}

interface GoalTranslation {
    formula: string;
    shortName: string;
}

function parseGoalTranslation(gtResponse: string): GoalTranslation {
    try {
        // Assuming gtResponse is a string with format "<goal>;<shortName>"
        const [formula, shortName] = gtResponse.split(';').map(part => part.trim());
        return { formula, shortName };
    } catch (error) {
        console.error('Error parsing goal translation:', error);
        return {
            formula: '',
            shortName: ''
        };
    }
}
    



