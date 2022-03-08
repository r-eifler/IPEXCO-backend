import { DepExplanationRun, RelaxationExplanationRun } from './../db_schema/iteration_step';
import { DepExplanationRunModel, IterationStep, RelaxationExplanationRunModel } from '../db_schema/iteration_step';
import { deleteResultFile } from '../planner/pddl_file_utils';


export async function deleteIterationStep(step: IterationStep) {
    if (step.plan) {
        deleteResultFile(step.plan.log);
    }
    for(const depExp of step.depExplanations) {
        deleteDepExplanation(depExp);
    }
}

export async function deleteDepExplanation(depExp: DepExplanationRun) {
    for(const relaxExp of depExp.relaxationExplanations){
        deleteRelaxationExplanation(relaxExp);
    }
    deleteResultFile(depExp.log);
    await DepExplanationRunModel.deleteOne({_id: depExp._id})
    
}

export async function deleteRelaxationExplanation(relaxExp: RelaxationExplanationRun) {
    deleteResultFile(relaxExp.log);
    await RelaxationExplanationRunModel.deleteOne({_id: relaxExp._id})
}