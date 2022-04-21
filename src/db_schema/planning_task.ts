import mongoose, { Document, Schema } from 'mongoose';
import { TypeSchema, ObjectSchema, PredicatSchema, FactSchema, Action, ActionSchema, Fact, Predicat, Type, Object } from './base_planning_task';


export const PlanningTaskSchema = new Schema({
    name: String,
    domain: String,
    types: [TypeSchema],
    objects: [ObjectSchema],
    predicates: [PredicatSchema],
    initial: [FactSchema],
    goal: [FactSchema],
    actions: [ActionSchema]
});


export class PlanningTask{
    _id? : string;
    name: string;
    domain: string;
    types: Type[];
    objects: Object[];
    predicates: Predicat[];
    initial: Fact[];
    goal: Fact[];
    actions: Action[];

    constructor(obj: PlanningTask){
        this.name = obj.name;
        this.domain = obj.domain;
        this.types = obj.types;
        this.objects = obj.objects;
        this.predicates = obj.predicates.map(p => Predicat.fromJSON(p));
        this.predicates = this.predicates.filter(p => p.name != "=");
        this.initial = obj.initial.map(p => Fact.fromJSON(p));
        this.initial = this.initial.filter(p => p.name != "=");
        this.goal = obj.goal.map(p => Fact.fromJSON(p));
        this.actions = obj.actions.map(p => Action.fromJSON(p));
    }

    toPDDL(): string[] {
        // domain
        let d = "(define (domain " + this.domain + ")\n";
        d += "(:requirements :typing :action-costs)\n";
        d += "(:types " + this.types.filter(t => t.name != 'object').map(t => t.name + " - " + t.parent).join("\n") + "\n)\n";
        d += "(:predicates " + this.predicates.map(p => p.toPDDL(true)).join("\n") + "\n)\n";
        d += this.actions.map(a => a.toPDDL()).join("\n");
        d += "\n)";

        let p = "(define (problem " + this.name + ")\n";
        p += "(:domain " + this.domain + ")\n";
        p += "(:objects \n" + this.objects.map(o => o.name + " - " + o.type).join("\n") + "\n)\n";
        p += "(:init\n " + this.initial.map(f => f.toPDDL()).sort().join("\n") + "\n)\n";
        p += "(:goal (and " + this.goal.map(p => p.toPDDL()).join("\n") + ")\n";
        p += "\n))";

        return [d,p];
    }   

    taskSchema(): string {
        return JSON.stringify(this);
    }
}

export const PlanningTaskModel = mongoose.model<PlanningTask>('planning-task', PlanningTaskSchema);




