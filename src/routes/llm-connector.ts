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
import { Question, QuestionType } from '../db_schema/explanations';
import { showFullContextThread } from './llm-process-requests';
import { LLMContext, LLMContextModel } from '../db_schema/LLM/llm-context';
import { threadId } from 'worker_threads';

export const LLMRouter = express.Router();

export const maxDuration = 30;

LLMRouter.post('/gt', async (req, res) => {
    try {

        // check if LLMContextModel exists
        let llmContext = await LLMContextModel.findOne({ project: req.body.projectId, assistantIdGT: process.env.ASSISTANT_ID_GOALTRANSLATOR, assistantIdQT: process.env.ASSISTANT_ID_QUESTIONTRANSLATOR, assistantIdET: process.env.ASSISTANT_ID_EXPLANATIONTRANSLATOR });
        if (!llmContext) {
            console.log("No LLMContext found, creating new one")
            const threadIdGT = (await openai_client.beta.threads.create({})).id
            const threadIdQT = (await openai_client.beta.threads.create({})).id
            const threadIdET = (await openai_client.beta.threads.create({})).id
            const llmContextData = {
                project: req.body.projectId,
                assistantIdGT: process.env.ASSISTANT_ID_GOALTRANSLATOR,
                assistantIdQT: process.env.ASSISTANT_ID_QUESTIONTRANSLATOR,
                assistantIdET: process.env.ASSISTANT_ID_EXPLANATIONTRANSLATOR,
                threadIdGT: threadIdGT,
                threadIdQT: threadIdQT,
                threadIdET: threadIdET,
                visibleMessages: [],
                visiblePPCreationMessages: [{ role: 'receiver', content: req.body.originalRequest, iterationStepId: null }],
                seenByGTMessages: [{ role: 'receiver', content: req.body.data }],
                seenByETMessages: [],
                seenByQTMessages: [],
            }
            llmContext = new LLMContextModel(llmContextData);
            await llmContext.save();
            console.log("New LLMContext created and saved")
        } else {
            console.log("LLMContext found, updating it")
            llmContext.visiblePPCreationMessages.push({ role: 'receiver', content: req.body.originalRequest, iterationStepId: req.body.iterationStepId });
            llmContext.seenByGTMessages.push({ role: 'receiver', content: req.body.data });
            await llmContext.save();
            console.log("LLMContext updated and saved")
            // Check if threadID still xists
            // const myThread = await openai_client.beta.threads.retrieve(llmContext.threadIdGT);
        }

        if (llmContext.threadIdGT == null) {
            res.status(404).send({ error: 'No threadIdGT found' });
            return;
        }

        const input = req.body.data

        const output = await processGtRequest(input, llmContext.threadIdGT);
        if (output == undefined) {
            res.status(500).send({ error: `Run status is null` });
            return;
        }

        const lastAssistantMessage = output.lastAssistantMessage;
        const run_status = output.run_status;

        if (lastAssistantMessage) {
            const content = lastAssistantMessage.content[0];
            if (content && 'text' in content) {
                const { formula, shortName } = parseGoalTranslation(content.text.value);
                llmContext.visiblePPCreationMessages.push({ role: 'sender', content: content.text.value, iterationStepId: null });
                llmContext.seenByGTMessages.push({ role: 'sender', content: content.text.value });
                await llmContext.save();
                console.log("LLMContext updated with output and saved")
                console.log(`Sent value > ${formula}, ${shortName}`);
                res.status(200).send({ data: { "response": { formula, shortName }, "threadId": threadId } });
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

        // check if LLMContextModel exists
        let llmContext = await LLMContextModel.findOne({ project: req.body.projectId, assistantIdGT: process.env.ASSISTANT_ID_GOALTRANSLATOR ?? (() => { throw new Error('ASSISTANT_ID_GOALTRANSLATOR is not set') })(), assistantIdQT: process.env.ASSISTANT_ID_QUESTIONTRANSLATOR ?? (() => { throw new Error('ASSISTANT_ID_QUESTIONTRANSLATOR is not set') })(), assistantIdET: process.env.ASSISTANT_ID_EXPLANATIONTRANSLATOR ?? (() => { throw new Error('ASSISTANT_ID_EXPLANATIONTRANSLATOR is not set') })() });
        if (!llmContext) {
            console.log("No LLMContext found, creating new one")
            const threadIdET = (await openai_client.beta.threads.create({})).id
            const threadIdGT = (await openai_client.beta.threads.create({})).id
            const threadIdQT = (await openai_client.beta.threads.create({})).id
            const llmContextData = {
                project: req.body.projectId,
                assistantIdGT: process.env.ASSISTANT_ID_GOALTRANSLATOR,
                assistantIdQT: process.env.ASSISTANT_ID_QUESTIONTRANSLATOR,
                assistantIdET: process.env.ASSISTANT_ID_EXPLANATIONTRANSLATOR,
                threadIdGT: threadIdGT,
                threadIdQT: threadIdQT,
                threadIdET: threadIdET,
                visibleMessages: [{ role: 'receiver', content: req.body.originalRequest, iterationStepId: req.body.iterationStepId }],
                visiblePPCreationMessages: [],
                seenByGTMessages: [],
                seenByETMessages: [{ role: 'receiver', content: req.body.data }],
                seenByQTMessages: [],
            }
            llmContext = new LLMContextModel(llmContextData);
            await llmContext.save();
            console.log("New LLMContext created and saved")
        } else {
            console.log("LLMContext found, updating it")
            llmContext.visibleMessages.push({ role: 'receiver', content: req.body.originalRequest, iterationStepId: req.body.iterationStepId });
            llmContext.seenByETMessages.push({ role: 'receiver', content: req.body.data });
            await llmContext.save();
            console.log("LLMContext updated and saved")
            // Check if threadID still xists
            // const myThread = await openai_client.beta.threads.retrieve(llmContext.threadIdGT);
        }

        if (llmContext.threadIdGT == null) {
            res.status(404).send({ error: 'No threadIdGT found' });
            return;
        }
        console.log("req.body", req.body)
        const input = req.body.data

        const output = await processEtRequest(input, llmContext.threadIdET);
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
                const { output } = parseExplanationTranslation(response);

                llmContext.visibleMessages.push({ role: 'sender', content: output, iterationStepId: req.body.iterationStepId });
                llmContext.seenByETMessages.push({ role: 'sender', content: response });
                await llmContext.save();
                console.log(`Sent value > ${response}`);
                res.status(200).send({ data: { "response": output, "threadId": llmContext.threadIdET } });
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
        const threadId = req.body.threadId == '' ? (await openai_client.beta.threads.create({})).id : req.body.threadId;
        console.log("threadId (req.body.threadId)", threadId)
        const input = req.body.data

        const output = await processQtRequest(input, threadId);
        if (output == undefined) {
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

LLMRouter.post('/qt-then-gt', async (req, res) => {
    try {
        console.log("req.body", req.body);

        // check if LLMContextModel exists
        let llmContext = await LLMContextModel.findOne({ project: req.body.projectId, assistantIdGT: process.env.ASSISTANT_ID_GOALTRANSLATOR ?? (() => { throw new Error('ASSISTANT_ID_GOALTRANSLATOR is not set') })(), assistantIdQT: process.env.ASSISTANT_ID_QUESTIONTRANSLATOR ?? (() => { throw new Error('ASSISTANT_ID_QUESTIONTRANSLATOR is not set') })(), assistantIdET: process.env.ASSISTANT_ID_EXPLANATIONTRANSLATOR ?? (() => { throw new Error('ASSISTANT_ID_EXPLANATIONTRANSLATOR is not set') })() });
        if (!llmContext) {
            const threadIdET = (await openai_client.beta.threads.create({})).id
            const threadIdGT = (await openai_client.beta.threads.create({})).id
            const threadIdQT = (await openai_client.beta.threads.create({})).id
            const llmContextData = {
                project: req.body.projectId,
                assistantIdGT: process.env.ASSISTANT_ID_GOALTRANSLATOR ?? (() => { throw new Error('ASSISTANT_ID_GOALTRANSLATOR is not set') })(),
                assistantIdQT: process.env.ASSISTANT_ID_QUESTIONTRANSLATOR ?? (() => { throw new Error('ASSISTANT_ID_QUESTIONTRANSLATOR is not set') })(),
                assistantIdET: process.env.ASSISTANT_ID_EXPLANATIONTRANSLATOR ?? (() => { throw new Error('ASSISTANT_ID_EXPLANATIONTRANSLATOR is not set') })(),
                threadIdGT: threadIdGT,
                threadIdQT: threadIdQT,
                threadIdET: threadIdET,
                visibleMessages: [{ role: 'receiver', content: req.body.originalQuestion, iterationStepId: req.body.iterationStepId }],
                visiblePPCreationMessages: [],
                seenByGTMessages: [{ role: 'receiver', content: req.body.gtRequest }],
                seenByETMessages: [],
                seenByQTMessages: [{ role: 'receiver', content: req.body.qtRequest }],
            }
            llmContext = new LLMContextModel(llmContextData);
            await llmContext.save();
        } else {
            llmContext.visibleMessages.push({ role: 'receiver', content: req.body.originalQuestion, iterationStepId: req.body.iterationStepId });
            llmContext.seenByGTMessages.push({ role: 'receiver', content: req.body.gtRequest });
            llmContext.seenByQTMessages.push({ role: 'receiver', content: req.body.qtRequest });
            await llmContext.save();
            // Check if threadID still xists
            // const myThread = await openai_client.beta.threads.retrieve(llmContext.threadIdGT);
        }

        if (llmContext == null) {
            res.status(404).send({ error: 'No LLMContext found' });
            return;
        }



        // Process QT request
        const qtOutput = await processQtRequest(req.body.qtRequest, llmContext.threadIdQT);
        if (qtOutput == undefined) {
            res.status(500).send({ error: `QT run status is null` });
            return;
        }

        console.log("qtOutput", qtOutput)

        // Get QT response
        let qtResponse;
        if (qtOutput.lastAssistantMessage) {
            const content = qtOutput.lastAssistantMessage.content[0];
            if (content && 'text' in content) {
                qtResponse = content.text.value;
                llmContext.seenByQTMessages.push({ role: 'receiver', content: qtResponse });
                await llmContext.save();
            } else {
                res.status(404).send({ error: 'No valid content in QT response assistant message' });
                return;
            }
        }

        console.log("qtResponse", qtResponse)

        if (qtResponse == undefined) {
            res.status(404).send({ error: 'No QT response found' });
            return;
        }

        // Parse QT response and prepare GT input
        const { questionType, questionArgument: untranslatedGoal, used, reverseTranslation, feedback } = parseQuestionTranslation(qtResponse);

        console.log("output of parseQuestionTranslation", { questionType, untranslatedGoal, used, reverseTranslation, feedback })
        const gtInput = req.body.gtRequest.replace("{goal_description}", untranslatedGoal);
        let gtResponse;
        let planProperty;
        // Process GT request only if used is 'NEVER-USED'


        if (used == "ALREADY-USED") {

            planProperty = await PlanPropertyModel.findOne({
                name: untranslatedGoal,
                project: req.body.projectId
            });
            if (planProperty != null) {
                gtResponse = { formula: planProperty.formula, shortName: planProperty.name, reverseTranslation: planProperty.naturalLanguageDescription, feedback: "" };
            }

            console.log("Because used is ALREADY-USED, planProperty is", planProperty)
        }
        if (used == 'NEVER-USED' || planProperty == null || planProperty == undefined) {
            console.log("gtInput", gtInput)
            const gtOutput = await processGtRequest(gtInput, llmContext.threadIdGT);
            if (gtOutput == undefined) {
                res.status(500).send({ error: `GT run status is null` });
                return;
            }
            if (gtOutput.lastAssistantMessage) {
                const content = gtOutput.lastAssistantMessage.content[0];
                if (content && 'text' in content) {
                    gtResponse = content.text.value;
                    llmContext.seenByGTMessages.push({ role: 'receiver', content: gtResponse });
                    await llmContext.save();

                } else {
                    res.status(404).send({ error: 'No valid content in GT assistant message' });
                    return;
                }
            }
            if (gtResponse == undefined) {
                res.status(404).send({ error: 'No GT response found' });
                return;
            }

            // Get GT response to save plan property
            if (gtOutput.lastAssistantMessage) {
                const content = gtOutput.lastAssistantMessage.content[0];
                if (content && 'text' in content) {
                    const gtResponse = content.text.value;
                    const { formula, shortName, reverseTranslation, feedback } = parseGoalTranslation(gtResponse);


                    const planProperty = new PlanPropertyModel({
                        name: shortName,
                        project: req.body.projectId,
                        type: 'LTL',
                        formula: formula,
                        naturalLanguageDescription: reverseTranslation,
                        isUsed: true,
                        globalHardGoal: false,
                        utility: 1,
                        color: '#FFB6C1', // Light pink color
                        icon: 'chat',
                        class: 'Defined using Natural Language',
                    });
                    await planProperty.save();


                    if (planProperty == null) {
                        // This should never happen
                        res.status(404).send({ error: 'No plan property found' });
                        return;
                    }

                }
            }
        }

        let ppId = planProperty?._id;

        const question: Question = {
            iterationStepId: req.body.iterationStepId,
            questionType: questionType as QuestionType,
            propertyId: ppId
        };

        console.log("Sending data", { qtResponse, gtResponse, threadIdQT: llmContext.threadIdQT, threadIdGT: llmContext.threadIdGT })
        res.status(200).send({
            data: {
                qtResponse,
                gtResponse,
                threadIdQT: llmContext.threadIdQT,
                threadIdGT: llmContext.threadIdGT,
                questionType: questionType as QuestionType,
                goal: ppId,
                question: question
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
});


interface QuestionTranslation {
    questionType: string;
    questionArgument: string;
    used: string;
    reverseTranslation: string;
    feedback: string;
}

function parseQuestionTranslation(qtResponse: string): QuestionTranslation {
    try {
        // qtResponse is a JSON object
        const qtResponseObject = JSON.parse(qtResponse);
        return qtResponseObject;

    } catch (error) {
        console.error('Error parsing question translation:', error);
        console.log("qtResponse", qtResponse)
        return {
            questionType: '',
            questionArgument: '',
            used: '',
            reverseTranslation: '',
            feedback: 'Error parsing question translation. Please try again.'
        };
    }
}

interface GoalTranslation {
    formula: string;
    shortName: string;
    reverseTranslation: string;
    feedback: string;
}

function parseGoalTranslation(gtResponse: string): GoalTranslation {
    try {
        // gtResponse is a JSON object
        const gtResponseObject = JSON.parse(gtResponse);
        return gtResponseObject;

        // // Assuming gtResponse is a string with format "<goal>;<shortName>"
        // const [formula, shortName] = gtResponse.split(';').map(part => part.trim());
        // return { formula, shortName };
    } catch (error) {
        console.error('Error parsing goal translation:', error);
        return {
            formula: '',
            shortName: '',
            reverseTranslation: '',
            feedback: 'Error parsing goal translation. Please try again.'
        };
    }
}

interface ExplanationTranslation {
    output: string;
}

function parseExplanationTranslation(etResponse: string): ExplanationTranslation {
    try {
        const etResponseObject = JSON.parse(etResponse);
        return etResponseObject;
    } catch (error) {
        console.error('Error parsing explanation translation:', error);
        return {
            output: 'Error parsing explanation translation. Please try again.'
        };
    }
}

async function listPlanProperties(projectId: string) {
    const planProperties = await PlanPropertyModel.find({ project: projectId });

    console.log('Plan Properties for project', projectId, ':');
    planProperties.forEach(prop => {
        console.log(`- Name: ${prop.name}`);
        console.log(`  Formula: ${prop.formula}`);
        console.log(`  Description: ${prop.naturalLanguageDescription}`);
        console.log('---');
    });

    return planProperties;
}


LLMRouter.get('/llm-context', async (req, res) => {

    if (req.query.projectId === undefined) {
        return res.status(404).send({ message: 'no projectId specified' });
    }
    const projectId: string = req.query.projectId as string;
    const llmContext = await LLMContextModel.findOne({ project: projectId, assistantIdGT: process.env.ASSISTANT_ID_GOALTRANSLATOR ?? (() => { throw new Error('ASSISTANT_ID_GOALTRANSLATOR is not set') })(), assistantIdQT: process.env.ASSISTANT_ID_QUESTIONTRANSLATOR ?? (() => { throw new Error('ASSISTANT_ID_QUESTIONTRANSLATOR is not set') })(), assistantIdET: process.env.ASSISTANT_ID_EXPLANATIONTRANSLATOR ?? (() => { throw new Error('ASSISTANT_ID_EXPLANATIONTRANSLATOR is not set') })() });

    if (!llmContext) {
        return res.status(404).send({ message: 'No LLMContext found.' });
    }

    res.send({
        data: llmContext
    });

});

