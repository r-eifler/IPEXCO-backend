import mongoose, { Document, Schema } from 'mongoose';
import { LLMMessage, LLMMessageSchema } from '../db_schema/llm-context';


export interface LLMRequestLog extends Document {
    requestType: 'QT' | 'GT' | 'ET' | 'GENERIC'; // Question Translation, Goal Translation, Explanation Translation, or Generic
    input: string;
    previousMessagesCount: number;
    previousMessages: LLMMessage[];
    outputFormat: {
        structured: boolean;
        schema?: string;
    };
    settings: {
        model?: string;
        temperature?: number;
        maxCompletionTokens?: number;
    };
    response: {
        content?: string;
        finishReason?: string;
        usage?: {
            promptTokens?: number;
            completionTokens?: number;
            totalTokens?: number;
        };
    };
    processingTimeMs: number;
    success: boolean;
    error?: string;
    project?: string;
    user?: string;
    iterationStepId?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const LLMRequestLogSchema = new Schema({
    requestType: { type: String, required: true, enum: ['QT', 'GT', 'ET', 'GENERIC'] },
    input: { type: String, required: true },
    previousMessagesCount: { type: Number, required: true },
    previousMessages: { type: [LLMMessageSchema], required: false },
    outputFormat: {
        structured: { type: Boolean, required: true },
        schema: { type: String, required: false }
    },
    settings: {
        model: { type: String, required: false },
        temperature: { type: Number, required: false },
        maxCompletionTokens: { type: Number, required: false }
    },
    response: {
        content: { type: String, required: false },
        finishReason: { type: String, required: false },
        usage: {
            promptTokens: { type: Number, required: false },
            completionTokens: { type: Number, required: false },
            totalTokens: { type: Number, required: false }
        }
    },
    processingTimeMs: { type: Number, required: true },
    success: { type: Boolean, required: true },
    error: { type: String, required: false },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'base-project', required: false },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    iterationStepId: { type: mongoose.Schema.Types.ObjectId, ref: 'iteration-step', required: false }
}, { timestamps: true });

export const LLMRequestLogModel = mongoose.model<LLMRequestLog>('llm-request-log', LLMRequestLogSchema);