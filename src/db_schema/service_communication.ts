import { ExplanationRunStatus } from "./explanations";
import { PlanRunStatus } from "./iteration_step";
import { Action } from "./plan-properties/action_set";
import { PlanProperty } from "./plan-properties/plan_property";

export interface PlannerRequest  {
    id: string,
    callback: string,
    model: any;
    goals: PlanProperty[],
    softGoals: string[], // ids
    hardGoals: string[], // ids
}

export interface PlannerResponse  {
    id: string,
    status: PlanRunStatus,
    actions: Action[],
    runtime?: number // in sec
}


export interface ExplainerRequest  {
    id: string,
    callback: string,
    model: any;
    goals: PlanProperty[],
    softGoals: string[], // ids
    hardGoals: string[], // ids
}


export interface Result {
    MUGS:{
        complete: boolean,
        subsets: string[][] // plan property ids
    },
    MGCS:{
        complete: boolean,
        subsets: string[][] // plan property ids
    },
}

export interface ExplainerResponse  {
    id: string,
    status: ExplanationRunStatus,
    result: Result,
    runtime?: number // in sec
}