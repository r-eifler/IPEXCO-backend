import mongoose, { Schema } from 'mongoose';

export const TypeSchema = new Schema({
    name: String,
    parent: String,
});

export interface Type {
    name: string;
    parent: string;
}

export const ObjectSchema = new Schema({
    name: String,
    type: String,
});

export interface Object {
    name: string;
    type: string;
}

export const PredicatSchema = new Schema({
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

export const FactSchema = new Schema({
    name: String,
    negated: Boolean,
    arguments: [String]
});

export class Fact {
    private name: string;
    private negated: boolean;
    private arguments: string[];

    constructor(name: string, args: string[], negated=false){
        this.name = name;
        this.arguments = args;
        this.negated = negated;
    }

    toPDDL(): string {
        return (this.negated ? "! " : "") + "(" + this.name + ' ' + 
            this.arguments.join(' ') + ")"
    }
}

export const ActionSchema = new Schema({
    name: String,
    parameters: [ObjectSchema],
    precondition: [FactSchema],
    effects: [FactSchema]
});

export class Action {
    private name: string;
    private parameters: Object[];
    private precondition: Fact[];
    private effects: Fact[];

    constructor(name: string, parameters: Object[], precondition: Fact[], effects: Fact[]){
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