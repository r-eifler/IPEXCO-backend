import mongoose, { Schema } from "mongoose";
import { nativeEnum, nullable, object, string, infer as zinfer } from "zod";

enum AgentType {
    EXPLANATION_TRANSLATOR = 'EXPLANATION_TRANSLATOR',
    GOAL_TRANSLATOR = 'GOAL_TRANSLATOR',
    QUESTION_CLASSIFIER = 'QUESTION_CLASSIFIER',
    QUESTION_SUGGESTER = 'QUESTION_SUGGESTER',
    NONE = 'NONE'
}

enum PromptType {
    SYSTEM = 'SYSTEM',
    INSTRUCTION_AND_EXAMPLES  = 'INSTRUCTION_AND_EXAMPLES',
    INPUT_DATA = 'INPUT_DATA',
    NONE = 'NONE'
}

const AgentTypeZ = nativeEnum(AgentType);
const PromptTypeZ = nativeEnum(PromptType);

export const PromptBaseZ = object({
    name: string(),
    agent: AgentTypeZ,
    type: PromptTypeZ,
    domain: nullable(string()),
    explainer: nullable(string()),
    text: string(),
});

export type PromptBase = zinfer<typeof PromptBaseZ>;

export const PromptZ = PromptBaseZ.merge(
    object({
        _id: string()
    })
);

export type Prompt = zinfer<typeof PromptZ>;

const PromptSchema = new Schema({
    name: { type: String, required: true },
    agent: { type: String },
    type: { type: String },
    domain: { type: mongoose.Schema.Types.ObjectId, ref: 'domain-specification', required: false},
    explainer: { type: mongoose.Schema.Types.ObjectId, ref: 'explainer', required: false },
    text: { type: String, required: false},
}); 

export const PromptModel = mongoose.model<Prompt>('prompt', PromptSchema);


export const OutputSchemaBaseZ = object({
    name: string(),
    agent: AgentTypeZ,
    domain: nullable(string()),
    explainer: nullable(string()),
    text: string(),
});

export type OutputSchemaBase = zinfer<typeof OutputSchemaBaseZ>;

export const OutputSchemaZ = OutputSchemaBaseZ.merge(
    object({
        _id: string(),
    })
);

export type OutputSchema = zinfer<typeof OutputSchemaZ>;


const OutputSchemaSchema = new Schema({
    name: { type: String, required: true },
    agent: { type: String },
    domain: { type: mongoose.Schema.Types.ObjectId, ref: 'domain-specification', required: false},
    explainer: { type: mongoose.Schema.Types.ObjectId, ref: 'explainer', required: false },
    text: { type: String },
}); 

export const OutputSchemaModel = mongoose.model<OutputSchema>('output-schema', OutputSchemaSchema);
