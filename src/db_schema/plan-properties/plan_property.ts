import mongoose, { Document, Schema } from 'mongoose';
import { ActionSet, ActionSetSchema } from './action_set';

export enum GoalType {
    goalFact= 'G',
    LTL = 'LTL',
    AS = 'AS',
    DOMAIN_DEPENDENT = "DOMAIN_DEPENDENT",
}

export interface PlanPropertyDefinition {
    name: string;
    parameters: string[]
}

export interface PlanProperty extends Document {
    _id?: string;
    name: string;
    definition: PlanPropertyDefinition | null; 
    project: string;
    type: string;
    formula: string;
    actionSets: [ActionSet];
    naturalLanguageDescription: string;
    isUsed: boolean;
    globalHardGoal: boolean;
    utility: number;
    ranking: number;
    color: string;
    icon: string;
    class: string;
}

const PlanPropertySchema = new Schema({
    name: { type: String, required: true},
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'base-project' },
    definition: { type: Object, required: true},
    type: { type: String, required: true},
    formula: { type: String, required: false},
    actionSets: [ActionSetSchema],
    naturalLanguageDescription: { type: String, required: true},
    isUsed: { type: Boolean, required: true},
    globalHardGoal: { type: Boolean, required: true},
    utility: { type: Number, required: true},
    ranking: { type: Number, required: false},
    color: { type: String, required: true},
    icon: { type: String, required: true},
    class: { type: String, required: true},
});

export const PlanPropertyModel = mongoose.model<PlanProperty>('plan-property', PlanPropertySchema);

