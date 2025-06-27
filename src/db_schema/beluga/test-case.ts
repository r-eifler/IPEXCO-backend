import mongoose, { Schema } from "mongoose";
import { array, boolean, nativeEnum, number, object, string, infer as zinfer } from "zod";
import { BelugaActionZ } from "./beluga_plan";
import { BelugaStateZ } from "./beluga_state";
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
    testID: number(),
    state: BelugaProblemZ,
    policyTrace: array(BelugaActionZ),
    policyCost: number().nullable(),
    classifiedAdBug: boolean(),
    status: TestRunStatusZ,
    method: TestStateGenerationMethodZ,
})

export type TestCase = zinfer<typeof TestCaseZ>;



export const TestCollectionBaseZ = object({
   name: string(),
   project: string(),
   policy: PolicyZ,
   numFuzzStates: number(),
   status: TestRunStatusZ,
   testCases: array(TestCaseZ)
})


export type TestCollectionBase = zinfer<typeof TestCollectionBaseZ>;

export const TestCollectionZ = TestCollectionBaseZ.merge(object({
  _id: string(),
}));

export type TestCollection = zinfer<typeof TestCollectionZ>;



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


const TestCollectionSchema = new Schema({
   name: {type: String, required: true},
   project: { type: mongoose.Schema.Types.ObjectId, ref: 'project', required: true},
   policy: {type: PolicySchema, required: true},
   numFuzzStates: {type: Number, required: true},
   testCases: [{type: TestCaseSchema}],
   status: {type: String, required: true},
});

export const TestCollectionModel = mongoose.model<TestCollection>('policy-tests', TestCollectionSchema);
