import { TaskModification } from './task_modification';
import { User } from './user';
import mongoose, { Document, Schema } from 'mongoose';
import { File, FileSchema } from './file';
import { PlanProperty } from './plan-properties/plan_property';
import { Task } from './task';

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
    user: User;
    domainFile: File;
    domainSpecification: File;
    problemFile: File;
    description: string;
    baseTask: Task; 
    settings: string;
    animationSettings: string;
}

const BaseProjectSchema = new Schema({
    name: { type: String, required: true},
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    domainFile: { type: FileSchema, required: true},
    domainSpecification: { type: FileSchema, required: true},
    problemFile: { type: FileSchema, required: true},
    description: { type: String, required: true},
    baseTask: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
    settings: { type: String, required: false},
    animationSettings: { type: String, required: false}
}, baseOptions);

export const BaseProjectModel = mongoose.model<Project>('base-project', BaseProjectSchema);

export const ProjectModel = BaseProjectModel.discriminator<Project>('general-project', new mongoose.Schema());

