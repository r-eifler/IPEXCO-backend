import mongoose, { Document, Schema } from "mongoose";



export interface visibleLLMMessage{
    role: 'sender' | 'receiver',
    content: string,
    iterationStepId: string | null
}
  
export interface LLMMessage{
    role: 'sender' | 'receiver' | 'developer',
    content: string,
}


export interface OutputFormat{
    structured: boolean,
    schema: string | null
}

export const OutputFormatSchema = new Schema<OutputFormat>({
    structured: { type: Boolean, required: true},
    schema: { type: String, required: false},
}, { timestamps: true }); 


export const visibleLLMMessageSchema = new Schema<visibleLLMMessage>({
    role: { type: String, required: true},
    content: { type: String, required: true},
    iterationStepId: { type: mongoose.Schema.Types.ObjectId, ref: 'iteration-step' },
}, { timestamps: true }); 

export const LLMMessageSchema = new Schema<LLMMessage>({
    role: { type: String, required: true},
    content: { type: String, required: true},
}, { timestamps: true }); 

export interface LLMContext extends Document {
    project: string | null;
    user: string | null;
    iterationStepId: string | null;
    visibleMessages: visibleLLMMessage[];
    visiblePPCreationMessages: visibleLLMMessage[];
    seenByGTMessages: LLMMessage[];
    seenByETMessages: LLMMessage[];
    seenByQTMessages: LLMMessage[];
    outputFormatQT: OutputFormat;
    outputFormatET: OutputFormat;
    outputFormatGT: OutputFormat;
    settings: any;
}

export const LLMContextSchema = new Schema({
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'base-project' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    iterationStepId: { type: mongoose.Schema.Types.ObjectId, ref: 'iteration-step' },
    visibleMessages: [visibleLLMMessageSchema],
    visiblePPCreationMessages: [visibleLLMMessageSchema],
    seenByGTMessages: [LLMMessageSchema],
    seenByETMessages: [LLMMessageSchema],
    seenByQTMessages: [LLMMessageSchema],
    outputFormatQT: OutputFormatSchema,
    outputFormatET: OutputFormatSchema,
    outputFormatGT: OutputFormatSchema,
    settings: { type: Object, required: true},
}, { timestamps: true}); 


export const LLMContextModel = mongoose.model<LLMContext>('llm-context', LLMContextSchema);
