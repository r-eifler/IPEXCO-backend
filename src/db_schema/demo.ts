import { DepExplanationRun, DepExplanationRunSchema, RelaxationExplanationRun, RelaxationExplanationRunSchema, RunStatus } from './iteration_step';
import { BaseProjectModel, Project } from './project';
import { Schema } from 'mongoose';
import { FactUpdate, FactUpdateSchema } from './relaxations';


export interface DemoExplanation{
    initUpdates: FactUpdate[];
    relaxationExplanations: RelaxationExplanationRun[];
}

const DemoExplanationSchema = new Schema({
    initUpdates: [FactUpdateSchema],
    relaxationExplanations: [RelaxationExplanationRunSchema],
});

export interface Demo  extends Project{
    status: RunStatus;
    completion: number;
    summaryImage: string | null;
    introduction: string;
    taskInfo?: string;
    conflictExplanation: DepExplanationRun;
    explanations: DemoExplanation[];
    maxUtility: string;
}

const DemoSchema = new Schema({
    status: { type: Number, required: true},
    completion: { type: Number, required: true},
    summaryImage: { type: String, required: false},
    introduction: { type: String, required: false},
    taskInfo: { type: String, required: false},
    conflictExplanation: DepExplanationRunSchema,
    explanations: [DemoExplanationSchema],
    maxUtility: { type: String, required: false},
});

export const DemoModel = BaseProjectModel.discriminator<Demo>('demo-project', DemoSchema);

