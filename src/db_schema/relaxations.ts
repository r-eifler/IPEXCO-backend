import mongoose, { Document, Schema } from 'mongoose';
import { Fact, FactSchema } from './base_planning_task';

export interface TaskUpdates{
    orgFact: Fact;
    newFacts: {fact: Fact, value: number}[];
}

export const TaskUpdatesSchema = new Schema({
    orgFact: FactSchema,
    newFacts: [{fact: FactSchema, value: Number}],
});

export interface PlanningTaskRelaxationSpace extends Document{
    _id: string;
    name: string;
    project: string;
    taskUpdatList: TaskUpdates[];
  }

const PlanningTaskRelaxationSpaceSchema = new Schema({
    name: { type: String, required: true},
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'base-project' },
    taskUpdatList: [TaskUpdatesSchema],
});

export const PlanningTaskRelaxationSpaceModel = mongoose.model<PlanningTaskRelaxationSpace>('planning-task-relaxation-space', PlanningTaskRelaxationSpaceSchema);