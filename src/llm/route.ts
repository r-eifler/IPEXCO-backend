import OpenAI from 'openai';
import { GoalTranslationRequest, QuestionTranslationRequest, ExplanationTranslationRequest } from './translators_interfaces';
import belugaPrompts from './data/prompts/beluga/prompts.json';
import belugaTemplates from './data/prompts/beluga/templates.json';
import { openai_client } from './openai_client';


export function prepareGoalTranslatorMessage(input: GoalTranslationRequest): string {
  const promptTemplate = belugaPrompts.goal_translator;

  // Replace placeholders with actual values
  return promptTemplate
    .replace('{predicates}', JSON.stringify(input.predicates))
    .replace('{objects}', JSON.stringify(input.objects));
}

export function prepareQuestionTranslatorMessage(input: QuestionTranslationRequest): string {
  const promptTemplate = belugaTemplates.question_translator;
  return promptTemplate
    .replace('{question}', input.question)

}

export function prepareExplanationTranslatorMessage(input: ExplanationTranslationRequest): string {
  const promptTemplate = belugaTemplates.explanation_translator;

  return promptTemplate
    .replace('{question}', input.question)
    
}