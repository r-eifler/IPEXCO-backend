import mongoose, { Schema } from "mongoose";

enum AgentType {
    EXPLANATION_TRANSLATOR = 'EXPLANATION_TRANSLATOR',
    GOAL_TRANSLATOR = 'GOAL_TRANSLATOR',
    QUESTION_CLASSIFIER = 'QUESTION_CLASSIFIER',
}

enum PromptType {
    SYSTEM = 'SYSTEM',
    INSTRUCTION_AND_EXAMPLES  = 'INSTRUCTION_AND_EXAMPLES',
    INPUT_DATA = 'INPUT_DATA'
}

export interface Prompt {
    _id?: string,
    name: string,
    agent: AgentType,
    type: PromptType,
    domain: string | null,
    explainer: string | null,
    text: string,
}

const PromptSchema = new Schema({
    name: { type: String, required: true },
    agent: { type: String },
    type: { type: String },
    domain: { type: mongoose.Schema.Types.ObjectId, ref: 'domain-specification', required: false},
    explainer: { type: mongoose.Schema.Types.ObjectId, ref: 'explainer', required: false },
    text: { type: String },
}); 

export const PromptModel = mongoose.model<Prompt>('prompt', PromptSchema);


export interface OutputSchema {
    _id?: string,
    name: string,
    agent: AgentType,
    domain: string | null,
    explainer: string | null,
    text: string,
}

const OutputSchemaSchema = new Schema({
    name: { type: String, required: true },
    agent: { type: String },
    domain: { type: mongoose.Schema.Types.ObjectId, ref: 'domain-specification', required: false},
    explainer: { type: mongoose.Schema.Types.ObjectId, ref: 'explainer', required: false },
    text: { type: String },
}); 

export const OutputSchemaModel = mongoose.model<OutputSchema>('output-schema', OutputSchemaSchema);
