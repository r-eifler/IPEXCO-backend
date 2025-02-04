import mongoose, { Schema } from 'mongoose';


export enum Encoding{
    PDDL_CLASSIC = 'PDDL_CLASSIC',
    PDDL_NUMERIC = 'PDDL_NUMERIC',
    DOMAIN_DEPENDENT = 'DOMAIN_DEPENDENT'
  }

export interface Service extends Document{
    _id?: string;
    name: string;
    domainId?: string;
    url: string;
    apiKey: string;
    encoding: Encoding;
}

const ServiceSchema = new Schema({
    name: { type: String, required: true},
    domainId: { type: mongoose.Schema.Types.ObjectId, ref: 'domain-specification', required: false},
    url: { type: String, required: true},
    apiKey: { type: String, required: true},
    encoding: { type: String, required: true},
});

export const ServiceModel = mongoose.model<Service>('services', ServiceSchema);

export interface Planner  extends Service{
}

const PlannerSchema = new Schema({
});


export const PlannerModel = ServiceModel.discriminator<Planner>('planner', PlannerSchema);



export interface Explainer  extends Service{
}

const ExplainerSchema = new Schema({
});


export const ExplainerModel = ServiceModel.discriminator<Explainer>('explainer', ExplainerSchema);

