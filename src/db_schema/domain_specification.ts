import mongoose, { Schema } from "mongoose";
import { array, object, string, infer as zinfer } from "zod";
import { PlanPropertyTemplateZ } from "./plan-properties/plan_property_template";
import { EncodingZ } from "./services";

export const DomainSpecificationBaseZ = object({
    name: string(),
    encoding: EncodingZ,
    planPropertyTemplates: array(PlanPropertyTemplateZ),
    description: string(),
});

export type DomainSpecificationBase = zinfer<typeof DomainSpecificationBaseZ>;

export const DomainSpecificationZ = DomainSpecificationBaseZ.merge(
    object({
        _id: string(),
    })
);

export type DomainSpecification = zinfer<typeof DomainSpecificationZ>;

const DomainSpecificationSchema = new Schema({
    name: { type: String, required: false},
    encoding: { type: String, required: false},
    planPropertyTemplates: [{ type: Object, required: false}],
    description: { type: String, required: false},
}); 

export const DomainSpecificationModel = mongoose.model<DomainSpecification>('domain-specification', DomainSpecificationSchema);
