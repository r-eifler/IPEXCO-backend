import mongoose, { Schema } from "mongoose";
import { array, date, nativeEnum, object, optional, string, infer as zinfer } from "zod";

export enum QuestionType {
    WHY_PLAN = 'US-WHY', // Why is the task unsolvable?
    HOW_PLAN = 'US-HOW', // How can I make the task solvable?
    WHY_NOT_PROPERTY = 'S-WHY-NOT',// Why are Q not satisfied?
    WHAT_IF_PROPERTY = 'S-WHAT-IF', // What happens if we enforce Q?
    CAN_PROPERTY = 'S-CAN', // Can Q be satisfied?
    HOW_PROPERTY = 'S-HOW', // How can Q be satisfied?
    DIRECT_USER = 'DIRECT-USER', // Direct user question
    DIRECT_ET = 'DIRECT-ET', // Direct explanation translator question
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
    PENDING = "PENDING",
    RUNNING = "RUNNING",
    FAILED = "FAILED",
    FINISHED = "FINISHED"
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
    status: { type: String, required: true}
}, { timestamps: true});

  
export const ExplanationRunStatusZ = nativeEnum(ExplanationRunStatus);

export const GlobalExplanationZ = object({
	createdAt: date(),
	MUGS: optional(array(array(string()))),
	MGCS: optional(array(array(string()))),
	status: ExplanationRunStatusZ
});

export type GlobalExplanation = zinfer<typeof GlobalExplanationZ>;

export const DefinedGlobalExplanationZ = object({
	createdAt: date(),
	MUGS: array(array(string())),
	MGCS: array(array(string())),
	status: ExplanationRunStatusZ
});

export type DefinedGlobalExplanation = zinfer<typeof DefinedGlobalExplanationZ>;

export const GlobalExplanationSchema = new Schema({
    createdAt: { type: Date },
    MUGS: { type: Object },
    MGCS: { type: Object },
    status: { type: String, required: true}
}, { timestamps: true});
