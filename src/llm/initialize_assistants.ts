import OpenAI from "openai";
import belugaPrompts from "./data/prompts/beluga/prompts.json";
import blocksworldPrompts from "./data/prompts/blocksworld/prompts.json";
import blocksworldTemplates from "./data/prompts/blocksworld/templates.json";
import transportPrompts from "./data/prompts/transport/prompts.json";
import transportTemplates from "./data/prompts/transport/templates.json";
import belugaTemplates from "./data/prompts/beluga/templates.json";
import fs from 'fs/promises';
import path from 'path';
import { openai_client } from "./openai_client";
export type OpenAIModelName = "gpt-4o-mini" | "gpt-4o" ;

const domains = {
    beluga: belugaPrompts,
    blocksworld: blocksworldPrompts,
    transport: transportPrompts
}

const templates = {
    blocksworld: blocksworldTemplates,
    beluga: belugaTemplates,
    transport: transportTemplates
}

const domain = "transport";



// function formatExamples(examples: any[]): string {
//     return examples.map((example, index) => {
//         const formattedExample = Object.entries(example)
//             .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
//             .join('\n');
//         return `Example ${index + 1}:\n${formattedExample}\n`;
//     }).join('\n');
// }
function formatExamples(examples: any[], translatorType: keyof typeof templates[typeof domain]): string {
    const template = templates[domain][translatorType];
    
    return examples.map((example, index) => {
        let formattedExample = template;
        
        // Replace each placeholder in the template with its corresponding value
        for (const [key, value] of Object.entries(example)) {
            const placeholder = `{${key}}`;
            // Remove quotes from stringified value if it's a string
            const stringifiedValue = typeof value === 'string' 
                ? value 
                : JSON.stringify(value);
            formattedExample = formattedExample.replace(placeholder, stringifiedValue);
        }
        
        return `\n${formattedExample}\n`;
    }).join('\n');
}


async function createAssistant(name: string, instructions: string, examples: any[], openai: OpenAI, model: OpenAIModelName, translatorType: keyof typeof templates[typeof domain]) {
    const assistant = await openai.beta.assistants.create({
        instructions: `${domains[domain].system}${instructions} \n\nExamples : \n\n${formatExamples(examples, translatorType)}\n\nEnd of the examples.`,
        name,
        model: model,
    });
    return assistant.id;
}

export async function initializeAssistants(model: OpenAIModelName) {
    // This function initializes three OpenAI assistants:
    // 1. Goal Translator: Translates user goals into LTLf formulas
    // 2. Question Translator: Interprets user questions and maps them to predefined question types
    // 3. Explanation Translator: Provides explanations based on conflicts and achieved/unachieved goals
    //
    // Each assistant is created with specific instructions from the belugaPrompts object,
    // which contains system prompts, translator-specific prompts, and examples.
    //
    // The function then sets environment variables with the created assistant IDs
    // and returns an object containing these IDs.

    // The assistants don't store any data so they can be reused instead of recreating them if we don't change prompts.

    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not set in the environment variables');
    }
    const openai = openai_client;


    const assistants = {
        goalTranslator: await createAssistant("Goal Translator (transport)", transportPrompts.goal_translator, transportPrompts.gt_examples, openai, model, "goal_translator"),
        questionTranslator: await createAssistant("Question Translator (transport)", transportPrompts.question_translator, transportPrompts.qt_examples, openai, model, "question_translator"),
        explanationTranslator: await createAssistant("Explanation Translator (transport)", transportPrompts.explanation_translator, transportPrompts.et_examples, openai, model, "explanation_translator"),
    };

    // Read existing .env file
    const envPath = path.join(process.cwd(), '.env');
    let envContent = await fs.readFile(envPath, 'utf-8');

    // Replace or add new ASSISTANT_ID_* variables
    for (const [key, value] of Object.entries(assistants)) {
        const envKey = `ASSISTANT_ID_${key.toUpperCase()}`;
        const regex = new RegExp(`^${envKey}=.*$`, 'm');
        if (envContent.match(regex)) {
            // Replace existing variable
            envContent = envContent.replace(regex, `${envKey}=${value}`);
        } else {
            // Add new variable
            envContent += `\n${envKey}=${value}`;
        }
    }

    // Write updated content back to .env file
    await fs.writeFile(envPath, envContent);

    return assistants;
}


// TESTING 

// initializeAssistants().then(console.log).catch(console.error);

// // initializeAssistants();
// // load .env file
// require('dotenv').config();
// // Print the environment variables with names starting with ASSISTANT_ID_ to check if they are set correctly
// for (const [key, value] of Object.entries(process.env)) {
//     if (key.startsWith("ASSISTANT_ID_")) {
//         console.log(`${key}: ${value}`);
//     }
//     else {
//         console.log(`${key}: ${value}`);
//     }
// }
