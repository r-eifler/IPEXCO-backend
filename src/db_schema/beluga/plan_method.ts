import mongoose, { Schema } from "mongoose";
import { nativeEnum, number, object, optional, string, infer as zinfer } from "zod";

export enum PlanMethodType {
  MANUAL = "MANUAL",
  AUTOMATIC_SEARCH_PLANNER = 'AUTOMATIC_SEARCH_PLANNER',
  ACTION_POLICY = 'ACTION_POLICY',
}

export const PlanMethodTypeZ = nativeEnum(PlanMethodType);

export const PlanMethodZ = object({
  type: PlanMethodTypeZ,
  name: string(),
  serviceId: optional(string()),
  numOptimizedFlights: number()
});

export type PlanMethod = zinfer<typeof PlanMethodZ>


export const PlanMethodSchema = new Schema({
  type: {type: String, required: true},
  name: {type: String, required: true},
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'services', required: false },
  numOptimizedFlights: {type: Number, required: true},
});


export const ExplainMethodZ = object({
  name: string(),
  serviceId: optional(string()),
});

export type ExplainMethod = zinfer<typeof ExplainMethodZ>

