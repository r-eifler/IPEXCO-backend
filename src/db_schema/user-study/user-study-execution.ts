import mongoose, { Document, Schema } from 'mongoose';

export interface UserAction {
    type: string
    timeStamp?: Date,
    data?: unknown
}

export interface UserStudyExecution extends Document{
    user: string;
    createdAt?: Date;
    updatedAt?: Date;
    finishedAt?: Date;
    userStudy: string;
    finished?: boolean;
    accepted?: boolean;
    timeLog?: UserAction[];
    payment?: number;
    prolificId: string | null
}

const UserStudyExecutionSchema = new Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    userStudy: {type: mongoose.Schema.Types.ObjectId, ref: 'user-study'},
    finished: {type: Boolean, required: false},
    finishedAt: {type: Date, required: false},
    accepted: {type: Boolean, required: false},
    timeLog: [{type: Object, required: false}],
    payment: {type: Number, required: false},
    prolificId: {type: String, required: false},
}, { timestamps: true});

export const UserStudyExecutionModel = mongoose.model<UserStudyExecution>('user-study-execution', UserStudyExecutionSchema);
