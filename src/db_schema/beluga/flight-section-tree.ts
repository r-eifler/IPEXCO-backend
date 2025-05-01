import { array, boolean, nullable, number, object, optional, record, string, unknown, infer as zinfer } from "zod";
import { PlanRunStatusZ } from "../iteration_step";
import mongoose, { Schema } from "mongoose";


export const FlightSectionBaseZ = object({
    flightIndex: number(),
    startState: optional(unknown()),
    finished: boolean(),
    predecessorId: nullable(string()),
    treeId: string(),

    actions: array(unknown()),
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



// Mongo

const FlightSectionSchema = new Schema({
    flightIndex: { type: Number, required: true},
    startState: {type: Object, required: false},
    finished:  { type: Boolean, required: true},
    predecessorId: { type: mongoose.Schema.Types.ObjectId, ref: 'flight-plan-section', required: false},
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    treeId: { type: mongoose.Schema.Types.ObjectId, ref: 'flight-plan-tree' },

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
    selectedSectionId: {type: String, required: false},
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'project', required: true},
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});


export const FlightPlanTreeModel = mongoose.model<FlightPlanTree>('flight-plan-tree', FlightPlanTreeSchema);

