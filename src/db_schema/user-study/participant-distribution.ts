import mongoose, { Document, Schema } from 'mongoose';

export interface UserStudySelection  extends Document{
    userStudy: string;
    numberParticipants: number;
}

const UserStudySelectionSchema = new Schema({
    userStudy: { type: mongoose.Schema.Types.ObjectId, ref: 'user-study' },
    numberParticipants: { type: Number, required: true}
});


export interface ParticipantDistribution extends Document{
    name: string;
    user: string;
    description: string;
    userStudies: UserStudySelection[];
}

const ParticipantDistributionSchema = new Schema({
    name: { type: String, required: true},
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    description: { type: String, required: true},
    userStudies: [{ type: UserStudySelectionSchema, required: true}]
});

export const ParticipantDistributionModel = mongoose.model<ParticipantDistribution>('participant-distribution', ParticipantDistributionSchema);
