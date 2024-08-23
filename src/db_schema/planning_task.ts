import mongoose, { Schema } from 'mongoose';


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

        let model = JSON.parse(model)
        // domain
        let d = "(define (domain " + model.domain_name + ")\n";
        d += "(:requirements :typing :action-costs)\n";
        d += "(:types " + model.types.filter(t => t.name != 'object').map(t => t.name + " - " + t.parent).join("\n") + "\n)\n";
        d += "(:predicates " + model.predicates.map(p => p.toPDDL(true)).join("\n") + "\n)\n";
        d += model.actions.map(a => a.toPDDL()).join("\n");
        d += "\n)";

        let p = "(define (problem " + this.name + ")\n";
        p += "(:domain " + model.domain_name + ")\n";
        p += "(:objects \n" + model.objects.map(o => o.name + " - " + o.type).join("\n") + "\n)\n";
        p += "(:init\n " + model.initial.map(f => f.toPDDL()).sort().join("\n") + "\n)\n";
        p += "(:goal (and " + model.goal.map(p => p.toPDDL()).join("\n") + ")\n";
        p += "\n))";

        return [d,p];
    }   

    taskSchema(): string {
        return JSON.stringify(this);
    }
}

export const PlanningTaskModel = mongoose.model<PlanningTask>('planning-task', PlanningTaskSchema);




