import mongoose, { Schema } from 'mongoose';


import { array, object, string, unknown, infer as zinfer } from "zod";

export const TaskObjectZ = object({
  name: string(),
  type: string()
});

export type TaskObject = zinfer<typeof TaskObjectZ>;

export const PlanningTaskZ = object({
  name: string(),
  objects: array(TaskObjectZ),
  model: unknown()
});

export type PlanningTask = zinfer<typeof PlanningTaskZ> 

export const PlanningTaskSchema = new Schema({
    name: { type: String, required: true},
    objects: { type: Array, required: false},
    model: { type: Object, required: true},
});


export const PlanningTaskModel = mongoose.model<PlanningTask>('planning-task', PlanningTaskSchema);




