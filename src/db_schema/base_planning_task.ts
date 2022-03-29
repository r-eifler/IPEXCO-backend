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
    name: string;
    negated: boolean;
    parameters: Object[];

    constructor(name: string, parameters: Object[], negated=false){
        this.name = name;
        this.parameters = parameters;
        this.negated = negated;
    }

    static fromJSON(json: Predicat){
        return new Predicat(json.name, json.parameters, json.negated);
      }

    toPDDL(withType = false): string {
        if (withType){
            return "(" + this.name + ' ' + 
            this.parameters.map(p => p.name + " - " + p.type).join(' ') + ")"
        }
        return (this.negated ? "not " : "") + "(" + this.name + ' ' + 
            this.parameters.map(p => p.name).join(' ') + ")"
    }
}

export const FactSchema = new Schema({
    name: String,
    negated: Boolean,
    arguments: [String]
});

export class Fact {
    name: string;
    negated: boolean;
    arguments: string[];

    constructor(name: string, args: string[], negated=false){
        this.name = name;
        this.arguments = args;
        this.negated = negated;
    }

    static fromJSON(json: Fact){
        return new Fact(json.name, json.arguments, json.negated);
    }

    static fromObject(o: Fact){
        return new Fact(o.name, o.arguments, o.negated);
    }

    toPDDL(): string {
        return (this.negated ? "(not " : "") + "(" + this.name + ' ' + 
            this.arguments.join(' ') + (this.negated ? ")) " : ")")
    }

    equals(f: Fact): boolean {
        return this.name == f.name && JSON.stringify(this.arguments) === JSON.stringify(f.arguments)
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

    static fromJSON(json: Action){
        return new Action(json.name, json.parameters,
          json.precondition.map(p => Fact.fromJSON(p)),
          json.effects.map(e => Fact.fromJSON(e)));
      }

    toPDDL(): string {
        let s = "(:action " + this.name + "\n";
        s += "\t:parameters (" + this.parameters.map(p => p.name).join(' ') + ")\n";
        s += "\t:precondition (and " + this.precondition.map(p => p.toPDDL()).join(' ') + ")\n";
        s += "\t:effect (and " + this.effects.map(p => p.toPDDL()).join(' ') + ")\n"; 
        return s + ")\n";
    }
}