import OpenAI from "openai";
import belugaPrompts from "./data/prompts/beluga/prompts.json";
import blocksworldPrompts from "./data/prompts/blocksworld/prompts.json";
import fs from 'fs/promises';
import path from 'path';
import { openai_client } from "./openai_client";
export type OpenAIModelName = "gpt-4o-mini" | "gpt-4o" ;

const domains = {
    beluga: belugaPrompts,
    blocksworld: blocksworldPrompts
}
const domain = "blocksworld";



function formatExamples(examples: any[]): string {
    return examples.map((example, index) => {
        const formattedExample = Object.entries(example)
            .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
            .join('\n');
        return `Example ${index + 1}:\n${formattedExample}\n`;
    }).join('\n');
}

async function createAssistant(name: string, instructions: string, examples: any[], openai: OpenAI, model: OpenAIModelName) {
    const assistant = await openai.beta.assistants.create({
        instructions: `${domains[domain].system}${instructions} \n\nExamples : \n\n{${formatExamples(examples)}}\n\nEnd of the examples.`,
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
        goalTranslator: await createAssistant("Goal Translator (blocksworld)", blocksworldPrompts.goal_translator, blocksworldPrompts.gt_examples, openai, model),
        questionTranslator: await createAssistant("Question Translator (blocksworld)", blocksworldPrompts.question_translator, blocksworldPrompts.qt_examples, openai, model),
        explanationTranslator: await createAssistant("Explanation Translator (blocksworld)", blocksworldPrompts.explanation_translator, blocksworldPrompts.et_examples, openai, model),
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