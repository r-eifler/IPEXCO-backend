import mongoose, { Schema } from "mongoose";

export interface DomainSpecification {
    name: string,
    planPropertyTemplates: string[]  ;
    description: string;
}

const DomainSpecificationSchema = new Schema({
    name: { type: String, required: false},
    planPropertyTemplates: [{ type: String, required: false}],
    description: { type: String, required: false},
}); 

export const DomainSpecificationModel = mongoose.model<DomainSpecification>('global-specification', DomainSpecificationSchema);
