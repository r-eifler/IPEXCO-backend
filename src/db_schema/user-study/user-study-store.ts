import { IterationStep } from './../iteration_step';
import mongoose, { Document, Schema } from 'mongoose';
import { DepExplanationRun, PlanRun } from '../iteration_step';
import { USUser } from './user-study-user';


export interface UserStudyData {
    user: string;
    demoSteps: IterationStep[];
}

const UserStudyDataSchema = new Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'us-user' },
    demoSteps: [{ type: mongoose.Schema.Types.ObjectId, ref: 'iteration-step' }],
    
}, { timestamps: true});

export const UserStudyDataModel = mongoose.model<UserStudyData>('us-data', UserStudyDataSchema);
