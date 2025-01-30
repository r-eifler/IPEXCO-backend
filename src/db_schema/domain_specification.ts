import mongoose, { Schema } from "mongoose";

export interface DomainSpecification {
    name: string,
    planPropertyTemplates: any[]  ;
    description: string;
}

const DomainSpecificationSchema = new Schema({
    name: { type: String, required: false},
    planPropertyTemplates: [{ type: Object, required: false}],
    description: { type: String, required: false},
}); 

export const DomainSpecificationModel = mongoose.model<DomainSpecification>('global-specification', DomainSpecificationSchema);
