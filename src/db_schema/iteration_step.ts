import mongoose, { Document, Schema } from 'mongoose';
import { Explanation, ExplanationSchema, GlobalExplanation, GlobalExplanationSchema } from './explanations';
import { PlanningTask, PlanningTaskSchema } from './planning_model';
import { User } from './user';
import { Action } from './plan-properties/action_set';


export enum StepStatus{
    unknown,
    solvable,
    unsolvable,
  }

export enum PlanRunStatus {
    pending,
    running,
    failed,
    plan_found,
    not_solvable,
    canceled,
    plan_found_not_checked
}

export interface Plan{
    createdAt?: Date;
    status: PlanRunStatus;
    actions?: Action[];
    satisfied_properties?: string[];
}

const PlanSchema = new Schema({
    status: { type: Number, required: true},
    plan: { type: String, required: false},
    satisfied_properties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'plan-property' }],
    actions: { type: Object, required: false},
}, { timestamps: true}); 



export interface IterationStep extends Document{
    _id: string;
    name: string;
    user: User;
    createdAt?: Date;
    project: string;
    status: StepStatus;
    hardGoals: string[];
    softGoals: string[];
    task: PlanningTask;
    plan?: Plan;
    globalExplanation: GlobalExplanation;
    explanations?: Explanation[];
    predecessorStep: string | null;
}

const IterationStepSchema = new Schema({
    name: { type: String, required: true},
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: Number, required: true},
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'base-project' },
    hardGoals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'plan-property' }],
    softGoals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'plan-property' }],
    task: PlanningTaskSchema,
    plan: PlanSchema,
    globalExplanation: GlobalExplanationSchema,
    explanations: [ExplanationSchema],
    predecessorStep: { type: mongoose.Schema.Types.ObjectId, ref: 'iteration-step', required: false },
}, { timestamps: true});



export const IterationStepModel = mongoose.model<IterationStep>('iteration-step', IterationStepSchema);
