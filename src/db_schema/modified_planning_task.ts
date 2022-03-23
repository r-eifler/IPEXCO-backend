import mongoose, { Document, Schema } from 'mongoose';
import { PlanningTask } from './planning_task';
import { TaskUpdates, TaskUpdatesSchema } from './relaxations';

export interface ModifiedPlanningTask extends Document{
    _id: string;
    name: string;
    basetask: PlanningTask;
    taskUpdatList: TaskUpdates[];
  }

export const ModifiedPlanningTaskSchema = new Schema({
    name: { type: String, required: true},
    basetask: { type: mongoose.Schema.Types.ObjectId, ref: 'planning-task' },
    upptaskUpdatLister: [TaskUpdatesSchema],
});

// export const ModifiedPlanningTaskModel = mongoose.model<ModifiedPlanningTask>('modified-planning-task', ModifiedPlanningTaskSchema);