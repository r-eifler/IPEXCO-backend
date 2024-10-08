
import { IterationStep } from "../../../IPEXCO-frontend/src/app/iterative_planning/domain/iteration_step";
import { PlanProperty } from "../../../IPEXCO-frontend/src/app/iterative_planning/domain/plan-property/plan-property";
import { PDDLPredicate, PDDLObject } from "../../../IPEXCO-frontend/src/app/interface/planning-task";
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
    predicates: PDDLPredicate[], // why ??
    objects: PDDLObject[], // why ??
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






  
