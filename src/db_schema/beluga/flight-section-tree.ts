import mongoose, { Schema } from "mongoose";
import { array, boolean, nativeEnum, nullable, number, object, optional, record, string, infer as zinfer } from "zod";
import { PlanRunStatusZ } from "../iteration_step";
import { BelugaActionZ } from "./beluga_plan";
import { PlanMethodSchema, PlanMethodZ } from "./plan_method";
import { BelugaSiteSetUpZ, BelugaSiteStateZ, SiteStatus } from "./site_set_up";
import { BelugaProblem } from "./beluga_problem";


export enum GoalConsiderationStatus {
    SKIP = "SKIP",
    CONSIDER = "CONSIDER",
}

export enum GoalSolvabilityStatus {
    UNKNOWN = "UNKNOWN",
    BLOCKED = "BLOCKED",
    NOT_ON_SITE = "NOT_ON_SITE",
    UNSOLVABLE = "UNSOLVABLE",
    SOLVABLE = "SOLVABLE"
}
  
export const GoalConsiderationStatusZ = nativeEnum(GoalConsiderationStatus);
export const GoalSolvabilityStatusZ = nativeEnum(GoalSolvabilityStatus);

export const FlightTargetScheduleZ = object({
    name: string(),
    incoming: array(object({
        jig: string(),
        considerationStatus: GoalConsiderationStatusZ,
        solvabilityStatus: GoalSolvabilityStatusZ,
    })),
    outgoing: array(object({
        jigType: string(),
        considerationStatus: GoalConsiderationStatusZ,
        solvabilityStatus: GoalSolvabilityStatusZ,
    })),
})


export const ProductionLineTargetScheduleZ = object({
    name: string(),
    schedule: array(object({
        jig: string(),
        considerationStatus: GoalConsiderationStatusZ,
        solvabilityStatus: GoalSolvabilityStatusZ,
    }))
})

export const FlightSectionBaseZ = object({
    flightIndex: number(),
    siteState: BelugaSiteStateZ,
    siteSetUp: BelugaSiteSetUpZ,
   
    incomingUnloaded: array(string()),
    outgoingLoaded: array(string()),
    productionLinesDelivered: record(string(),  array(string())),

    flightTargetSchedule: FlightTargetScheduleZ,
    productionLinesTargetSchedule: array(ProductionLineTargetScheduleZ),
    maxSwaps: nullable(number()),
    minEmptyRacks: nullable(number()),

    predecessorId: nullable(string()),
    treeId: string(),

    planMethod: optional(PlanMethodZ),
    actions: array(BelugaActionZ),
    status: PlanRunStatusZ,
    satisfiedProperties: array(string()).optional(),
    finished: boolean(),
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



// Functions

export function getTaskFromSection(section: FlightSection){

    const state = section.siteState;
    const setUp = section.siteSetUp;

    let task: BelugaProblem = {
        jigs: state.jigs,
        racks: setUp.racks.filter(r => r.status == SiteStatus.IN_USE).map(r => ({
            ...r, 
            jigs: state.racks[r.name]
        })),
        hangars: setUp.hangars.filter(h => h.status == SiteStatus.IN_USE).map(h => ({
            ...h, 
            jig: state.hangars[h.name]
        })),
        trailers_beluga: setUp.belugaTrailers.filter(t => t.status == SiteStatus.IN_USE).map(t => ({
            ...t, 
            jig: state.trailers[t.name]
        })),
        trailers_factory: setUp.factoryTrailers.filter(t => t.status == SiteStatus.IN_USE).map(t => ({
            ...t, 
            jig: state.trailers[t.name]
        })),
        jig_types: setUp.jig_types,
        production_lines: section.productionLinesTargetSchedule.map(pl => ({
            ...pl,
            schedule: pl.schedule.filter(j => j.considerationStatus == GoalConsiderationStatus.CONSIDER).map(j => j.jig)
        })),
        flights: [{
            ...section.flightTargetSchedule,
            incoming: section.flightTargetSchedule.incoming.filter(j => j.considerationStatus == GoalConsiderationStatus.CONSIDER).map(j => j.jig),
            outgoing: section.flightTargetSchedule.outgoing.filter(j => j.considerationStatus == GoalConsiderationStatus.CONSIDER).map(j => j.jigType),
        }]
    }
    return task;
}

// export function deriveSuccessor(section: FlightSection, task: BelugaProblem){
//     if(section.startState === undefined){
//         return undefined;
//     }
//     let newStartState = applyActions(section.startState, section.actions, task);
//     if (newStartState == undefined){
//         return undefined;
//     }
//     let suc = {
//         flightIndex: section.flightIndex + 1,
//         startState: newStartState,
//         status: PlanRunStatus.PENDING,
//         predecessorId: section._id,
//         treeId: section.treeId,
//         actions: [],
//         planMethod: section.planMethod,
//         user: section.user
//     }
//     return suc;
// }


// Mongo

const FlightSectionSchema = new Schema({
    flightIndex: { type: Number, required: true},
    siteState: {type: Object, required: true},
    siteSetUp: {type: Object, required: true},

    incomingUnloaded: [{type: String, required: false}],
    outgoingLoaded: [{type: String, required: false}],
    productionLinesDelivered: {type: Map, of: [String], required: true},

    flightTargetSchedule: {type: Object, required: false},
    productionLinesTargetSchedule: [{type: Object, required: false}],
    maxSwaps: {type: Number, required: false},
    minEmptyRacks: {type: Number, required: false},

    
    predecessorId: { type: mongoose.Schema.Types.ObjectId, ref: 'flight-plan-section', required: false},
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    treeId: { type: mongoose.Schema.Types.ObjectId, ref: 'flight-plan-tree' },
    finished: {type: Boolean, required: true},

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

