
import { IterationStep } from "../db_schema/iteration_step";
import { PlanProperty } from "../db_schema/plan-properties/plan_property";
import { PDDLPredicate, PDDLObject } from "../db_schema/planning_task";
// goal-translator

export interface GoalTranslationRequest {
    goalDescription: string,
    predicates: PDDLPredicate[],
    objects: PDDLObject[],
    existingPlanProperties: PlanProperty[]
}

enum GoalTranslationStatus {
    success,
    error,
    unsupported,
    unconfident, // Please check result,
    alreadyExists
}

export interface GoalTranslationResponse {
    formula: string | undefined,
    status: GoalTranslationStatus,
    userInfo: string,
    existingPlanProperty: string | undefined,
    interactionHistory: string,
}


// question-translator


export interface QuestionTranslationRequest {
    question: string,
    enforcedGoals: PlanProperty[],
    satisfiedGoals: PlanProperty[],
    unsatisfiedGoals: PlanProperty[],
    existingPlanProperties: PlanProperty[]
}

enum QuestionTranslationStatus {
    success,
    error,
    unsupported,
    unconfident, // Please check result,
    directAnswer
}


export interface QuestionTranslationResponse {
    newProperties: {naturalLanguage: string, formula: string}[],
    status: QuestionTranslationStatus,
    userInfo: string,
    answer: string,
    question_type: string,
    questionArguments: PlanProperty[],
    interactionHistory: string,
}



// explanation-translator

export interface ExplanationTranslationRequest {
    question: string,
    question_type: string,
    questionArguments: PlanProperty[]
    MUGS: PlanProperty[][],
    MGCS: PlanProperty[][],
    predicates: PDDLPredicate[],
    objects: PDDLObject[],
    enforcedGoals: PlanProperty[],
    satisfiedGoals: PlanProperty[],
    unsatisfiedGoals: PlanProperty[],
    existingPlanProperties: PlanProperty[],
    history: IterationStep[]
}

enum ExplanationTranslationStatus {
    success,
    error,
    unsupported,
    unconfident, // Please check result,
    directAnswer
}


export interface ExplanationTranslationResponse {
    status: ExplanationTranslationStatus,
    userInfo: string,
    answer: string,
    interactionHistory: string,
}






  
