import { Task } from './task';
import mongoose, { Document, Schema } from 'mongoose';

export interface TaskModification extends Document {
    _id: string;
    name: string;
    project: string,
    type: string;
    isUsed: boolean;
    task: Task;
    value: number;
    upper: TaskModification[];
    lower: TaskModification[];
}

const TaskModificationSchema = new Schema({
    name: { type: String, required: true},
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'base-project' },
    type: { type: String, required: true},
    isUsed: { type: Boolean, required: true},
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'task' },
    value: { type: Number, required: true},
    upper: [{ type: mongoose.Schema.Types.ObjectId, ref: 'task-modification' }],
    lower: [{ type: mongoose.Schema.Types.ObjectId, ref: 'task-modification' }],
});

export const TaskRelaxationModel = mongoose.model<TaskModification>('task-modification', TaskModificationSchema);

