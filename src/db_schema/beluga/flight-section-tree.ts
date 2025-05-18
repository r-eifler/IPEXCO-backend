import mongoose, { Schema } from "mongoose";
import { array, boolean, nullable, number, object, optional, record, string, infer as zinfer } from "zod";
import { ExplanationRunStatusZ } from "../explanations";
import { PlanRunStatusZ } from "../iteration_step";
import { SimplePlanPropertyZ } from "../plan-properties/plan_property";
import { BelugaActionZ } from "./beluga_plan";
import { BelugaProblem } from "./beluga_problem";
import { PlanMethodSchema, PlanMethodZ } from "./plan_method";
import { BelugaSiteSetUpZ, BelugaSiteStateZ, SiteStatus } from "./site_set_up";


export const FlightTargetScheduleZ = object({
    name: string(),
    incoming: array(object({
        jig: string(),
        skip: boolean(),
    })),
    outgoing: array(object({
        jigType: string(),
        skip: boolean(),
        onSite: boolean(),
    })),
})


export const ProductionLineTargetScheduleZ = object({
    name: string(),
    schedule: array(object({
        jig: string(),
        skip: boolean(),
        onSite: boolean(),
    }))
})

export const ExplanationsZ = object({
    MUGS: array(array(string())),
    MUGScomplete: boolean(),
    MGCS: array(array(string())),
    MGCScomplete: boolean(),
    goals: record(string(), SimplePlanPropertyZ)
})


export const BelugaConfigurationZ = object({
    siteSetUp: BelugaSiteSetUpZ,
    flightTargetSchedule: FlightTargetScheduleZ,
    productionLinesTargetSchedule: array(ProductionLineTargetScheduleZ),
    maxSwaps: nullable(number()),
    minEmptyRacks: nullable(number()),
    explanations: nullable(ExplanationsZ),
    explanationStatus: ExplanationRunStatusZ
})

export type BelugaConfiguration = zinfer<typeof BelugaConfigurationZ>;

export const FlightSectionBaseZ = object({
    predecessorId: nullable(string()),
    treeId: string(),

    flightIndex: number(),
    siteState: BelugaSiteStateZ,
    configurationIndex: number(),
    configurations: array(BelugaConfigurationZ),
    
    planMethod: optional(PlanMethodZ),
    actions: array(BelugaActionZ),
    status: PlanRunStatusZ,
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
    const configuration = section.configurations[section.configurationIndex]
    const setUp = configuration.siteSetUp;

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
        production_lines: configuration.productionLinesTargetSchedule.map(pl => ({
            ...pl,
            schedule: pl.schedule.filter(j => !j.skip).map(j => j.jig)
        })),
        flights: [{
            ...configuration.flightTargetSchedule,
            incoming: configuration.flightTargetSchedule.incoming.filter(j => !j.skip).map(j => j.jig),
            outgoing: configuration.flightTargetSchedule.outgoing.filter(j => !j.skip).map(j => j.jigType),
        }]
    }
    return task;
}

export function getExplanationTaskFromSectionWithFullSite(section: FlightSection){

    const state = section.siteState;
    const configuration = section.configurations[section.configurationIndex]
    const setUp = configuration.siteSetUp;

    let task: BelugaProblem = {
        jigs: state.jigs,
        racks: setUp.racks.map(r => ({
            ...r, 
            jigs: state.racks[r.name]
        })),
        hangars: setUp.hangars.map(h => ({
            ...h, 
            jig: state.hangars[h.name]
        })),
        trailers_beluga: setUp.belugaTrailers.map(t => ({
            ...t, 
            jig: state.trailers[t.name]
        })),
        trailers_factory: setUp.factoryTrailers.map(t => ({
            ...t, 
            jig: state.trailers[t.name]
        })),
        jig_types: setUp.jig_types,
        production_lines: configuration.productionLinesTargetSchedule.map(pl => ({
            ...pl,
            schedule: []
        })),
        flights: [{
            ...configuration.flightTargetSchedule,
            incoming: [],
            outgoing: [],
        }]
    }
    return task;
}


// Mongo

const BelugaConfigurationSchema = new Schema({
    siteSetUp: {type: Object, required: true},
    flightTargetSchedule: {type: Object, required: false},
    productionLinesTargetSchedule: [{type: Object, required: false}],
    maxSwaps: {type: Number, required: false},
    minEmptyRacks: {type: Number, required: false},
    explanations: {type: Object, required: false},
    explanationStatus: {type: String, required: false},
}, { timestamps: true});

const FlightSectionSchema = new Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    predecessorId: { type: mongoose.Schema.Types.ObjectId, ref: 'flight-plan-section', required: false},
    treeId: { type: mongoose.Schema.Types.ObjectId, ref: 'flight-plan-tree' },

    flightIndex: { type: Number, required: true},
    siteState: {type: Object, required: true},
    configurationIndex: { type: Number, required: true},
    configurations: [{type: BelugaConfigurationSchema, required: false}],
    
    planMethod: { type: PlanMethodSchema, required: false},
    actions: [{type: Object, required: false}],
    status: {type: String, required: false},
    finished: {type: Boolean, required: true},
}, { timestamps: true});

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

