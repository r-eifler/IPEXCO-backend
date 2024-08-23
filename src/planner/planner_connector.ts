import { PlanRun } from '../db_schema/iteration_step';
import { ActionSet } from '../db_schema/plan-properties/action_set';
import { PlanProperty } from '../db_schema/plan-properties/plan_property';

export interface PlanPropertyData {
    name: string;
    type: string;
    formula: string;
    actionSets: [ActionSet];
}

interface PlanRunData {
    domainFile: string;
    problemFile: string;
    planProperties: PlanProperty[];
    goals: string;
}

interface PlanRunResult {

}

export class PlannerConnector{

    constructor(private baseURL: string) {
    }


    computePlan(planRun: PlanRun) {

    }

    loadPlanData(){

    }

}
