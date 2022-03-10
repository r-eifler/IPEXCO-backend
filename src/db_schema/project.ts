import { User } from './user';
import mongoose, { Document, Schema } from 'mongoose';
import { File, FileSchema } from './file';
import { Task, TaskSchema } from './task';

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
    baseTask?: Task; 
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
    baseTask: {type: TaskSchema, required: false},
    settings: { type: Object, required: false},
    animationSettings: { type: String, required: false}
}, baseOptions);

export const BaseProjectModel = mongoose.model<Project>('base-project', BaseProjectSchema);

export const ProjectModel = BaseProjectModel.discriminator<Project>('general-project', new mongoose.Schema());

