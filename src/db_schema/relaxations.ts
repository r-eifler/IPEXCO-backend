import mongoose, { Document, Schema } from 'mongoose';
import { Fact, FactSchema } from './base_planning_task';

export class FactUpdate {
    orgFact: Fact;
    newFact: Fact;

    constructor(orgFact: Fact, newFact: Fact) {
        this. orgFact = orgFact;
        this.newFact = newFact;
    }

    static fromObject(o: FactUpdate){
        return new FactUpdate(Fact.fromObject(o.orgFact), Fact.fromObject(o.newFact));
    }
}

  export const FactUpdateSchema = new Schema({
    orgFact: FactSchema,
    newFact: FactSchema,
});


export class MetaFact {
    fact: Fact;
    value: number;
    display: string;

    constructor(fact: Fact, value: number, display: string) {
        this.fact = fact;
        this.value = value;
        this.display = display;
    }

    static fromObject(o: MetaFact){
        return new MetaFact(Fact.fromObject(o.fact), o.value, o.display);
    }
}

  export const MetaFactSchema = new Schema({
    fact: FactSchema,
    value: Number,
    display: String,
});
  
export interface PossibleInitFactUpdates{
    orgFact: MetaFact;
    updates: MetaFact[];
}

export const PossibleInitFactUpdatesSchema = new Schema({
    orgFact: MetaFactSchema,
    updates : [MetaFactSchema],
});

export interface PlanningTaskRelaxationSpace extends Document{
    _id: string;
    name: string;
    project: string;
    possibleInitFactUpdates: PossibleInitFactUpdates[];
  }

const PlanningTaskRelaxationSpaceSchema = new Schema({
    name: { type: String, required: true},
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'base-project' },
    possibleInitFactUpdates: [PossibleInitFactUpdatesSchema],
});

export const PlanningTaskRelaxationSpaceModel = mongoose.model<PlanningTaskRelaxationSpace>('planning-task-relaxation-space', PlanningTaskRelaxationSpaceSchema);