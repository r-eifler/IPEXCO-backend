import { RunStatus } from './iteration_step';
import { BaseProjectModel, Project } from './project';
import { Schema } from 'mongoose';

export interface Demo  extends Project{
    status: RunStatus;
    summaryImage: string | null;
    introduction: string;
    taskInfo?: string;
    explanationHierarchy: string;
    maxUtility: string;
    public: boolean;
}

const DemoSchema = new Schema({
    status: { type: Number, required: true},
    summaryImage: { type: String, required: false},
    introduction: { type: String, required: false},
    taskInfo: { type: String, required: false},
    explanationHierarchy: { type: String, required: false},
    maxUtility: { type: String, required: false},
    public: { type: Boolean, required: true}
});

export const DemoModel = BaseProjectModel.discriminator<Demo>('demo-project', DemoSchema);

