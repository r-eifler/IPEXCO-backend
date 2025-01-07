import mongoose, { Document, Schema } from 'mongoose';

export enum UserStudyStepType {
    description = 'description',
    form = 'form',
    demo = 'demo',
    demoInfo = 'demoInfo',
    userManual = 'userManual'
  }
  
  export interface UserStudyStep {
    type: UserStudyStepType;
    name: string;
    time: number | null;
    content: string;
  }

  const UserStudyStepSchema = new Schema({
    type: { type: String, required: true},
    name: { type: String, required: true},
    time: { type: String, required: false},
    content: { type: String, required: true},
});


export interface UserStudy extends Document{
    name: string;
    user: string;
    description: string;
    relatedProject: string;
    expectation: string;
    confidentiality: string;
    startDate: string;
    endDate: string;
    steps: UserStudyStep[];
    available: boolean;
    redirectUrl?: string;
}


const UserStudySchema = new Schema({
    name: { type: String, required: true},
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    description: { type: String, required: true},
    relatedProject: { type: String, required: true},
    expectation: { type: String, required: true},
    confidentiality: { type: String, required: true},
    startDate: { type: String, required: true},
    endDate: { type: String, required: true},
    steps: [{ type: UserStudyStepSchema, required: true}],
    available: { type: Boolean, required: false},
    redirectUrl: { type: String, required: false},
});

export const UserStudyModel = mongoose.model<UserStudy>('user-study', UserStudySchema);
