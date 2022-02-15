import mongoose, { Document, Schema } from 'mongoose';
import { File, FileSchema } from './file';
import { PlanProperty } from './plan-properties/plan_property';
import { ExecutionSettings } from './execution_settings';


export enum ProjectType {
    general = 'GENERAL',
    demo = 'DEMO'
}

const baseOptions = {
    discriminatorKey: 'itemType',
    collection: 'projects',
  };

export interface Project extends Document{
    _id: string;
    name: string;
    user: string;
    domainFile: File;
    domainSpecification: File;
    problemFile: File;
    description: string;
    taskSchema: string;
    properties: PlanProperty[];
    settings: ExecutionSettings;
    animationSettings: string;
}

const BaseProjectSchema = new Schema({
    name: { type: String, required: true},
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    domainFile: { type: FileSchema, required: true},
    domainSpecification: { type: FileSchema, required: true},
    problemFile: { type: FileSchema, required: true},
    description: { type: String, required: true},
    taskSchema: { type: String, required: false},
    settings: { type: mongoose.Schema.Types.ObjectId, ref: 'execution-settings' , required: false},
    animationSettings: { type: String, required: false}
}, baseOptions);

export const BaseProjectModel = mongoose.model<Project>('base-project', BaseProjectSchema);

export const ProjectModel = BaseProjectModel.discriminator<Project>('general-project', new mongoose.Schema());

