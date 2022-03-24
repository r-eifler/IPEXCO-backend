import { DepExplanationRun, RelaxationExplanationRun } from './../db_schema/iteration_step';
import { IterationStep } from '../db_schema/iteration_step';
import { deleteResultFile } from '../planner/pddl_file_utils';


export async function deleteIterationStep(step: IterationStep) {
    if (step.plan && step.plan.log) {
        deleteResultFile(step.plan.log);
    }
    step.delete();
}