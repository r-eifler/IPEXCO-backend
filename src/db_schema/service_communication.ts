import { any, array, boolean, nativeEnum, number, object, string, unknown, infer as zinfer } from "zod";
import { ExplanationRunStatusZ } from "./explanations";
import { PlanRunStatusZ } from "./iteration_step";
import { Action, ActionZ } from "./plan-properties/action_set";
import { PlanProperty, PlanPropertyZ } from "./plan-properties/plan_property";



export const PlannerRequestZ = object({
    id: string(),
    callback: string(),
    model: any(),
    goals: array(PlanPropertyZ),
    softGoals:array(string()), // ids
    hardGoals: array(string()), // ids
});

export type PlannerRequest = zinfer<typeof PlannerRequestZ>;

export const  PlannerResponseZ  = object({
    id: string(),
    status: PlanRunStatusZ,
    actions: array(ActionZ),
    runtime: number().optional() // in sec
});

export type PlannerResponse = zinfer<typeof PlannerResponseZ>;


export const SimplePlannerRequestZ = object({
    id: string(),
    callback: string(),
    model: any(),
});

export type SimplePlannerRequest = zinfer<typeof SimplePlannerRequestZ>;

export const  SimplePlannerResponseZ  = object({
    id: string(),
    status: PlanRunStatusZ,
    actions: array(ActionZ),
    runtime: number().optional() // in sec
});

export type SimplePlannerResponse = zinfer<typeof SimplePlannerResponseZ>;


export const ExplainerRequestZ = object({
    id: string(),
    callback: string(),
    model: any(),
    goals: array(PlanPropertyZ),
    softGoals:array(string()), // ids
    hardGoals: array(string()), // ids
});

export type ExplainerRequest = zinfer<typeof ExplainerRequestZ>;

export const ResultZ = object({
    MUGS:object({
        complete: boolean(),
        subsets: array(array(string())) // plan property ids
    }),
    MGCS:object({
        complete: boolean(),
        subsets: array(array(string())) // plan property ids
    }),
});

export type Result = zinfer<typeof ResultZ>;

export const ExplainerResponseZ = object({
    id: string(),
    status: ExplanationRunStatusZ,
    result: ResultZ,
    runtime: number().optional() // in sec
});

export type ExplainerResponse = zinfer<typeof ExplainerResponseZ>;


export enum PropertyCheckRunStatus {
	PENDING = "PENDING",
	RUNNING = "RUNNING",
	FAILED = "FAILED",
	FINISHED = "FINISHED",
	CANCELED = "CANCELED",
}

export const PropertyCheckRunStatusZ = nativeEnum(PropertyCheckRunStatus);

export const PropertyCheckerRequestZ = object({
	id: string(),
	callback: string(),
	model: unknown(),
	goals: array(PlanPropertyZ),
	actions: array(ActionZ),
});

export type PropertyCheckerRequest = zinfer<typeof PropertyCheckerRequestZ>;

export const PropertyCheckerResponseZ = object({
	id: string(),
	status: PropertyCheckRunStatusZ,
	satisfiedProperties: array(string()).nullable(),
});

export type PropertyCheckerResponse = zinfer<typeof PropertyCheckerResponseZ>;