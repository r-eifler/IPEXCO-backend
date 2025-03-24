import mongoose, { Document, Schema } from 'mongoose';
import { array, boolean, nativeEnum, nullable, number, object, string, infer as zinfer } from "zod";
import { ActionSetSchema, ActionSetZ } from './action_set';


export enum GoalType {
    goalFact= 'G',
    LTL = 'LTL',
    AS = 'AS',
    DOMAIN_DEPENDENT = "DOMAIN_DEPENDENT",
}

export const GoalTypeZ = nativeEnum(GoalType);

export const PlanPropertyDefinitionZ  = object({
  name: string(),
  parameters: array(string()),
});

export type PlanPropertyDefinition = zinfer<typeof PlanPropertyDefinitionZ>;

export const PlanPropertyBaseZ = object({
    name: string(),
    definition: nullable(PlanPropertyDefinitionZ),
    type: GoalTypeZ,
    formula: string().nullable(),
    actionSets: array(ActionSetZ).optional(),
    naturalLanguageDescription: string(),
    isUsed: boolean(),
    globalHardGoal: boolean(),
    utility: number(),
    color: string(),
    icon: string(),
    class: string()
});

export type PlanPropertyBase = zinfer<typeof PlanPropertyBaseZ>;

export const PlanPropertyOfProjectZ = PlanPropertyBaseZ.merge(object({
  project: string()
}));

export type PlanPropertyOfProject = zinfer<typeof PlanPropertyOfProjectZ>;

export const PlanPropertyZ = PlanPropertyOfProjectZ.merge(object({
  _id: string(),
}));

export type PlanProperty = zinfer<typeof PlanPropertyZ> & Document;

const PlanPropertySchema = new Schema({
    name: { type: String, required: true},
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'base-project' },
    definition: { type: Object, required: false},
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

