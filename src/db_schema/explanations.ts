import mongoose, { Schema } from "mongoose";
import { PlanProperty } from "./plan-properties/plan_property";

export enum QuestionType {
    // TODO
    why_not,
    how
}

export interface Question{
    input: string;
    type: QuestionType
    parameters: PlanProperty[];
}

export const QuestionSchema = new Schema({
    input: { type: String, required: true},
    type: { type: Number, required: true},
    parameters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'plan-property' }]
});


export enum AnswerType {
    MUS,
    MCS
}

interface PropertyList{
    elements: PlanProperty[]
}

export const PropertyListSchema = new Schema({
    elements: [{ type: mongoose.Schema.Types.ObjectId, ref: 'plan-property' }]
});


export interface Answer{
    type: AnswerType
    all_possibilities: boolean;
    computed: PropertyList[];
    selected: PropertyList[];
    output: string;
}


export const AnswerSchema = new Schema({
    type: { type: Number, required: true},
    all_possibilities: { type: Boolean, required: true},
    computed: [PropertyListSchema],
    selected: [PropertyListSchema],
    output: { type: String, required: true},
});



export enum ExplanationRunStatus {
    pending,
    running,
    failed,
    finished
}

export interface Explanation{
    createdAt?: Date;
    question: Question;
    answer?: Answer;
    status: ExplanationRunStatus;
}

export const ExplanationSchema = new Schema({
    question: QuestionSchema,
    answer: AnswerSchema,
    status: { type: Number, required: true}
}, { timestamps: true});