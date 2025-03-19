import { array, object, optional, record, string, infer as zinfer } from "zod";
import { GoalTypeZ, PlanPropertyDefinitionZ } from "./plan_property";

export const ActionSetsTemplatesZ = object({
    name: string(),
    actionTemplates: array(string()),
  });
  
  export type ActionSetsTemplates = zinfer<typeof ActionSetsTemplatesZ>;
  
  
  
  export const PlanPropertyTemplateZ = object({
    class: string(),
    color: string(),
    icon: string(),
    type: GoalTypeZ,
    variables: record(string(),array(string())),
    nameTemplate: string(),
    definitionTemplate: PlanPropertyDefinitionZ,
    formulaTemplate: optional(string()),
    actionSetsTemplates: optional(array(ActionSetsTemplatesZ)),
    sentenceTemplate: string(),
    initVariableConstraints: optional(array(string())),
    goalVariableConstraints: optional(array(string())),
  });
  
  export type PlanPropertyTemplate = zinfer<typeof PlanPropertyTemplateZ>;