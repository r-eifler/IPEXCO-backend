import mongoose, { Document, Schema } from 'mongoose';
import { Fact, FactSchema } from './base_planning_task';

export class InitFactUpdate {
    orgFact: Fact;
    newFact: Fact;
    value: number;

    constructor(orgFact: Fact, newFact: Fact, value: number) {
    this. orgFact = orgFact;
    this.newFact = newFact;
    this.value = value;
    }

    static fromObject(o: InitFactUpdate){
        return new InitFactUpdate(Fact.fromObject(o.orgFact), Fact.fromObject(o.newFact), o.value);
    }
}

  export const InitFactUpdateSchema = new Schema({
    orgFact: FactSchema,
    newFact: FactSchema,
    value: Number,
});
  
export interface PossibleInitFactUpdate{
    orgFact: Fact;
    updates: {fact: Fact, value: number}[];
}

export const PossibleInitFactUpdateSchema = new Schema({
    orgFact: FactSchema,
    updates : [{fact: FactSchema, value: Number}],
});

export interface PlanningTaskRelaxationSpace extends Document{
    _id: string;
    name: string;
    project: string;
    possibleInitFactUpdates: PossibleInitFactUpdate[];
  }

const PlanningTaskRelaxationSpaceSchema = new Schema({
    name: { type: String, required: true},
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'base-project' },
    possibleInitFactUpdates: [PossibleInitFactUpdateSchema],
});

export const PlanningTaskRelaxationSpaceModel = mongoose.model<PlanningTaskRelaxationSpace>('planning-task-relaxation-space', PlanningTaskRelaxationSpaceSchema);