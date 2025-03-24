import mongoose, { Schema, Document } from 'mongoose';
import { boolean, nullable, object, string, enum as zenum, infer as zinfer } from "zod";
import { PlanningTaskSchema, PlanningTaskZ } from './planning_task';
import { GeneralSettingsSchema, GeneralSettingsZ } from './settings';

const baseOptions = {
    discriminatorKey: 'itemType',
    collection: 'projects',
};

export const ProjectMetaZ  = object({
	_id: string(),
	name: string(),
	public: boolean(),
	user: string()
});

export type ProjectMetaData = zinfer<typeof ProjectMetaZ>;

  
export const ProjectTypeZ = zenum(['demo-project', 'general-project']);

export type ProjectType = zinfer<typeof ProjectTypeZ>;

export const ProjectBaseZ  = object({
	name: string(),
	public: boolean(),
	domain: string(),
  description: string(),
  instanceInfo: string().nullable(),
  baseTask: PlanningTaskZ,
  settings: GeneralSettingsZ,
  summaryImage: string().nullish(),
});

export type ProjectBase = zinfer<typeof ProjectBaseZ>;

export const ProjectZ = ProjectBaseZ.merge(object({
  _id: string(),
  itemType: ProjectTypeZ,
  user: string()
}));

export type Project = zinfer<typeof ProjectZ>;

const BaseProjectSchema = new Schema({
    name: { type: String, required: true},
    public: { type: Boolean, required: true},
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    domain: { type: mongoose.Schema.Types.ObjectId, ref: 'domain-specification', required: false},
    description: { type: String, required: true},
    instanceInfo: { type: String, required: false},
    baseTask: { type: PlanningTaskSchema, required: true},
    settings: { type: GeneralSettingsSchema, required: true},
    summaryImage: { type: String, required: false},
}, baseOptions);

export const BaseProjectModel = mongoose.model<Project>('base-project', BaseProjectSchema);

export const ProjectModel = BaseProjectModel.discriminator<Project>('general-project', new mongoose.Schema());


