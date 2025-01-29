import mongoose, { Schema } from "mongoose";

enum PromptType {
    SYSTEM = 'SYSTEM',
    EXPLANATION_TRANSLATOR = 'EXPLANATION_TRANSLATOR',
    EXPLANATION_TRANSLATOR_TEMPLATE = 'EXPLANATION_TRANSLATOR_TEMPLATE',
    GOAL_TRANSLATOR = 'GOAL_TRANSLATOR',
    GOAL_TRANSLATOR_TEMPLATE = 'GOAL_TRANSLATOR_TEMPLATE',
    QUESTION_TRANSLATOR = 'QUESTION_TRANSLATOR',
    QUESTION_TRANSLATOR_TEMPLATE = 'QUESTION_TRANSLATOR_TEMPLATE',
}

export interface Prompt {
    type: PromptType,
    domain: string | null,
    explainer: string | null,
    text: string,
}

const PromptSchema = new Schema({
    type: { type: String },
    domain: { type: mongoose.Schema.Types.ObjectId, ref: 'domain-specification', required: false},
    explainer: { type: mongoose.Schema.Types.ObjectId, ref: 'explainer', required: false },
    text: { text: String },
}); 

export const PromptModel = mongoose.model<Prompt>('prompt', PromptSchema);