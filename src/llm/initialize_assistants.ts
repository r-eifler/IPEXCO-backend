import OpenAI from "openai";
import belugaPrompts from "./data/prompts/beluga/prompts.json";
import blocksworldPrompts from "./data/prompts/blocksworld/prompts.json";
import blocksworldTemplates from "./data/prompts/blocksworld/templates.json";
import transportPrompts from "./data/prompts/transport/prompts.json";
import transportTemplates from "./data/prompts/transport/templates.json";
import belugaTemplates from "./data/prompts/beluga/templates.json";
import parentsafternoonPrompts from "./data/prompts/parentsafternoon/prompts.json";
import parentsafternoonTemplates from "./data/prompts/parentsafternoon/templates.json";
import outputSchemas from "./output_schemas.json";
import fs from 'fs/promises';
import path from 'path';
import { openai_client } from "./openai_client";
import { BaseProjectModel } from "../db_schema/project";
import { AllLLMConfig } from "../db_schema/llm-config";
import { LLMMessage } from "../db_schema/llm-context";
import { OutputSchemaModel, PromptModel } from "../db_schema/prompt";
export type OpenAIModelName = "gpt-4o-mini" | "gpt-4o" ;

// const domains = {
//     beluga: belugaPrompts,
//     blocksworld: blocksworldPrompts,
//     transport: transportPrompts,
//     parentsafternoon: parentsafternoonPrompts
// }

// const templates = {
//     blocksworld: blocksworldTemplates,
//     beluga: belugaTemplates,
//     transport: transportTemplates,
//     parentsafternoon: parentsafternoonTemplates
// }



// function formatExamples(examples: any[]): string {
//     return examples.map((example, index) => {
//         const formattedExample = Object.entries(example)
//             .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
//             .join('\n');
//         return `Example ${index + 1}:\n${formattedExample}\n`;
//     }).join('\n');
// }


// function formatExamples(examples: any[], domain:keyof typeof domains, translatorType: keyof typeof templates[typeof domain]): string {
//     const template = templates[domain][translatorType];
    
//     return examples.map((example, index) => {
//         // Handle direct questions that have different format
//         if (example.Input) {
//             return `\n${example.Input}\n${example.Return}\n`;
//         }
        
//         let formattedExample = template;
        
//         // Replace each placeholder in the template with its corresponding value
//         for (const [key, value] of Object.entries(example)) {
//             const placeholder = `{${key}}`;
//             // Remove quotes from stringified value if it's a string
//             const stringifiedValue = typeof value === 'string' 
//                 ? value 
//                 : JSON.stringify(value);
//             formattedExample = formattedExample.replace(placeholder, stringifiedValue);
//         }
        
//         return `\n${formattedExample}\n`;
//     }).join('\n');
// }


// async function createAssistant(name: string, instructions: string, examples: any[], domain: keyof typeof domains, openai: OpenAI, model: OpenAIModelName, translatorType: keyof typeof templates[typeof domain]) {
//     const assistant = await openai.beta.assistants.create({
//         instructions: `${domains[domain].system}${instructions} \n\nExamples : \n\n${formatExamples(examples, domain, translatorType)}\n\nEnd of the examples.`,
//         name,
//         model: model,
//         response_format: {
//             type: outputSchemas[translatorType]["type"] as "text" | "json_schema" | "json_object",
//             json_schema: outputSchemas[translatorType]["json_schema"]
//         }
//     });
//     return assistant.id;
// }

export async function initializeAssistants(projectId: string) {
   
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not set in the environment variables');
    }

    const projectSettings = await getProjectSettings(projectId);

    const promptsIds = projectSettings.llmConfig.prompts;
    const outputSchemaIds = projectSettings.llmConfig.outputSchema;

    // get the prompts and output schemas from the database 
    const prompts = await PromptModel.find({_id: {$in: promptsIds}});
    const outputSchemas = await OutputSchemaModel.find({ _id: { $in: outputSchemaIds } });
    
    const systemPrompt = prompts.find(prompt => prompt.type === "SYSTEM")?.text;
    const gtPrompt = prompts.find(prompt => prompt.agent === "GOAL_TRANSLATOR")?.text;
    const etPrompt = prompts.find(prompt => prompt.agent === "EXPLANATION_TRANSLATOR")?.text;
    const qtPrompt = prompts.find(prompt => prompt.agent === "QUESTION_CLASSIFIER")?.text;

    const outputFormatQT = outputSchemas.find(schema => schema.agent === "QUESTION_CLASSIFIER")?.text;
    const outputFormatET = outputSchemas.find(schema => schema.agent === "EXPLANATION_TRANSLATOR")?.text;
    const outputFormatGT = outputSchemas.find(schema => schema.agent === "GOAL_TRANSLATOR")?.text;

    // check if the prompts are valid
    if(!systemPrompt || !gtPrompt || !etPrompt || !qtPrompt){
        throw new Error('One of the prompts is missing or invalid. printing all prompts: \n\n' + prompts);
    }
    if(!outputFormatQT || !outputFormatET || !outputFormatGT){
        throw new Error('One of the output formats is missing or invalid. printing all output formats: \n\n' + outputSchemas);
    }
      
    return {
        seenByGTMessages:  [{role: "developer", content: `${systemPrompt}\n\n${gtPrompt}`}] ,
        seenByETMessages:  [{role: "developer", content: `${systemPrompt}\n\n${etPrompt}`}] ,
        seenByQTMessages:  [{role: "developer", content: `${systemPrompt}\n\n${qtPrompt}`}] ,
        outputFormatQT: outputFormatQT,
        outputFormatET: outputFormatET,
        outputFormatGT: outputFormatGT
    };
}

async function getProjectSettings(projectId: string) {
    const project = await BaseProjectModel.findById(projectId);
    if (!project) {
        throw new Error('Project not found');
    }
    return project.settings;
}


