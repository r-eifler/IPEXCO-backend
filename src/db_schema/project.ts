import { PlanningTask, PlanningTaskSchema } from './planning_task';
import { GeneralSettings, GeneralSettingsSchema } from './settings';
import { User } from './user';
import mongoose, { Document, Schema } from 'mongoose';

const baseOptions = {
    discriminatorKey: 'itemType',
    collection: 'projects',
  };


export interface ProjectMetaData {
    _id?: string;
    updated: string;
    name: string;
    user: User;
    description: string;
}

export interface Project extends Document{
    _id?: string;
    updated: string;
    name: string;
    public: boolean;
    user: User;
    domain?: string; 
    description: string;
    baseTask: PlanningTask; 
    settings: GeneralSettings;
}

const BaseProjectSchema = new Schema({
    name: { type: String, required: true},
    public: { type: Boolean, required: true},
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    domain: { type: mongoose.Schema.Types.ObjectId, ref: 'domain-specification', required: false},
    description: { type: String, required: true},
    baseTask: { type: PlanningTaskSchema, required: true},
    settings: { type: GeneralSettingsSchema, required: true},
}, baseOptions);

export const BaseProjectModel = mongoose.model<Project>('base-project', BaseProjectSchema);

export const ProjectModel = BaseProjectModel.discriminator<Project>('general-project', new mongoose.Schema());


