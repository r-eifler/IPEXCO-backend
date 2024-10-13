import { constants } from 'buffer';
import mongoose, { Schema } from 'mongoose';

export interface PDDLType {
    name: string;
    parent: string;
  }
  
export interface PDDLObject {
    name: string;
    type: string;
}
  
export interface PDDLPredicate {
    name: string;
    negated: boolean;
    parameters: PDDLObject[];
}

export interface PDDLFact {
    name: string;
    arguments: string[]; 
    negated: boolean;
}

export interface PDDLFunctionAssignment {
    name: string;
    arguments: string[]; 
    value: number;
}

export interface PDDLAction {
    name: string; 
    parameters:  PDDLObject[];
    precondition: PDDLFact[];
    effect: PDDLFact[];
}

export interface PlanningDomain {
    constants: {
        name: string; 
        type: string | undefined;
    }[];
    types: PDDLType[];
    predicates: PDDLPredicate[];
    actions: PDDLAction[];
}

export interface PlanningProblem {
    objects: {
        name: string; 
        type: string | undefined;
    }[];
    initial: (PDDLFact | PDDLFunctionAssignment)[];
    goal: PDDLFact[];
}

export interface PlanningModel extends PlanningDomain, PlanningProblem {}


export const PlanningTaskSchema = new Schema({
    name: String,
    domain_name: String,
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
    toPDDL(with_goals=true): string[] {

        let model = JSON.parse(this.model) as PlanningModel

        // domain
        let d = "(define (domain domainname)\n";
        d += "(:requirements :typing :action-costs)\n";

        d += "(:types\n" + 
            model.types
                .filter(t => t.name != 'object')
                .map(t => "\t\t" + t.name + " - " + (t.parent && t.parent != 'TODO' ? t.parent : 'object'))
                .join("\n") 
            + "\n)\n";

        if(model.constants.length > 0){
            d += "(:constants \n" + model.constants.map(o => '\t' + o.name + " - " + o.type).join("\n") + "\n)\n";
        }

        d += "(:predicates \n" + model.predicates.map(
                pred => "\t(" + pred.name + ' ' + 
                pred.parameters.map(param => param.name + ' - ' + param.type).join(" ") + ")"
            ).join("\n") 
            + "\n)\n";

        d += model.actions
            .map(
                a => "(:action " + a.name + "\n\t:parameters (" + 
                    a.parameters.map(p => p.name + ' - ' + p.type).join(" ") + ")\n" +
                    "\t:precondition (and \n" +
                        a.precondition.map(p => 
                            p.negated ? 
                            "\t\t" + "(not (" + p.name + ' ' + p.arguments.join(" ") + "))" :
                            "\t\t" + "(" + p.name + ' ' + p.arguments.join(" ") + ")"
                        ).join('\n') +
                    "\t)\n" +
                    "\t:effect (and \n" +
                        a.effect.map(p => 
                            p.negated ? "\t\t" + "(not (" + p.name + ' ' + p.arguments.join(" ") + "))" :
                            "\t\t" + "(" + p.name + ' ' + p.arguments.join(" ") + ")"
                        ).join('\n') +
                    "\t)\n)")
            .join("\n");

        d += "\n)";



        // problem
        let p = "(define (problem problemname)\n";
        p += "(:domain domainname)\n";

        p += "(:objects \n" + model.objects.map(o => '\t' + o.name + " - " + o.type).join("\n") + "\n)\n";

        p += "(:init\n " + model.initial.map(
            f => "\t(" + f.name + ' ' + f.arguments.join(" ") + ")").join("\n") 
            + "\n)\n";

        if(with_goals){
            p += "(:goal (and \n" + 
                model.goal.map(p => "\t(" + p.name + ' ' + p.arguments.join(" ") + ")").join("\n") 
                + "))\n";
        }
        else {
            p += "(:goal (and ))\n";
        }
        p += ")";

        return [d,p];
    }   

    taskSchema(): string {
        return JSON.stringify(this);
    }
}

export const PlanningTaskModel = mongoose.model<PlanningTask>('planning-task', PlanningTaskSchema);




