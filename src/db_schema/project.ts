import { User } from './user';
import mongoose, { Document, Schema } from 'mongoose';
import { File, FileSchema } from './file';
import { PlanningTask, PlanningTaskSchema } from './planning_task';

export enum ProjectType {
    general = 'GENERAL',
    demo = 'DEMO'
}

const baseOptions = {
    discriminatorKey: 'itemType',
    collection: 'projects',
  };

export interface Project extends Document{
    _id?: string;
    name: string;
    public: boolean;
    user: User;
    domainFile: File;
    domainSpecification: File;
    problemFile: File;
    description: string;
    baseTask?: PlanningTask; 
    settings: any;
    animationSettings: string;
}

const BaseProjectSchema = new Schema({
    name: { type: String, required: true},
    public: { type: Boolean, required: true},
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    domainFile: { type: FileSchema, required: true},
    domainSpecification: { type: FileSchema, required: true},
    problemFile: { type: FileSchema, required: true},
    description: { type: String, required: true},
    baseTask: {type: mongoose.Schema.Types.ObjectId, ref: 'planning-task'},
    settings: { type: Object, required: false},
    animationSettings: { type: String, required: false}
}, baseOptions);

export const BaseProjectModel = mongoose.model<Project>('base-project', BaseProjectSchema);

export const ProjectModel = BaseProjectModel.discriminator<Project>('general-project', new mongoose.Schema());

