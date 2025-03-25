import express from 'express';
import { auth, authAdmin, authAny } from '../middleware/auth';
import { processEtRequest, processGtRequest, processQtRequest } from './llm-process-requests';
import { PlanPropertyModel } from '../db_schema/plan-properties/plan_property';
import { Question, QuestionType } from '../db_schema/explanations';
import { LLMContext, LLMContextModel } from '../db_schema/llm-context';
import { User, UserModel } from '../db_schema/user';
import { initializeAssistants } from '../llm/initialize_assistants';
import { BaseProjectModel, ProjectModel } from '../db_schema/project';
import { Schema } from 'mongoose';
import { LLMPrompts } from '../llm/translators_interfaces';

export const LLMRouter = express.Router();

export const maxDuration = 30;


LLMRouter.post('/gt', authAny, async (req: any, res) => {
    try {

        let llmContext: LLMContext | null = await LLMContextModel
            .find({
                user: req.user._id,
                project: req.body.projectId,
                iterationStepId: req.body.iterationStepId
            })
            .sort({ createdAt: -1 })
            .limit(1)
            .then(contexts => contexts[0] || null);

        if (!llmContext) {
            res.status(404).send({ error: 'No LLMContext found for user ' + req.user._id + ' and project ' + req.body.projectId + ' and iterationStepId ' + req.body.iterationStepId });
            return;
        }

        const settings = llmContext.settings;


        llmContext.visiblePPCreationMessages.push({ role: 'receiver', content: req.body.originalRequest, iterationStepId: req.body.iterationStepId });
        llmContext.seenByGTMessages.push({ role: 'receiver', content: req.body.data });
        await llmContext.save();
        console.log("LLMContext updated and saved")


        const input = req.body.data

        const output = await processGtRequest(input, llmContext, settings);
        if (output == undefined) {
            res.status(500).send({ error: `undefined output of processGtRequest` });
            return;
        }

        let gtResponse;
        if (output.message.refusal) {
            gtResponse = output.message.refusal;
            llmContext.seenByGTMessages.push({ role: 'receiver', content: gtResponse });
            await llmContext.save();
            res.status(200).send({ data: { gtResponse } });

        } else if (output.message.content) {
            gtResponse = output.message.content;
            llmContext.seenByGTMessages.push({ role: 'receiver', content: gtResponse });
            await llmContext.save();
        } else {
            res.status(404).send({ error: 'No GT response found' });
            return;
        }

        if (gtResponse) {
            
            const { formula, shortName, reverseTranslation, feedback } = parseGoalTranslation(gtResponse);
            llmContext.visiblePPCreationMessages.push({ role: 'sender', content: gtResponse, iterationStepId: req.body.iterationStepId });
            llmContext.seenByGTMessages.push({ role: 'sender', content: gtResponse });
            await llmContext.save();
            console.log("LLMContext updated with output and saved")
            console.log(`Sent value > ${formula}, ${shortName}`);
            res.status(200).send({ data: { "response": { formula, shortName, reverseTranslation, feedback } } });
           
        } else {
            console.log('No assistant message found');
            res.status(404).send({ error: 'No assistant message found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
});

LLMRouter.post('/et', authAny, async (req: any, res) => {
    try {
        console.log("req.body", req.body);
        if (req.body.projectId == undefined || req.body.iterationStepId == undefined || req.body.originalRequest == undefined) {
            res.status(404).send({ error: `At least one of the following is missing: projectId (${req.body.projectId}), iterationStepId (${req.body.iterationStepId}), or originalRequest (${req.body.originalRequest})` });
            return;
        }

        let llmContext: LLMContext | null = await LLMContextModel
            .find({
                user: req.user._id,
                project: req.body.projectId,
                iterationStepId: req.body.iterationStepId
            })
            .sort({ createdAt: -1 })
            .limit(1)
            .then(contexts => contexts[0] || null);

        if (!llmContext) {
            res.status(404).send({ error: 'No LLMContext found for user ' + req.user._id + ' and project ' + req.body.projectId + ' and iterationStepId ' + req.body.iterationStepId });
            return;
        }

        const settings = llmContext.settings;

        llmContext.visibleMessages.push({ role: 'receiver', content: req.body.originalRequest, iterationStepId: req.body.iterationStepId });
        llmContext.seenByETMessages.push({ role: 'receiver', content: req.body.data });
        await llmContext.save();
        console.log("LLMContext updated and saved")


        console.log("req.body", req.body)
        const input = req.body.data

        const output = await processEtRequest(input, llmContext, settings);
        if (output == undefined) {
            res.status(500).send({ error: `undefined output of processEtRequest` });
            return;
        }
        let etResponse;
        if (output.message.refusal) {
            etResponse = output.message.refusal;
            llmContext.seenByETMessages.push({ role: 'receiver', content: etResponse });
            await llmContext.save();
            res.status(200).send({ data: { etResponse } });

        } else if (output.message.content) {
            etResponse = output.message.content;
            llmContext.seenByETMessages.push({ role: 'receiver', content: etResponse });
            await llmContext.save();
        } else {
            res.status(404).send({ error: 'No QT response found' });
            return;
        }            
        if (etResponse) {
            const { output } = parseExplanationTranslation(etResponse);

            llmContext.visibleMessages.push({ role: 'sender', content: output, iterationStepId: req.body.iterationStepId });
            llmContext.seenByETMessages.push({ role: 'sender', content: etResponse });
            await llmContext.save();
            res.status(200).send({ data: { "response": output } });
        } else {
            res.status(404).send({ error: 'No valid content in etResponse' });
        }
            
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
});

LLMRouter.post('/qt', authAny, async (req: any, res) => {
    try {
        console.log("Trying to find LLMContext...");
        let llmContext: LLMContext | null = await LLMContextModel
            .find({
                user: req.user._id,
                project: req.body.projectId,
                iterationStepId: req.body.iterationStepId
            })
            .sort({ createdAt: -1 })
            .limit(1)
            .then(contexts => contexts[0] || null);

        if (!llmContext) {
            res.status(404).send({ error: 'No LLMContext found for user ' + req.user._id + ' and project ' + req.body.projectId + ' and iterationStepId ' + req.body.iterationStepId });
            return;
        }

        const settings = llmContext.settings;

        console.log("Will push visible messages then save")
        if (req.body.qtRequest == undefined) {
            res.status(404).send({ error: 'No qtRequest found' });
            return;
        }
        if (req.body.originalQuestion == undefined) {
            res.status(404).send({ error: 'No originalQuestion found' });
            return;
        }
        llmContext.visibleMessages.push({ role: 'receiver', content: req.body.originalQuestion, iterationStepId: req.body.iterationStepId });
        llmContext.seenByQTMessages.push({ role: 'receiver', content: req.body.qtRequest });
        console.log("Pushed visible messages, now saving")
        await llmContext.save();
        console.log("Saved")

        // Process QT request
        const qtOutput = await processQtRequest(req.body.qtRequest, llmContext, settings);
        if (qtOutput == undefined) {
            res.status(500).send({ error: `QT run status is null` });
            return;
        }


        let qtResponse;
        if (qtOutput.message.refusal) {
            qtResponse = qtOutput.message.refusal;
            llmContext.seenByQTMessages.push({ role: 'receiver', content: qtResponse });
            await llmContext.save();
            res.status(200).send({ data: { qtResponse, questionType: "DIRECT-USER" } });

        } else if (qtOutput.message.content) {
            qtResponse = qtOutput.message.content;
            llmContext.seenByQTMessages.push({ role: 'receiver', content: qtResponse });
            await llmContext.save();
        } else {
            res.status(404).send({ error: 'No QT response found' });
            return;
        }

        llmContext.seenByQTMessages.push({ role: 'sender', content: qtResponse });
        await llmContext.save();
        // Parse QT response and prepare GT input
        let { questionType, questionArgument: untranslatedGoal, used, reverseTranslation: reverseTranslationQT, directResponse } = parseQuestionTranslation(qtResponse);

        if (directResponse != null) {
            console.log("directResponse is not null, therefore returning directResponse")
            res.status(200).send({ data: { directResponse, questionType } });
            return;
        }

        console.log("output of parseQuestionTranslation", { questionType, untranslatedGoal, used, reverseTranslationQT, directResponse })

        let planProperty;

        if (used == "ALREADY-USED" && untranslatedGoal != "") {

            planProperty = await PlanPropertyModel.findOne({
                name: untranslatedGoal,
                project: req.body.projectId
            });
            if (planProperty == null) {
                res.status(404).send({ error: 'No plan property found' });
                return;
            }
            console.log("Because used is ALREADY-USED, planProperty is", planProperty)
        } else if (used == 'NEVER-USED' && !['DIRECT-USER', 'DIRECT-ET', 'US-HOW', 'US-WHY'].includes(questionType)) {
            console.log("used is NEVER-USED, therefore returning directResponse")
            directResponse = directResponse || "I couldn't understand the goal you are asking about. Can you rephrase it or try a different question?"
            res.status(200).send({ data: { directResponse, questionType: "DIRECT-USER" } });
            return;
        } else if (used == 'NO-ARGUMENT-REQUIRED' && !['DIRECT-USER', 'DIRECT-ET', 'US-HOW', 'US-WHY'].includes(questionType)) {
            console.log("used is unexpectedly NO-ARGUMENT-REQUIRED, therefore returning directResponse")
            let directResponse = "I couldn't understand the goal you are asking about. Can you rephrase it or try a different question?"
            res.status(200).send({ data: { directResponse, questionType: "DIRECT-USER" } });
            return;
        } else if (used == 'NO-ARGUMENT-REQUIRED' && ['DIRECT-USER', 'DIRECT-ET', 'US-HOW', 'US-WHY'].includes(questionType)) {
            console.log("used is NO-ARGUMENT-REQUIRED and its expected because of questionType", questionType, "therefore continuing")
        } else if (used == 'NEVER-USED' && ['US-WHY', 'US-HOW'].includes(questionType)) {
            console.log("used is NEVER-USED but questionType is ", questionType, ", this is unexpected, but continuing as if it was NO-ARGUMENT-REQUIRED")
        } else if (used == 'NEVER-USED' && ['DIRECT-USER', 'DIRECT-ET'].includes(questionType)) {
            console.log("used is NEVER-USED but questionType is ", questionType, ", this is unexpected, but continuing as if it was NO-ARGUMENT-REQUIRED")
        } else {
            res.status(404).send({ error: 'No valid used found' });
            return;
        }

        let ppId = planProperty?._id;

        const question: Question = {
            iterationStepId: req.body.iterationStepId,
            questionType: questionType as QuestionType,
            propertyId: ppId
        };

        console.log("Sending data", { qtResponse })
        res.status(200).send({
            data: {
                qtResponse,
                questionType: questionType as QuestionType,
                goal: ppId,
                question: question,
                reverseTranslationQT: reverseTranslationQT,
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
});

LLMRouter.post('/qt-then-gt', authAny, async (req: any, res) => {
    try {
        let llmContext: LLMContext | null = await LLMContextModel
            .find({
                user: req.user._id,
                project: req.body.projectId,
                iterationStepId: req.body.iterationStepId
            })
            .sort({ createdAt: -1 })
            .limit(1)
            .then(contexts => contexts[0] || null);

        if (!llmContext) {
            res.status(404).send({ error: 'No LLMContext found for user ' + req.user._id + ' and project ' + req.body.projectId + ' and iterationStepId ' + req.body.iterationStepId });
            return;
        }

        const settings = llmContext.settings;

        console.log("Will push visible messages then save")
        if (req.body.qtRequest == undefined) {
            res.status(404).send({ error: 'No qtRequest found' });
            return;
        }
        if (req.body.originalQuestion == undefined) {
            res.status(404).send({ error: 'No originalQuestion found' });
            return;
        }
        llmContext.visibleMessages.push({ role: 'receiver', content: req.body.originalQuestion, iterationStepId: req.body.iterationStepId });
        llmContext.seenByQTMessages.push({ role: 'receiver', content: req.body.qtRequest });
        console.log("Pushed visible messages, now saving")
        await llmContext.save();
        console.log("Saved")

        // Process QT request
        const qtOutput = await processQtRequest(req.body.qtRequest, llmContext, settings);
        if (qtOutput == undefined) {
            res.status(500).send({ error: `QT run status is null` });
            return;
        }


        let qtResponse;
        if (qtOutput.message.refusal) {
            qtResponse = qtOutput.message.refusal;
            llmContext.seenByQTMessages.push({ role: 'receiver', content: qtResponse });
            await llmContext.save();
            res.status(200).send({ data: { qtResponse, questionType: "DIRECT-USER" } });

        } else if (qtOutput.message.content) {
            qtResponse = qtOutput.message.content;
            llmContext.seenByQTMessages.push({ role: 'receiver', content: qtResponse });
            await llmContext.save();
        } else {
            res.status(404).send({ error: 'No QT response found' });
            return;
        }

        llmContext.seenByQTMessages.push({ role: 'sender', content: qtResponse });
        await llmContext.save();
        // Parse QT response and prepare GT input
        const { questionType, questionArgument: untranslatedGoal, used, reverseTranslation: reverseTranslationQT, directResponse } = parseQuestionTranslation(qtResponse);

        if (directResponse != null) {
            res.status(200).send({ data: { directResponse, questionType } });
            return;
        }

        console.log("output of parseQuestionTranslation", { questionType, untranslatedGoal, used, reverseTranslationQT, directResponse })
        const gtInput = req.body.gtRequest.replace("{goal_description}", untranslatedGoal);
        let gtResponse;
        let planProperty;
        let reverseTranslationGT;
    

        if (used == "ALREADY-USED" && untranslatedGoal != "") {

            planProperty = await PlanPropertyModel.findOne({
                name: untranslatedGoal,
                project: req.body.projectId
            });
            if (planProperty == null) {
                res.status(404).send({ error: 'No plan property found' });
                return;
            } else {
                gtResponse = { formula: planProperty.formula, shortName: planProperty.name, reverseTranslation: planProperty.naturalLanguageDescription, feedback: "" };
                reverseTranslationGT = planProperty.naturalLanguageDescription;
            }
            
        } else if (used == 'NEVER-USED') {

            const gtOutput = await processGtRequest(gtInput, llmContext, settings);
            if (gtOutput == undefined) {
                res.status(500).send({ error: `undefined output of processGtRequest` });
                return;
            }

            let gtResponse;
            if (gtOutput.message.refusal) {
                gtResponse = gtOutput.message.refusal;
                llmContext.seenByGTMessages.push({ role: 'receiver', content: gtResponse });
                await llmContext.save();
                res.status(200).send({ data: { gtResponse } });

            } else if (gtOutput.message.content) {
                gtResponse = gtOutput.message.content;
                llmContext.seenByGTMessages.push({ role: 'receiver', content: gtResponse });
                await llmContext.save();
            } else {
                res.status(404).send({ error: 'No GT response found' });
                return;
            }

            // Get GT response to save plan property
            if (gtResponse) {
                const { formula, shortName, reverseTranslation: reverseTranslationGT, feedback } = parseGoalTranslation(gtResponse);

                    if (feedback != null && feedback.trim() !== '') {
                        res.status(200).send({ data: { feedback, questionType } });
                        return;
                    }

                    const planProperty = new PlanPropertyModel({
                        name: shortName,
                        project: req.body.projectId,
                        type: 'LTL',
                        formula: formula,
                        naturalLanguageDescription: reverseTranslationGT,
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
            return;
        } else if (used == 'NO-ARGUMENT-REQUIRED' && !['DIRECT-USER', 'DIRECT-ET', 'US-HOW', 'US-WHY'].includes(questionType)) {
            console.log("used is unexpectedly NO-ARGUMENT-REQUIRED, therefore returning directResponse")
            let directResponse = "I couldn't understand the goal you are asking about. Can you rephrase it or try a different question?"
            res.status(200).send({ data: { directResponse, questionType: "DIRECT-USER" } });
            return;
        } else if (used == 'NO-ARGUMENT-REQUIRED' && ['DIRECT-USER', 'DIRECT-ET', 'US-HOW', 'US-WHY'].includes(questionType)) {
            console.log("used is NO-ARGUMENT-REQUIRED and its expected because of questionType", questionType, "therefore continuing")
        } else {
            res.status(404).send({ error: 'No valid used found' });
            return;
        }

        let ppId = planProperty?._id;

        const question: Question = {
            iterationStepId: req.body.iterationStepId,
            questionType: questionType as QuestionType,
            propertyId: ppId
        };

        console.log("Sending data", { qtResponse, gtResponse })
        res.status(200).send({
            data: {
                qtResponse,
                gtResponse,
                questionType: questionType as QuestionType,
                goal: ppId,
                question: question,
                reverseTranslationQT: reverseTranslationQT,
                reverseTranslationGT: reverseTranslationGT
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
    directResponse: string;
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
            directResponse: 'Error parsing question translation. Please try again.'
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
        console.log("gtResponse", gtResponse)
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




LLMRouter.get('/llm-context', authAdmin, async (req: any, res) => {
    //todo update
    if (req.query.projectId === undefined) {
        return res.status(404).send({ message: 'no projectId specified' });
    }
    const projectId: string = req.query.projectId as string;
    const user: User = req.user;
    const stepId: string = req.query.iterationStepId as string;
    // check if LLMContextModel exists
    let llmContext: LLMContext | null = await LLMContextModel
        .find({
            user: req.user._id,
            project: req.body.projectId,
            iterationStepId: req.body.iterationStepId
        })
        .sort({ createdAt: -1 })
        .limit(1)
        .then(contexts => contexts[0] || null);

    if (!llmContext) {
        res.status(404).send({ error: 'No LLMContext found for user ' + req.user._id + ' and project ' + req.body.projectId + ' and iterationStepId ' + req.body.iterationStepId });
        return;
    }

    res.send({
        data: llmContext
    });

});

LLMRouter.post('/create-llm-context', authAny, async (req: any, res) => {

    try {

        let user: User = req.user;
        if (req.body.projectId == undefined) {
            return res.status(404).send({ message: 'no projectId specified' });
        }
        if (req.body.iterationStepId == undefined) {
            return res.status(404).send({ message: 'no iterationStepId specified' });
        }
    
        const projectId = req.body.projectId;
        const iterationStepId = req.body.iterationStepId;
        const settings = await getSettingsfromProjectId(projectId);

        const llmConfig = settings?.llmConfig;

        if(llmConfig == undefined){
            return res.status(404).send({ message: 'no llmConfig found' });
        }
        
        
        // const prompts = req.body.prompts;
        // const prompts : LLMPrompts = {
        //     systemPrompt: "this is the system prompt",
        //     gt: {
        //         prompt: "You are a goal translator",
        //         outputFormat: {structured: true, schema: '{"type":"json_schema","json_schema":{"name":"GT_feedback","strict":true,"schema":{"type":"object","properties":{"formula":{"type":"string","description":"The well-formed LTLf formula representing the input utterance using only provided predicates and objects."},"shortName":{"type":"string","description":"A very short description of the translated goal."},"reverseTranslation":{"type":"string","description":"The translation of the generated formula back into natural language to check if the translation is correct."},"feedback":{"type":["string","null"],"description":"Feedback provided to the user if the translation is not possible. Only use this entry in this case."}},"required":["formula","shortName","reverseTranslation","feedback"],"additionalProperties":false}}}'},
        //     },
        //     qt: {
        //         prompt: "You are a question translator",
        //         outputFormat: {
        //             structured:true, schema: '{"type":"json_schema","json_schema":{"name":"QT_feedback","strict":true,"schema":{"type":"object","properties":{"questionType":{"type":"string","description":"The type of question that was asked. S- means solvable planning task and US- means unsolvable planning task. DIRECT-USER means the question cannot be translated to a structured question and that you should answer directly. DIRECT-ET means the question is a follow-up question about the explanation and should be answered directly by the explanation translator. US- question type can only be used if the Solvable field of the input is False. and S- question type can only be used if the Solvable field of the input is True and the question is about a single property. In other cases, use DIRECT-USER or DIRECT-ET (you can decide what questions are follow-up questions to the explanation translator).","enum":["S-WHY-NOT","S-HOW","S-CAN","S-WHAT-IF","US-WHY","US-HOW","DIRECT-USER","DIRECT-ET"]},"questionArgument":{"type":"string","description":"The argument of the question that was asked, i.e. the goal or plan property that was asked about. Only use this entry if the questionType is S- or US-. You should only use this entry if the question is about a single property, not multiple properties. This field can only be filled by an element of one of the goals fields."},"used":{"type":"string","description":"Describes if the questionArgument is in one of the provided list of goals (ALREADY-USED) or not (NEVER-USED). If the questionType is US- or DIRECT- , use NO-ARGUMENT-REQUIRED. If the questionType is S- and the questionArgument is in one of the provided list of goals, use ALREADY-USED.","enum":["ALREADY-USED","NEVER-USED","NO-ARGUMENT-REQUIRED"]},"reverseTranslation":{"type":"string","description":"The translation of the question back into natural language to check if the translation is correct. Use this entry to signify  I understood you question as {reverseTranslation}  based on the questionType and questionArgument only. Only use this entry for S- and US- question types."},"directResponse":{"type":["string","null"],"description":"Response provided to the user if the translation to a structured question is not possible. Only use this entry for DIRECT question types. When the questionType is DIRECT-USER, reply to the user direcltly using this field. When the questionType is DIRECT-ET, just copy the question in this field."}},"required":["questionType","questionArgument","used","reverseTranslation","directResponse"],"additionalProperties":false}}}'
        //         },
        //     },
        //     et: {
        //         prompt: "You are an explanation translator",
        //         outputFormat: {structured: true, schema: '{"type":"json_schema","json_schema":{"name":"ET_feedback","strict":true,"schema":{"type":"object","properties":{"output":{"type":"string","description":"The output of the explanation translator."}},"required":["output"],"additionalProperties":false}}}'}
        //     }
        // }

        const { seenByGTMessages, seenByETMessages, seenByQTMessages, outputFormatQT, outputFormatET, outputFormatGT } = await initializeAssistants(projectId);

        console.log("Creating LLMContextModel...");
        const llmContext = new LLMContextModel({
            user: user._id,
            project: projectId,
            iterationStepId: iterationStepId,
            visibleMessages: [],
            visiblePPCreationMessages: [],
            seenByGTMessages: seenByGTMessages,
            seenByETMessages: seenByETMessages,
            seenByQTMessages: seenByQTMessages,
            outputFormatQT: {structured: true, schema: outputFormatQT},
            outputFormatET: {structured: true, schema: outputFormatET},
            outputFormatGT: {structured: true, schema: outputFormatGT},
            settings: llmConfig,
        });
        try {
            await llmContext.save();
            res.send({
                data: llmContext
            });
        } catch (error) {
            console.error(error);
            res.status(500).send(error);
            console.log(llmContext)
        }
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }

});

async function getSettingsfromProjectId(projectId: string) {
    try {
        const project = await ProjectModel.findById(projectId);
        if (project == null) {
            const project = await BaseProjectModel.findById(projectId);
            if (project == null) {
                throw new Error('No project found');
            }
        }
        return project?.settings;
    } catch (error) {
        console.error(error);
        throw new Error('No project found');
    }
}