import mongoose, { Schema } from 'mongoose';


import { array, object, string, infer as zinfer } from "zod";

export const TaskObjectZ = object({
  name: string(),
  type: string()
});

export type TaskObject = zinfer<typeof TaskObjectZ>;

export const BaseModel = object({
  objects: array(TaskObjectZ)
})

export type BaseModel = zinfer<typeof BaseModel>;

export const PlanningTaskZ = object({
  name: string(),
  model: BaseModel
});

export type PlanningTask = zinfer<typeof PlanningTaskZ> 

export const PlanningTaskSchema = new Schema({
    name: { type: String, required: true},
    model: { type: Object, required: true},
});


export const PlanningTaskModel = mongoose.model<PlanningTask>('planning-task', PlanningTaskSchema);




