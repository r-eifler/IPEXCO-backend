import mongoose, { Document, Schema } from 'mongoose';

const TypeSchema = new Schema({
    name: String,
    parent: String,
});

export interface Type {
    name: string;
    parent: string;
}

const ObjectSchema = new Schema({
    name: String,
    type: String,
});

export interface Object {
    name: string;
    type: string;
}

const PredicatSchema = new Schema({
    name: String,
    negated: Boolean,
    parameters: [ObjectSchema]
});

export class Predicat {
    private name: string;
    private negated: boolean;
    private parameters: Object[];

    constructor(name: string, parameters: Object[], negated=false){
        this.name = name;
        this.parameters = parameters;
        this.negated = negated;
    }

    toPDDL(withType = false): string {
        if (withType){
            return "(" + this.name + ' ' + 
            this.parameters.map(p => p.name + " - " + p.type).join(' ') + ")"
        }
        return (this.negated ? "! " : "") + "(" + this.name + ' ' + 
            this.parameters.map(p => p.name).join(' ') + ")"
    }
}

const FactSchema = new Schema({
    name: String,
    negated: Boolean,
    arguments: [ObjectSchema]
});

export class Fact {
    private name: string;
    private negated: boolean;
    private arguments: Object[];

    constructor(name: string, args: Object[], negated=false){
        this.name = name;
        this.arguments = args;
        this.negated = negated;
    }

    toPDDL(): string {
        return (this.negated ? "! " : "") + "(" + this.name + ' ' + 
            this.arguments.map(p => p.name).join(' ') + ")"
    }
}

const ActionSchema = new Schema({
    name: String,
    parameters: [ObjectSchema],
    precondition: [PredicatSchema],
    effects: [PredicatSchema]
});

export class Action {
    private name: string;
    private parameters: Object[];
    private precondition: Predicat[];
    private effects: Predicat[];

    constructor(name: string, parameters: Object[], precondition: Predicat[], effects: Predicat[]){
        this.name = name;
        this.parameters = parameters;
        this.precondition = precondition;
        this.effects = effects;
    }

    toPDDL(): string {
        let s = "(:action " + this.name + "\n";
        s += "\tparameters: " + this.parameters.map(p => "(" + p.name + ")").join(' ') + "\n";
        s += "\tprecondition: (and " + this.precondition.map(p => p.toPDDL()).join(' ') + ")\n";
        s += "\teffect: (and " + this.effects.map(p => p.toPDDL()).join(' ') + ")\n"; 
        return s + ")\n";
    }
}

const TaskSchema = new Schema({
    name: String,
    domain: String,
    types: [TypeSchema],
    objects: [ObjectSchema],
    predicats: [PredicatSchema],
    initial: [FactSchema],
    goal: [FactSchema],
    actions: [ActionSchema]
});


export class Task extends Document {
    name: string;
    domain: string;
    types: Type[];
    objects: Object[];
    predicats: Predicat[];
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
        this.predicats = predicates;
        this.initial = initial;
        this.goal = goal;
        this.actions = actions;
    }

    toPDDL(): string[] {
        // domain
        let d = "(define (domain " + this.domain + ")\n";
        d += "(:requirements :typing :action-costs)\n";
        d += "(:types " + this.types.map(t => t.name + "-" + t.parent).join("\n") + "\n)\n";
        d += "(predicates: " + this.predicats.map(p => p.toPDDL(true)).join("\n") + "\n)\n";
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

export const TaskModel = mongoose.model<Task>('task', TaskSchema);
