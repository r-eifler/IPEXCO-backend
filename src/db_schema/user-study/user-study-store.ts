import { IterationStep } from './../iteration_step';
import mongoose, { Document, Schema } from 'mongoose';
import { DepExplanationRun, PlanRun } from '../iteration_step';
import { USUser } from './user-study-user';

export interface UserStudyDemoData {
    demo: string;
    iterationSteps: IterationStep[];
}

const UserStudyDemoDataSchema = new Schema({
    demo: { type: mongoose.Schema.Types.ObjectId, ref: 'demo' },
    iterationSteps: [{ type: mongoose.Schema.Types.ObjectId, ref: 'iteration-step' }],
    
}, { timestamps: true});

export interface UserStudyData extends Document{
    user: string;
    createdAt?: Date;
    userStudy: string;
    finished?: boolean;
    accepted?: boolean;
    timeLog?: string;
    payment?: number;
    demosData: UserStudyDemoData[];
}

const UserStudyDataSchema = new Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'us-user' },
    userStudy: {type: mongoose.Schema.Types.ObjectId, ref: 'user-study'},
    finished: {type: String, required: false},
    accepted: {type: Boolean, required: false},
    timeLog: {type: String, required: false},
    payment: {type: Number, required: false},
    demosData: [UserStudyDemoDataSchema], 
}, { timestamps: true});

export const UserStudyDataModel = mongoose.model<UserStudyData>('us-data', UserStudyDataSchema);
