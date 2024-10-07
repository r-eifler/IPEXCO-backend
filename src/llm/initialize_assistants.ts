import OpenAI from "openai";
import * as belugaPrompts from "../../data/prompts/beluga/prompts.json";
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set in the environment variables');
}
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type OpenAIModelName = "gpt-4o-mini" | "gpt-4o";

const MODEL_NAME: OpenAIModelName = process.env.OPENAI_MODEL_NAME as OpenAIModelName || "gpt-4o-mini";

function formatExamples(examples: any[]): string {
    return examples.map((example, index) => {
        const formattedExample = Object.entries(example)
            .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
            .join('\n');
        return `Example ${index + 1}:\n${formattedExample}\n`;
    }).join('\n');
}

async function initializeAssistants() {
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

    const assistants = {
        goalTranslator: await createAssistant("Goal Translator (Beluga)", belugaPrompts.goal_translator, belugaPrompts.gt_examples),
        questionTranslator: await createAssistant("Question Translator (Beluga)", belugaPrompts.question_translator, belugaPrompts.qt_examples),
        explanationTranslator: await createAssistant("Explanation Translator (Beluga)", belugaPrompts.explanation_translator, belugaPrompts.et_examples),
    };

    // Write assistant IDs to .env file
    const envContent = Object.entries(assistants)
        .map(([key, value]) => `ASSISTANT_ID_${key.toUpperCase()}=${value}`)
        .join('\n');

    await fs.appendFile(path.join(process.cwd(), '.env'), `\n${envContent}\n`);

    return assistants;
}

async function createAssistant(name: string, instructions: string, examples: any[]) {
    const assistant = await openai.beta.assistants.create({
        instructions: `${belugaPrompts.system}${instructions}${formatExamples(examples)}`,
        name,
        model: MODEL_NAME,
    });
    return assistant.id;
}

initializeAssistants().then(console.log).catch(console.error);

// initializeAssistants();
// load .env file
require('dotenv').config();
// Print the environment variables with names starting with ASSISTANT_ID_ to check if they are set correctly
for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith("ASSISTANT_ID_")) {
        console.log(`${key}: ${value}`);
    }
    else {
        console.log(`${key}: ${value}`);
    }
}