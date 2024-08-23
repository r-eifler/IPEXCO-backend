import mongoose, { Schema } from 'mongoose';


export interface Runner extends Document{
    _id?: string;
    name: string;
    docker: string
}

const RunnerSchema = new Schema({
    name: { type: String, required: true},
    docker: { type: String, required: true},
});

export const RunnerModel = mongoose.model<Runner>('runner', RunnerSchema);

export enum Encoding{
    classic,
    numeric
  }


export interface Planner  extends Runner{
    encoding: Encoding;
}

const PlannerSchema = new Schema({
    encoding: { type: Number, required: false},
});


export const PlannerModel = RunnerModel.discriminator<Planner>('planner', PlannerSchema);



export interface Explainer  extends Runner{
    encoding: Encoding;
}

const ExplainerSchema = new Schema({
    encoding: { type: Number, required: false},
});


export const ExplainerModel = RunnerModel.discriminator<Explainer>('explainer', ExplainerSchema);

