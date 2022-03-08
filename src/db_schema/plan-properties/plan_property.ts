import mongoose, { Document, Schema } from 'mongoose';
import { ActionSet, ActionSetSchema } from './action_set';

export interface PlanProperty extends Document {
    _id?: string;
    name: string;
    project: string;
    type: string;
    formula: string;
    actionSets: [ActionSet];
    naturalLanguageDescription: string;
    isUsed: boolean;
    globalHardGoal: boolean;
    value: number;
}

const PlanPropertySchema = new Schema({
    name: { type: String, required: true},
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'base-project' },
    type: { type: String, required: true},
    formula: { type: String, required: true},
    actionSets: [ActionSetSchema],
    naturalLanguageDescription: { type: String, required: true},
    isUsed: { type: Boolean, required: true},
    globalHardGoal: { type: Boolean, required: true},
    value: { type: Number, required: true}
});

export const PlanPropertyModel = mongoose.model<PlanProperty>('plan-property', PlanPropertySchema);

