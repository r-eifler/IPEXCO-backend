import mongoose, { Document, Schema } from 'mongoose';

export interface Task extends Document {
    _id: string;
    name: string;
    project: string,
    // TODO
}

const TaskSchema = new Schema({
    name: { type: String, required: true},
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'base-project' },
    //TODO
});

export const TaskModel = mongoose.model<Task>('task', TaskSchema);
