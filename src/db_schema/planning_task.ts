import mongoose, { Schema } from 'mongoose';


export interface PlanningTask{
    _id? : string;
    name: string;
    model: unknown; 
}  

export const PlanningTaskSchema = new Schema({
    name: { type: String, required: true},
    model: { type: Object, required: true},
});


export const PlanningTaskModel = mongoose.model<PlanningTask>('planning-task', PlanningTaskSchema);




