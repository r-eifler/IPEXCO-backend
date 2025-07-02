import mongoose, { Schema } from "mongoose";
import { array, boolean, nativeEnum, number, object, string, infer as zinfer } from "zod";
import { BelugaActionZ } from "./beluga_plan";
import { BelugaProblemZ } from "./beluga_problem";

export const FileUploadZ = object({
   filename: string(),
   originalname: string()
})

export type FileUpload = zinfer<typeof FileUploadZ>;


export const PolicyZ = object({
   name: string(),
   modelFileName: string()
})

export type Policy = zinfer<typeof PolicyZ>;



export enum TestRunStatus {
    PENDING = "PENDING",
    RUNNING = "RUNNING",
    FAILED = "FAILED",
    FINISHED = "FINISHED"
}

export const TestRunStatusZ = nativeEnum(TestRunStatus);

export enum TestStateGenerationMethod{
    MANUAL = "MANUAL",
    FUZZING = "FUZZING"
}

export const TestStateGenerationMethodZ = nativeEnum(TestStateGenerationMethod);

export const TestCaseZ = object({
    stateID: number(),
    testID: number().optional(),
    state: BelugaProblemZ.optional(),
    policyTrace: array(BelugaActionZ).optional(),
    policyCost: number().nullable().optional(),
    classifiedAdBug: boolean(),
    status: TestRunStatusZ,
    method: TestStateGenerationMethodZ,
})

export type TestCase = zinfer<typeof TestCaseZ>;



export const TestSuiteBaseZ = object({
   name: string(),
   project: string(),
   policy: PolicyZ,
   numFuzzStates: number(),
   status: TestRunStatusZ,
   flightSection: string(),
   testCases: array(TestCaseZ)
})

export type TestSuiteBase = zinfer<typeof TestSuiteBaseZ>;

export const TestSuiteZ = TestSuiteBaseZ.merge(object({
  _id: string(),
}));

export type TestSuite = zinfer<typeof TestSuiteZ>;


const PolicySchema = new Schema({
   name: {type: String, required: true},
   modelFileName: {type: String, required: true},
});


const TestCaseSchema = new Schema({
   stateID: {type: Number, required: false},
   testID: {type: Number, required: false},
   state: {type: Object, required: false},
   policyTrace: [{type: Object}],
   policyCost: {type: Number, required: false},
   classifiedAdBug: {type: Boolean, required: false},
   status: {type: String, required: false},
   method: {type: String, required: false},
});


const TestSuiteSchema = new Schema({
   name: {type: String, required: true},
   project: { type: mongoose.Schema.Types.ObjectId, ref: 'project', required: true},
   policy: {type: PolicySchema, required: true},
   numFuzzStates: {type: Number, required: true},
   testCases: [{type: TestCaseSchema}],
   flightSection: { type: mongoose.Schema.Types.ObjectId, ref: 'flight-plan-section', required: true},
   status: {type: String, required: true},
});

export const TestCollectionModel = mongoose.model<TestSuite>('policy-tests', TestSuiteSchema);
