import mongoose, { Document, Schema } from 'mongoose';
import { Fact, FactSchema } from './base_planning_task';

export interface FactUpdate {
    orgFact: Fact;
    newFact: Fact;
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
  
export interface RelaxationDimension{
    name: string;
    orgFact: MetaFact;
    updates: MetaFact[];
}

export const RelaxationDimensionSchema = new Schema({
    name: String,
    orgFact: MetaFactSchema,
    updates : [MetaFactSchema],
});

export interface PlanningTaskRelaxationSpace extends Document{
    _id: string;
    name: string;
    project: string;
    dimensions: RelaxationDimension[]
  }

const PlanningTaskRelaxationSpaceSchema = new Schema({
    name: { type: String, required: true},
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'base-project' },
    dimensions: [RelaxationDimensionSchema],
});


export const PlanningTaskRelaxationSpaceModel = mongoose.model<PlanningTaskRelaxationSpace>('planning-task-relaxation-space', PlanningTaskRelaxationSpaceSchema);

function getAllPossibleAssignments(space: PlanningTaskRelaxationSpace): FactUpdate[][] {
    let possibleAssignments: FactUpdate[][] = [];

    for(let dim of space.dimensions){
        if (possibleAssignments.length == 0) {
            possibleAssignments.push([{orgFact: dim.orgFact.fact, newFact: dim.orgFact.fact}]);
            dim.updates.forEach(up => possibleAssignments.push([{orgFact: dim.orgFact.fact, newFact: up.fact}]));
        }
        else {
            let current = [...possibleAssignments];
            possibleAssignments = [];

            [dim.orgFact, ... dim.updates].forEach(up => 
                current.forEach(c => possibleAssignments.push([...c, {orgFact: dim.orgFact.fact, newFact: up.fact}]))
            );
        }
    }
    return possibleAssignments;
}

export function computePossibleRelaxations(taskRelaxations: PlanningTaskRelaxationSpace[]): FactUpdate[][] {
    let possibleRelaxations: FactUpdate[][] = [];
    
    for(let space of taskRelaxations) {
        if (possibleRelaxations.length == 0){
            possibleRelaxations.push(... getAllPossibleAssignments(space));
        }
        else {
            let current = [...possibleRelaxations];
            possibleRelaxations = [];

            let asigns = getAllPossibleAssignments(space);
            asigns.forEach(a => current.forEach(c => possibleRelaxations.push([...c, ...a])));
            
        }
    }
    
    return possibleRelaxations;
}