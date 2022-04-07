import { Schema } from 'mongoose';
import { Fact, FactSchema } from './base_planning_task';


export interface PPConflict {
    elems: string[];
}

export const PPConflictSchema = new Schema({
    elems: [String]
});
  
export interface PPDependencies {
    conflicts: PPConflict[];
}

export const PPDependenciesSchema = new Schema({
    conflicts: [PPConflictSchema]
});

export interface RelaxationExplanationNode {
    name: string;
    dependencies: PPDependencies;
    updates: Fact[],
    lower_cover: number[];
    upper_cover: number[];
}

export const RelaxationExplanationNodeSchema = new Schema({
    name: String,
    dependencies: PPDependenciesSchema,
    updates: [FactSchema],
    lower_cover: [Number],
    upper_cover: [Number]
});