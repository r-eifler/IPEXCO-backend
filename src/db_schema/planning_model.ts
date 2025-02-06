import mongoose, { Schema } from 'mongoose';
import { PDDLPlanningModel } from './PDDL_model';
import { DomainDependentPlanningModel } from './domain_dependent_model';


export interface PlanningTask{
    _id? : string;
    name: string;
    model: PDDLPlanningModel | DomainDependentPlanningModel; 
}  

export const PlanningTaskSchema = new Schema({
    name: { type: String, required: true},
    model: { type: Object, required: true},
});


export const PlanningTaskModel = mongoose.model<PlanningTask>('planning-task', PlanningTaskSchema);




