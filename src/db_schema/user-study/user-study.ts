import mongoose, { Document, Schema } from 'mongoose';

export interface UserStudySelection  extends Document{
    userStudy: UserStudy;
    numberTestPersons: number;
}

const UserStudySelectionSchema = new Schema({
    userStudy: { type: mongoose.Schema.Types.ObjectId, ref: 'user-study' },
    numberTestPersons: { type: Number, required: true}
});


export interface MetaStudy extends Document{
    name: string;
    user: string;
    description: string;
    userStudies: UserStudySelection[];
}

const MetaStudySchema = new Schema({
    name: { type: String, required: true},
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    description: { type: String, required: true},
    userStudies: [{ type: UserStudySelectionSchema, required: true}]
});

export const MetaStudyModel = mongoose.model<MetaStudy>('meta-study', MetaStudySchema);


export interface UserStudy extends Document{
    name: string;
    user: string;
    description: string;
    startDate: string;
    endDate: string;
    steps: string;
    available: boolean;
    redirectUrl?: string;
}


const UserStudySchema = new Schema({
    name: { type: String, required: true},
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    description: { type: String, required: true},
    startDate: { type: String, required: true},
    endDate: { type: String, required: true},
    steps: { type: String, required: true},
    available: { type: Boolean, required: true},
    redirectUrl: { type: String, required: false},
});

export const UserStudyModel = mongoose.model<UserStudy>('user-study', UserStudySchema);
