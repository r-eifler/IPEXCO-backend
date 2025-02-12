import mongoose, { Schema } from "mongoose";
import { Encoding } from "./services";

export interface DomainSpecification extends Document{
    _id?: string;
    name: string,
    encoding: Encoding,
    planPropertyTemplates: unknown[]  ;
    description: string;
}

const DomainSpecificationSchema = new Schema({
    name: { type: String, required: false},
    encoding: { type: String, required: false},
    planPropertyTemplates: [{ type: Object, required: false}],
    description: { type: String, required: false},
}); 

export const DomainSpecificationModel = mongoose.model<DomainSpecification>('domain-specification', DomainSpecificationSchema);
