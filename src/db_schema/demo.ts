import { BaseProjectModel, Project } from './project';
import mongoose, { Schema } from 'mongoose';
import { GlobalExplanation, GlobalExplanationSchema } from './explanations';

export enum DemoRunStatus {
    pending,
    running,
    failed,
    finished
}


export interface Demo  extends Project{
    projectId?: string,
    status: DemoRunStatus;
    summaryImage: string | null;
    domainInfo: string;
    instanceInfo: string;
    globalExplanation: GlobalExplanation,
    maxUtility: string;
}

const DemoSchema = new Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'base-project' },
    status: { type: Number, required: true},
    summaryImage: { type: String, required: false},
    introduction: { type: String, required: false},
    domainInfo: { type: String, required: false},
    instanceInfo: { type: String, required: false},
    globalExplanation: {type: GlobalExplanationSchema, required: false},
    maxUtility: { type: String, required: false},
});

export const DemoModel = BaseProjectModel.discriminator<Demo>('demo-project', DemoSchema);

