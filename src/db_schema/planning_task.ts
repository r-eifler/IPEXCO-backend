import mongoose, { Document, Schema } from 'mongoose';
import { TypeSchema, ObjectSchema, PredicatSchema, FactSchema, Action, ActionSchema, Fact, Predicat, Type, Object } from './base_planning_task';
import { TaskUpdates, TaskUpdatesSchema } from './relaxations';


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


export class PlanningTask extends Document {
    name: string;
    domain: string;
    types: Type[];
    objects: Object[];
    predicates: Predicat[];
    initial: Fact[];
    goal: Fact[];
    actions: Action[];

    constructor(name: string, domain: string, types: Type[], objects: Object[], 
        predicates: Predicat[], initial: Fact[], goal: Fact[], actions: Action[]){
        super();
        this.name = name;
        this.domain = domain;
        this.types = types;
        this.objects = objects;
        this.predicates = predicates;
        this.initial = initial;
        this.goal = goal;
        this.actions = actions;
    }

    toPDDL(): string[] {
        // domain
        let d = "(define (domain " + this.domain + ")\n";
        d += "(:requirements :typing :action-costs)\n";
        d += "(:types " + this.types.map(t => t.name + "-" + t.parent).join("\n") + "\n)\n";
        d += "(predicates: " + this.predicates.map(p => p.toPDDL(true)).join("\n") + "\n)\n";
        d += this.actions.map(a => a.toPDDL()).join("\n");
        d += "\n)";

        let p = "(define (problem " + this.name + ")\n";
        p += "(domain " + this.domain + ")";
        p += "(:objects " + this.objects.map(o => o.name + "-" + o.type).join("\n") + "\n)\n";
        p += "(:init\n " + this.initial.map(f => f.toPDDL()).join("\n") + "\n)\n";
        p += "(goal: (and " + this.goal.map(p => p.toPDDL()).join("\n") + ")\n";
        p += "\n)";

        return [d,p];
    }   

    taskSchema(): string {
        return JSON.stringify(this);
    }
}


export interface ModifiedPlanningTask extends Document{
    _id: string;
    name: string;
    basetask: PlanningTask;
    taskUpdatList: TaskUpdates[];
  }

export const ModifiedPlanningTaskSchema = new Schema({
    name: { type: String, required: true},
    basetask: { type: mongoose.Schema.Types.ObjectId, ref: 'planning-task' },
    upptaskUpdatLister: [TaskUpdatesSchema],
});


export const PlanningTaskModel = mongoose.model<PlanningTask>('planning-task', PlanningTaskSchema);
export const ModifiedPlanningTaskModel = mongoose.model<ModifiedPlanningTask>('modified-planning-task', ModifiedPlanningTaskSchema);



