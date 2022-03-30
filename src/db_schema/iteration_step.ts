import { PPDependencies, PPDependenciesSchema } from './explanations';
import { ModifiedPlanningTaskSchema } from './modified_planning_task';
import mongoose, { Document, Schema } from 'mongoose';
import { ModifiedPlanningTask } from './modified_planning_task';
import { PlanProperty } from './plan-properties/plan_property';
import { Project } from './project';

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
    notStarted
}


export interface PlanRun{
    createdAt?: Date;
    name: string;
    status: RunStatus;
    log?: string;
    result?: string;
    satPlanProperties?: PlanProperty[];
}

const PlanRunSchema = new Schema({
    name: { type: String, required: true},
    status: { type: Number, required: true},
    log: { type: String, required: false},
    result: { type: String, required: false},
    satPlanProperties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'plan-property' }],
}, { timestamps: true});


export interface RelaxationExplanationRun{
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




export interface DepExplanationRun{
    createdAt?: Date;
    name: string;
    status: RunStatus;
    hardGoals: PlanProperty[];
    softGoals: PlanProperty[];
    log: string;
    result: string;
    dependencies? : PPDependencies;
    relaxationExplanations: RelaxationExplanationRun[];
}

const DepExplanationRunSchema = new Schema({
    name: { type: String, required: true},
    status: { type: Number, required: true},
    hardGoals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'plan-property' }],
    softGoals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'plan-property' }],
    log: { type: String, required: false},
    result: { type: String, required: false},
    dependencies: PPDependenciesSchema,
    relaxationExplanations: [RelaxationExplanationRunSchema],
}, { timestamps: true});




export interface IterationStep extends Document{
    _id: string;
    name: string;
    createdAt?: Date;
    project: Project | string;
    status: StepStatus;
    hardGoals: PlanProperty[];
    softGoals: PlanProperty[];
    task: ModifiedPlanningTask;
    plan?: PlanRun;
    depExplanations: DepExplanationRun[];
    predecessorStep: IterationStep | null;
}

const IterationStepSchema = new Schema({
    name: { type: String, required: true},
    status: { type: Number, required: true},
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'base-project' },
    hardGoals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'plan-property' }],
    softGoals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'plan-property' }],
    task: ModifiedPlanningTaskSchema,
    plan: PlanRunSchema,
    depExplanations: [DepExplanationRunSchema],
    predecessorStep: { type: mongoose.Schema.Types.ObjectId, ref: 'iteration-step', required: false },
}, { timestamps: true});



export const IterationStepModel = mongoose.model<IterationStep>('iteration-step', IterationStepSchema);
// export const PlanRunModel = mongoose.model<PlanRun>('plan-run', PlanRunSchema);
// export const DepExplanationRunModel = mongoose.model<DepExplanationRun>('dep-explanation-run', DepExplanationRunSchema);
// export const RelaxationExplanationRunModel = mongoose.model<RelaxationExplanationRun>('relaxation-explanation-run', RelaxationExplanationRunSchema);
