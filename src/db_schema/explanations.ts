import mongoose, { Schema } from "mongoose";
import { PlanProperty } from "./plan-properties/plan_property";

export enum QuestionType {
    WHY_PLAN = 'WHY_PLAN', // Why is the task unsolvable?
    HOW_PLAN = 'HOW_PLAN', // How can I make the task solvable?
    WHY_NOT_PROPERTY = 'WHY_NOT_PROPERTY',// Why are Q not satisfied?
    WHAT_IF_PROPERTY = 'WHAT_IF_PROPERTY', // What happens if we enforce Q?
    CAN_PROPERTY = 'CAN_PROPERTY', // Can Q be satisfied?
    HOW_PROPERTY = 'HOW_PROPERTY', // How can Q be satisfied?
   
  }


export type Question = {
    iterationStepId: string,
    propertyId?: string,
    questionType: QuestionType,
}; 
  

export const QuestionSchema = new Schema({
    iterationStepId: { type: String, required: true},
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'plan-property' },
    questionType: { type: Number, required: true},
});


export enum AnswerType {
    MUS,
    MCS
}

interface PropertyList{
    elements: string[]
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


export interface GlobalExplanation{
    createdAt?: Date;
    MUGS?: string;
    MGCS?: string;
    status: ExplanationRunStatus;
}

export const GlobalExplanationSchema = new Schema({
    MUGS: { type: String },
    MGCS: { type: String },
    status: { type: Number, required: true}
}, { timestamps: true});
