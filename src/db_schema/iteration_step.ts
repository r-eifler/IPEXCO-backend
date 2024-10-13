import { UpdatedPlanningTaskSchema } from './updated_planning_task';
import mongoose, { Document, Schema } from 'mongoose';
import { UpdatedPlanningTask } from './updated_planning_task';
import { PlanProperty } from './plan-properties/plan_property';
import { Project } from './project';
import { Explanation, ExplanationSchema, GlobalExplanation, GlobalExplanationSchema } from './explanations';
import { PlanningTask, PlanningTaskSchema } from './planning_task';


export enum StepStatus{
    unknown,
    solvable,
    unsolvable
  }

export enum PlanRunStatus {
    pending,
    running,
    failed,
    plan_found,
    not_solvable,
}



export interface Plan{
    createdAt?: Date;
    status: PlanRunStatus;
    actions?: string;
    satisfied_properties?: string[];
}

const PlanSchema = new Schema({
    status: { type: Number, required: true},
    plan: { type: String, required: false},
    satisfied_properties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'plan-property' }],
    actions: { type: String, required: false},
}, { timestamps: true}); 



export interface IterationStep extends Document{
    _id: string;
    name: string;
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
