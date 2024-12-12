import mongoose, { Document, Schema } from "mongoose";



export interface visibleLLMMessage{
    role: 'sender' | 'receiver',
    content: string,
    iterationStepId: string | null
}
  
export interface LLMMessage{
    role: 'sender' | 'receiver',
    content: string,
}



export const visibleLLMMessageSchema = new Schema<visibleLLMMessage>({
    role: { type: String, required: true},
    content: { type: String, required: true},
    iterationStepId: { type: mongoose.Schema.Types.ObjectId, ref: 'iteration-step' },
}, { timestamps: true }); 

const LLMMessageSchema = new Schema<LLMMessage>({
    role: { type: String, required: true},
    content: { type: String, required: true},
}, { timestamps: true }); 

export interface LLMContext extends Document {
    assistantIdGT: string;
    assistantIdQT: string;
    assistantIdET: string;
    threadIdQT: string;
    threadIdGT: string;
    threadIdET: string;
    visibleMessages: visibleLLMMessage[];
    visiblePPCreationMessages: visibleLLMMessage[];
    seenByGTMessages: LLMMessage[];
    seenByETMessages: LLMMessage[];
    seenByQTMessages: LLMMessage[];
    project: string | null;
    user: string | null;
}

export const LLMContextSchema = new Schema({
    assistantIdGT: { type: String, required: true},
    assistantIdQT: { type: String, required: true},
    assistantIdET: { type: String, required: true},
    threadIdQT: { type: String, required: true},
    threadIdGT: { type: String, required: true},
    threadIdET: { type: String, required: true},
    visibleMessages: [visibleLLMMessageSchema],
    visiblePPCreationMessages: [visibleLLMMessageSchema],
    seenByGTMessages: [LLMMessageSchema],
    seenByETMessages: [LLMMessageSchema],
    seenByQTMessages: [LLMMessageSchema],
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'base-project' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
}, { timestamps: true}); 


export const LLMContextModel = mongoose.model<LLMContext>('llm-context', LLMContextSchema);
