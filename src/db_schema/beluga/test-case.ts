import { array, boolean, nativeEnum, number, object, string, unknown, infer as zinfer } from "zod";
import { BelugaStateZ } from "./beluga_state";
import { BelugaActionZ } from "./beluga_plan";
import mongoose, { Schema } from "mongoose";


export const PolicyZ = object({
   name: string(),
   model: unknown()
})

export type Policy = zinfer<typeof PolicyZ>;



export enum TestRunStatus {
    PENDING = "PENDING",
    RUNNING = "RUNNING",
    FAILED = "FAILED",
    FINISHED = "FINISHED"
}

export const TestRunStatusZ = nativeEnum(TestRunStatus);

export const TestCaseZ = object({
    stateID: number(),
    testID: number(),
    state: BelugaStateZ,
    policyTrace: array(BelugaActionZ),
    policyCost: number(),
    classifiedAdBug: boolean(),
    status: TestRunStatusZ,
})

export type TestCase = zinfer<typeof TestCaseZ>;



export const TestCollectionZ = object({
   name: string(),
   policy: PolicyZ,
   numFuzzStates: number(),
   testCases: array(TestCaseZ)
})

export type TestCollection = zinfer<typeof TestCollectionZ>;



const PolicySchema = new Schema({
   name: {type: String, required: true},
   model: {type: Object, required: true},
});


const TestCaseSchema = new Schema({
   stateID: {type: Number, required: true},
   testID: {type: Number, required: true},
   state: {type: Object, required: true},
   policyTrace: [{type: Object}],
   policyCost: {type: Number, required: true},
   classifiedAdBug: {type: Boolean, required: true},
   status: {type: String, required: true},
});


const TestCollectionSchema = new Schema({
   name: {type: String, required: true},
   policy: {type: PolicySchema, required: true},
   numFuzzStates: {type: Number, required: true},
   testCases: [{type: TestCaseSchema}]
});

export const TestCollectionModel = mongoose.model<TestCollection>('policy-tests', TestCollectionSchema);
