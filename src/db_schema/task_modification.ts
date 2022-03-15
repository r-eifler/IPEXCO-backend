import { Fact, Task, FactSchema } from './task';
import mongoose, { Document, Schema } from 'mongoose';

export interface TaskUpdates{
    orgFact: Fact;
    newFacts: {fact: Fact, value: number}[];
}

const TaskUpdatesSchema = new Schema({
    orgFact: FactSchema,
    newFacts: [{fact: FactSchema, value: Number}],
});

export interface PlanningTaskRelaxationSpace extends Document{
    _id: string;
    name: string;
    project: string,
    taskUpdatList: TaskUpdates[];
  }

const PlanningTaskRelaxationSpaceSchema = new Schema({
    name: { type: String, required: true},
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'base-project' },
    taskUpdatList: [TaskUpdatesSchema],
});

export const PlanningTaskRelaxationSpaceModel = mongoose.model<PlanningTaskRelaxationSpace>('planning-task-relaxation-space', PlanningTaskRelaxationSpaceSchema);

export interface ModifiedPlanningTask extends Document{
    _id: string;
    name: string;
    project: string,
    basetask: Task;
    taskUpdatList: TaskUpdates[];
  }

const ModifiedPlanningTaskSchema = new Schema({
    name: { type: String, required: true},
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'base-project' },
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'task' },
    upptaskUpdatLister: [TaskUpdatesSchema],
});

export const ModifiedPlanningTaskModel = mongoose.model<ModifiedPlanningTask>('modified-planning-task', ModifiedPlanningTaskSchema);
