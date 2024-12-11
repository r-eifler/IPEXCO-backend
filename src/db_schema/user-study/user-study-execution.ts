import mongoose, { Document, Schema } from 'mongoose';

export interface UserStudyExecution extends Document{
    user: string;
    createdAt?: Date;
    updatedAt?: Date;
    userStudy: string;
    finished?: boolean;
    accepted?: boolean;
    timeLog?: string;
    payment?: number;
}

const UserStudyExecutionSchema = new Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    userStudy: {type: mongoose.Schema.Types.ObjectId, ref: 'user-study'},
    finished: {type: String, required: false},
    accepted: {type: Boolean, required: false},
    timeLog: {type: String, required: false},
    payment: {type: Number, required: false},
}, { timestamps: true});

export const UserStudyExecutionModel = mongoose.model<UserStudyExecution>('user-study-execution', UserStudyExecutionSchema);
