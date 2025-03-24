import mongoose, { Schema } from "mongoose";
import { array, date, number, object, string, unknown, infer as zinfer } from "zod";
import { PlanRunStatusZ } from "./iteration_step";
import { ActionZ } from "./plan-properties/action_set";

export const PlanBaseZ = object({
    name: string(),
    project: string(),
    planner: string(),
    status: PlanRunStatusZ,
    actions: array(unknown()).nullish(),
    runTime: number().nullish(),
});

export type PlanBase = zinfer<typeof PlanBaseZ>;

export const PlanZ = PlanBaseZ.merge(object({
    _id: string(),
    createdAt: date(), 
    user: string()
}));

export type Plan = zinfer<typeof PlanZ>;

const PlanSchema = new Schema({
    name: { type: String, required: true},
    planner: { type: String, required: true},
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, required: true},
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'base-project' },
    actions: { type: Object, required: false},
    runTime: { type: Number, required: false},
}, { timestamps: true});

export const PlanModel = mongoose.model<Plan>('plans', PlanSchema);


