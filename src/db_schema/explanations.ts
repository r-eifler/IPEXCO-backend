import { Schema } from 'mongoose';


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