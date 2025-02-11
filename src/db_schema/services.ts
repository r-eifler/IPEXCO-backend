import mongoose, { Schema } from 'mongoose';

export enum ServiceType {
    PLANNER = 'PLANNER',
    EXPLAINER = 'EXPLAINER',
    PROPERTY_CHECKER = 'PROPERTY_CHECKER',
    TESTER = 'TESTER',
    VERIFIER = 'VERIFIER'
}


export enum Encoding{
    PDDL_CLASSIC = 'PDDL_CLASSIC',
    PDDL_NUMERIC = 'PDDL_NUMERIC',
    DOMAIN_DEPENDENT = 'DOMAIN_DEPENDENT'
  }

export interface Service extends Document{
    _id?: string;
    name: string;
    type: ServiceType;
    domainId?: string;
    url: string;
    apiKey: string;
    encoding: Encoding;
}

const ServiceSchema = new Schema({
    name: { type: String, required: true},
    type: { type: String, required: true},
    domainId: { type: mongoose.Schema.Types.ObjectId, ref: 'domain-specification', required: false},
    url: { type: String, required: true},
    apiKey: { type: String, required: true},
    encoding: { type: String, required: true},
});

export const ServiceModel = mongoose.model<Service>('services', ServiceSchema);

