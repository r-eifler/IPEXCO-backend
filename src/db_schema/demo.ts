import { BaseProjectModel, Project } from './project';
import { Schema } from 'mongoose';

export enum DemoStatus{
    pending,
    running,
    failed,
    finished
  }


export interface Demo  extends Project{
    status: DemoStatus;
    completion: number;
    summaryImage: string | null;
    introduction: string;
    taskInfo?: string;
    explanations: string;
    maxUtility: string;
}

const DemoSchema = new Schema({
    status: { type: Number, required: true},
    completion: { type: Number, required: true},
    summaryImage: { type: String, required: false},
    introduction: { type: String, required: false},
    taskInfo: { type: String, required: false},
    explanations: { type: String, required: false},
    maxUtility: { type: String, required: false},
});

export const DemoModel = BaseProjectModel.discriminator<Demo>('demo-project', DemoSchema);

