import { PPDependencies, PPDependenciesSchema, RelaxationExplanationNode, RelaxationExplanationNodeSchema } from './explanations';
import { ModifiedPlanningTaskSchema } from './modified_planning_task';
import mongoose, { Document, Schema } from 'mongoose';
import { ModifiedPlanningTask } from './modified_planning_task';
import { PlanProperty } from './plan-properties/plan_property';
import { Project } from './project';
import { PlanningTaskRelaxationSpace } from './relaxations';

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
    satPlanProperties?: string[];
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
    relaxationSpace: PlanningTaskRelaxationSpace;
    log?: string;
    result?: string;
    dependencies? : RelaxationExplanationNode[];
}

export const RelaxationExplanationRunSchema = new Schema({
    name: { type: String, required: true},
    status: { type: Number, required: true},
    relaxationSpace: [{ type: mongoose.Schema.Types.ObjectId, ref: 'planning-task-relaxation-space' }],
    log: { type: String, required: false},
    result: { type: String, required: false},
    dependencies: [RelaxationExplanationNodeSchema],
}, { timestamps: true});




export interface DepExplanationRun{
    _id: string;
    createdAt?: Date;
    name: string;
    status: RunStatus;
    hardGoals: PlanProperty[];
    softGoals: PlanProperty[];
    log: string;
    result: string;
    dependencies? : PPDependencies;
}

const DepExplanationRunSchema = new Schema({
    name: { type: String, required: true},
    status: { type: Number, required: true},
    hardGoals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'plan-property' }],
    softGoals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'plan-property' }],
    log: { type: String, required: false},
    result: { type: String, required: false},
    dependencies: PPDependenciesSchema,
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
    depExplanation: DepExplanationRun;
    relaxationExplanations: RelaxationExplanationRun[];
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
    depExplanation: DepExplanationRunSchema,
    relaxationExplanations: [RelaxationExplanationRunSchema],
    predecessorStep: { type: mongoose.Schema.Types.ObjectId, ref: 'iteration-step', required: false },
}, { timestamps: true});



export const IterationStepModel = mongoose.model<IterationStep>('iteration-step', IterationStepSchema);
// export const PlanRunModel = mongoose.model<PlanRun>('plan-run', PlanRunSchema);
// export const DepExplanationRunModel = mongoose.model<DepExplanationRun>('dep-explanation-run', DepExplanationRunSchema);
// export const RelaxationExplanationRunModel = mongoose.model<RelaxationExplanationRun>('relaxation-explanation-run', RelaxationExplanationRunSchema);
