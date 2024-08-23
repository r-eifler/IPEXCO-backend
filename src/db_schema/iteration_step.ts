import { UpdatedPlanningTaskSchema } from './updated_planning_task';
import mongoose, { Document, Schema } from 'mongoose';
import { UpdatedPlanningTask } from './updated_planning_task';
import { PlanProperty } from './plan-properties/plan_property';
import { Project } from './project';
import { Explanation, ExplanationSchema } from './explanations';


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
    not_solvable
}



export interface Plan{
    createdAt?: Date;
    status: PlanRunStatus;
    plan?: string;
    satisfied_properties?: string[];
}

const PlanSchema = new Schema({
    status: { type: Number, required: true},
    plan: { type: String, required: false},
    satPlanProperties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'plan-property' }],
}, { timestamps: true});



export interface IterationStep extends Document{
    _id: string;
    name: string;
    createdAt?: Date;
    project: Project | string;
    status: StepStatus;
    hardGoals: PlanProperty[];
    softGoals: PlanProperty[];
    task: UpdatedPlanningTask;
    plan?: Plan;
    explanation?: Explanation;
    predecessorStep: IterationStep | null;
}

const IterationStepSchema = new Schema({
    name: { type: String, required: true},
    status: { type: Number, required: true},
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'base-project' },
    hardGoals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'plan-property' }],
    softGoals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'plan-property' }],
    task: UpdatedPlanningTaskSchema,
    plan: PlanSchema,
    explanations: [ExplanationSchema],
    predecessorStep: { type: mongoose.Schema.Types.ObjectId, ref: 'iteration-step', required: false },
}, { timestamps: true});



export const IterationStepModel = mongoose.model<IterationStep>('iteration-step', IterationStepSchema);
