import mongoose, { Schema } from 'mongoose';
import { z } from "zod";

export enum ServiceType {
    PLANNER = 'PLANNER',
    EXPLAINER = 'EXPLAINER',
    PROPERTY_CHECKER = 'PROPERTY_CHECKER',
    TESTER = 'TESTER',
    VERIFIER = 'VERIFIER',
    NONE = 'NONE'
}

export enum Encoding{
    PDDL_CLASSIC = 'PDDL_CLASSIC',
    PDDL_NUMERIC = 'PDDL_NUMERIC',
    DOMAIN_DEPENDENT = 'DOMAIN_DEPENDENT',
    NONE = 'NONE'
}

const ServiceTypeZ = z.nativeEnum(ServiceType);
const EncodingZ = z.nativeEnum(Encoding);

export const ServiceBaseZ = z.object({
    name: z.string(),
    type : ServiceTypeZ,
    domainId: z.nullable(z.string()),
    url: z.string(),
    apiKey: z.string(),
    encoding: EncodingZ,
});

export type ServiceBase = z.infer<typeof ServiceBaseZ>;

export const ServiceZ = ServiceBaseZ.merge(
    z.object({
        _id: z.string(),
    })
)

export type Service = z.infer<typeof ServiceZ>;


const ServiceSchema = new Schema({
    name: { type: String, required: true},
    type: { type: String, required: true},
    domainId: { type: mongoose.Schema.Types.ObjectId, ref: 'domain-specification', required: false},
    url: { type: String, required: true},
    apiKey: { type: String, required: true},
    encoding: { type: String, required: true},
});

export const ServiceModel = mongoose.model<Service>('services', ServiceSchema);

