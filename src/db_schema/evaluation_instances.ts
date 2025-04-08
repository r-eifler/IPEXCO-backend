import mongoose, { Schema } from "mongoose";
import { array, object, string, unknown, infer as zinfer } from "zod";

export const EvaluationInstanceBaseZ = object({
    name: string(),
    model: unknown(),
    actions: array(unknown()).nullish(),
    question: string(),
    explanation: string()
});

export type EvaluationInstanceBase = zinfer<typeof EvaluationInstanceBaseZ>;

export const EvaluationInstanceZ = EvaluationInstanceBaseZ.merge(object({
    _id: string(),
}));

export type EvaluationInstance = zinfer<typeof EvaluationInstanceZ>;

const EvaluationInstanceSchema = new Schema({
    name: { type: String, required: true},
    model: { type: Object, required: false},
    actions: { type: Object, required: false},
    question: { type: String, required: true},
    explanation: { type: String, required: true},
}, { timestamps: true});

export const EvaluationInstanceModel = mongoose.model<EvaluationInstance>('evaluation-instances', EvaluationInstanceSchema);
