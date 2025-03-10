import mongoose, { Schema, Document } from 'mongoose';
import { nativeEnum, nullable, object, optional, string, infer as zinfer } from "zod";
import { GlobalExplanationSchema, GlobalExplanationZ } from './explanations';
import { BaseProjectModel, ProjectBaseZ, ProjectZ } from './project';

export enum DemoRunStatus {
    PENDING = "PENDING",
    RUNNING = "RUNNING",
    FAILED = "FAILED",
    FINISHED = "FINISHED"
  }
  
  export const DemoRunStatusZ = nativeEnum(DemoRunStatus);
  
  export const DemoBaseZ = ProjectBaseZ.merge(object({
    projectId: nullable(string()),
    status: DemoRunStatusZ,
    globalExplanation: optional(GlobalExplanationZ),
  }));
  
  export type DemoBase = zinfer<typeof DemoBaseZ>;
  
  export const DemoZ = ProjectZ.merge(DemoBaseZ);
  
  export type Demo = zinfer<typeof DemoZ> & Document;

const DemoSchema = new Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'base-project' },
    status: { type: String, required: true},
    introduction: { type: String, required: false},
    domainInfo: { type: String, required: false},
    globalExplanation: {type: GlobalExplanationSchema, required: false},
    maxUtility: { type: String, required: false},
});

export const DemoModel = BaseProjectModel.discriminator<Demo>('demo-project', DemoSchema);

