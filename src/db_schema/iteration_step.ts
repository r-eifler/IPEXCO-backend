import mongoose, { Document, Schema } from 'mongoose';
import { PlanProperty } from './plan-properties/plan_property';
import { Project } from './project';
import { ModifiedPlanningTask} from './task_modification';

export enum StepStatus{
    unknown,
    solvable,
    unsolvable
  }

export enum RunStatus {
    pending,
    running,
    failed,
    finished,
    noSolution,
}

export interface IterationStep extends Document{
    _id: string;
    name: string;
    createdAt?: Date;
    project: Project | string;
    status: StepStatus;
    hardGoals: PlanProperty[];
    softGoals: PlanProperty[];
    task: ModifiedPlanningTask;
    plan: PlanRun | null;
    depExplanations: DepExplanationRun[];
    predecessorStep: IterationStep | null;
}

const IterationStepSchema = new Schema({
    name: { type: String, required: true},
    status: { type: Number, required: true},
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'base-project' },
    hardGoals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'plan-property' }],
    softGoals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'plan-property' }],
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'modified-planning-task' },
    plan: { type: mongoose.Schema.Types.ObjectId, ref: 'plan-run' },
    depExplanations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'dep-explanation-run' }],
    predecessorStep: { type: mongoose.Schema.Types.ObjectId, ref: 'iteration-step', required: false },
}, { timestamps: true});


export interface PlanRun extends Document{
    createdAt?: Date;
    name: string;
    status: RunStatus;
    log: string;
    result: string;
    satPlanProperties: PlanProperty[];
}

const PlanRunSchema = new Schema({
    name: { type: String, required: true},
    status: { type: Number, required: true},
    log: { type: String, required: false},
    result: { type: String, required: false},
    satPlanProperties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'plan-property' }],
}, { timestamps: true});


export interface DepExplanationRun extends Document{
    _id: string;
    createdAt?: Date;
    name: string;
    status: RunStatus;
    hardGoals: PlanProperty[];
    softGoals: PlanProperty[];
    log: string;
    result: string;
    relaxationExplanations: RelaxationExplanationRun[];
}

const DepExplanationRunSchema = new Schema({
    name: { type: String, required: true},
    status: { type: Number, required: true},
    hardGoals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'plan-property' }],
    softGoals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'plan-property' }],
    log: { type: String, required: false},
    result: { type: String, required: false},
    relaxationExplanations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'relaxation-explanation-run' }],
}, { timestamps: true});


export interface RelaxationExplanationRun extends Document{
    _id: string;
    createdAt?: Date;
    name: string;
    status: RunStatus;
    dependency: PlanProperty[];
    log: string;
    result: string;
}

const RelaxationExplanationRunSchema = new Schema({
    name: { type: String, required: true},
    status: { type: Number, required: true},
    dependency: [{ type: mongoose.Schema.Types.ObjectId, ref: 'plan-property' }],
    log: { type: String, required: false},
    result: { type: String, required: false},
}, { timestamps: true});


export const IterationStepModel = mongoose.model<IterationStep>('iteration-step', IterationStepSchema);
export const PlanRunModel = mongoose.model<PlanRun>('plan-run', PlanRunSchema);
export const DepExplanationRunModel = mongoose.model<DepExplanationRun>('dep-explanation-run', DepExplanationRunSchema);
export const RelaxationExplanationRunModel = mongoose.model<RelaxationExplanationRun>('relaxation-explanation-run', RelaxationExplanationRunSchema);
