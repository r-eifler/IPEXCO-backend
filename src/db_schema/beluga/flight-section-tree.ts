import mongoose, { Schema } from "mongoose";
import { array, nullable, number, object, optional, string, unknown, infer as zinfer } from "zod";
import { PlanRunStatus, PlanRunStatusZ } from "../iteration_step";
import { applyActions, BelugaStateZ } from "./beluga_state";
import { PlanMethodSchema, PlanMethodZ } from "./plan_method";
import { BelugaProblem } from "./beluga_problem";
import { BelugaActionZ } from "./beluga_plan";


export const FlightSectionBaseZ = object({
    flightIndex: number(),
    startState: optional(BelugaStateZ),
    predecessorId: nullable(string()),
    treeId: string(),

    planMethod: optional(PlanMethodZ),
    actions: array(BelugaActionZ),
    status: PlanRunStatusZ,
    satisfiedProperties: array(string()).optional(),
})

export type FlightSectionBase = zinfer<typeof FlightSectionBaseZ>;

export const FlightSectionZ = FlightSectionBaseZ.merge(object({
        _id: string(),
        user: string(),
    })
);

export type FlightSection = zinfer<typeof FlightSectionZ>;

export const FlightPlanBranchZ = object({
    name: string(),
    sectionIdHead: string(),
})

export type FlightPlanBranch = zinfer<typeof FlightPlanBranchZ>;


export const FlightPlanTreeBaseZ = object({
    branches: array(FlightPlanBranchZ),
    selectedBranch: number(),
    selectedSectionId: nullable(string()),

    project: string()
})

export type FlightPlanTreeBase = zinfer<typeof FlightPlanTreeBaseZ>;


export const FlightPlanTreeZ = FlightPlanTreeBaseZ.merge(object({
        _id: string(),
        user: string(),
    })
);

export type FlightPlanTree = zinfer<typeof FlightPlanTreeZ>;

export function deriveSuccessor(section: FlightSection, task: BelugaProblem){
    if(section.startState === undefined){
        return undefined;
    }
    let newStartState = applyActions(section.startState, section.actions, task);
    if (newStartState == undefined){
        return undefined;
    }
    let suc = {
        flightIndex: section.flightIndex + 1,
        startState: newStartState,
        status: PlanRunStatus.PENDING,
        predecessorId: section._id,
        treeId: section.treeId,
        actions: [],
        planMethod: section.planMethod,
        user: section.user
    }
    return suc;
}


// Mongo

const FlightSectionSchema = new Schema({
    flightIndex: { type: Number, required: true},
    startState: {type: Object, required: false},
    predecessorId: { type: mongoose.Schema.Types.ObjectId, ref: 'flight-plan-section', required: false},
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    treeId: { type: mongoose.Schema.Types.ObjectId, ref: 'flight-plan-tree' },

    planMethod: { type: PlanMethodSchema, required: false},
    actions: [{type: Object, required: false}],
    status: {type: String, required: false},
    satisfiedProperties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'plan-property', required: false}],
});

export const FlightSectionModel = mongoose.model<FlightSection>('flight-plan-section', FlightSectionSchema);

const FlightPlanBranchSchema = new Schema({
    name: {type: String, required: true},
    sectionIdHead: {type: String, required: false},
});

const FlightPlanTreeSchema = new Schema({
    branches:  [{ type: FlightPlanBranchSchema}],
    selectedBranch: { type: Number, required: true},
    selectedSectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'flight-plan-section', required: false},
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'project', required: true},
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});


export const FlightPlanTreeModel = mongoose.model<FlightPlanTree>('flight-plan-tree', FlightPlanTreeSchema);

