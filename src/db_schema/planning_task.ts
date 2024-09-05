import mongoose, { Schema } from 'mongoose';


export interface PDDLFact {name: string, arguments: string[]}

export interface PDDLFunctionAssignment {name: string, arguments: string[], value: number}

export interface PDDLAction {
    name: string, 
    parameters:  {name: string, type: string}[],
    preconditions: PDDLFact[]
    effects: PDDLFact[]
}

export interface PlanningDomain {
    types: {name: string, parent: string}[]
    predicates: {name: string, parameters: string[]}[]
    actions: PDDLAction[],
}

export interface PlanningProblem {
    objects: {name: string, type: string | undefined}[],
    initial: (PDDLFact | PDDLFunctionAssignment)[]
    goal: PDDLFact[]
}

export interface PlanningModel extends PlanningDomain, PlanningProblem {}


export const PlanningTaskSchema = new Schema({
    name: String,
    domain: String,
    encoding: String,
    model: String
});


export class PlanningTask{
    _id? : string;
    name: string;
    domain_name: string;
    encoding: string;
    model: string;

    constructor(obj: PlanningTask){
        this.name = obj.name;
        this.domain_name = obj.domain_name;
        this.encoding = obj.encoding;
        this.model = obj.model;
    }

    // TODO add functions
    toPDDL(): string[] {

        let model = JSON.parse(this.model) as PlanningModel

        // domain
        let d = "(define (domain " + this.domain_name + ")\n";
        d += "(:requirements :typing :action-costs)\n";

        d += "(:types " + 
            model.types
                .filter(t => t.name != 'object')
                .map(t => t.name + " - " + t.parent)
                .join("\n") 
            + "\n)\n";

        d += "(:predicates " + model.predicates.map(
                p => "(" + p.name + p.parameters.join(", ") + ")"
            ).join("\n") 
            + "\n)\n";

        d += model.actions
            .map(
                a => "(:action " + a.name + "\n\t:parameters (" + a.parameters.join(", ") + ")\n" +
                    "\t:precondition (and " +
                        a.preconditions.map(p => "\t\t" + "(" + p.name +  p.arguments.join(", ") + ")\n") +
                    "\t)" +
                    "\t:effects (and " +
                        a.effects.map(p => "\t\t" + "(" + p.name +  p.arguments.join(", ") + ")\n") +
                    "\t)")
            .join("\n");

        d += "\n)";



        // problem
        let p = "(define (problem " + this.name + ")\n";
        p += "(:domain " + this.domain_name + ")\n";
        p += "(:objects \n" + model.objects.map(o => o.name + " - " + o.type).join("\n") + "\n)\n";
        p += "(:init\n " + model.initial.map(
            f => "(" + f.name +  f.arguments.join(", ") + ")").join("\n") 
            + "\n)\n";
        p += "(:goal (and " + 
            model.goal.map(p => "(" + p.name + p.arguments.join(", ") + ")").join("\n") 
            + ")\n";
        p += "\n))";

        return [d,p];
    }   

    taskSchema(): string {
        return JSON.stringify(this);
    }
}

export const PlanningTaskModel = mongoose.model<PlanningTask>('planning-task', PlanningTaskSchema);




