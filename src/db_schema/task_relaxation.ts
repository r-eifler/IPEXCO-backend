import mongoose, { Document, Schema } from 'mongoose';

export interface TaskRelaxation extends Document {
    _id: string;
    name: string;
    project: string,
    type: string;
    isUsed: boolean;
    taskModification: string;
    value: number;
    upper: TaskRelaxation[];
    lower: TaskRelaxation[];
}

const TaskRelaxationSchema = new Schema({
    name: { type: String, required: true},
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'base-project' },
    type: { type: String, required: true},
    isUsed: { type: Boolean, required: true},
    taskModification: { type: String, required: true},
    value: { type: Number, required: true},
    upper: [{ type: mongoose.Schema.Types.ObjectId, ref: 'task-relaxation' }],
    lower: [{ type: mongoose.Schema.Types.ObjectId, ref: 'task-relaxation' }],
});

export const TaskRelaxationModel = mongoose.model<TaskRelaxation>('task-relaxation', TaskRelaxationSchema);

