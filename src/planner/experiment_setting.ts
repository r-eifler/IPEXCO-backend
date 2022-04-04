import { PlanProperty } from '../db_schema/plan-properties/plan_property';
import { RelaxedTaskNode } from './utils';

export interface ExperimentSetting {
    plan_properties: PlanProperty[];
    hard_goals: string[];
    soft_goals: string[];
    relaxed_tasks: RelaxedTaskNode[];
}
