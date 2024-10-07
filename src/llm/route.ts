import { AssistantResponse } from 'ai';
import OpenAI from 'openai';
import { PDDLPredicate, PDDLObject, PlanProperty, GoalTranslationRequest, QuestionTranslationRequest, ExplanationTranslationRequest } from '../interface';
import belugaPrompts from '../data/prompts/beluga/prompts.json';
import belugaTemplates from '../data/prompts/beluga/templates.json';

require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set in the environment variables');
}

if (!process.env.ASSISTANT_ID_GT || !process.env.ASSISTANT_ID_QT || !process.env.ASSISTANT_ID_ET) {
    throw new Error('ASSISTANT_ID_GT, ASSISTANT_ID_QT, or ASSISTANT_ID_ET is not set in the environment variables. Run initialize_assistants.ts to set them.');
}

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

type Translator = "GoalTranslator" | "QuestionTranslator" | "ExplanationTranslator";

export async function POST(req: Request) {
  const input = await req.json();

  // Create a thread if needed
  const threadId = input.threadId ?? (await openai.beta.threads.create({})).id;

  // Prepare the message content based on the translator type
  let messageContent = '';
  switch (input.translator) {
    case 'GoalTranslator':
      messageContent = prepareGoalTranslatorMessage(input);
      break;
    case 'QuestionTranslator':
      messageContent = prepareQuestionTranslatorMessage(input);
      break;
    case 'ExplanationTranslator':
      messageContent = prepareExplanationTranslatorMessage(input);
      break;
    default:
      throw new Error(`Unknown translator type: ${input.translator}`);
  }

  // Add the prepared message to the thread
  const createdMessage = await openai.beta.threads.messages.create(threadId, {
    role: 'user',
    content: messageContent,
  });

  return AssistantResponse(
    { threadId, messageId: createdMessage.id },
    async ({ forwardStream, sendDataMessage }) => {
      // Run the assistant on the thread
      const runStream = openai.beta.threads.runs.stream(threadId, {
        assistant_id:
          process.env.ASSISTANT_ID ??
          (() => {
            throw new Error('ASSISTANT_ID is not set');
          })(),
      });

      // forward run status would stream message deltas
      let runResult = await forwardStream(runStream);

      // status can be: queued, in_progress, requires_action, cancelling, cancelled, failed, completed, or expired
      while (
        runResult?.status === 'requires_action' &&
        runResult.required_action?.type === 'submit_tool_outputs'
      ) {
        const tool_outputs =
          runResult.required_action.submit_tool_outputs.tool_calls.map(
            (toolCall: any) => {
              const parameters = JSON.parse(toolCall.function.arguments);

              switch (toolCall.function.name) {
                // configure your tool calls here

                default:
                  throw new Error(
                    `Unknown tool call function: ${toolCall.function.name}`,
                  );
              }
            },
          );

        runResult = await forwardStream(
          openai.beta.threads.runs.submitToolOutputsStream(
            threadId,
            runResult.id,
            { tool_outputs },
          ),
        );
      }
    },
  );
}

function prepareGoalTranslatorMessage(input: GoalTranslationRequest): string {
  const promptTemplate = belugaPrompts.goal_translator;

  // Replace placeholders with actual values
  return promptTemplate
    .replace('{predicates}', JSON.stringify(input.predicates))
    .replace('{objects}', JSON.stringify(input.objects));
}

function prepareQuestionTranslatorMessage(input: QuestionTranslationRequest): string {
  const promptTemplate = belugaTemplates.question_translator;
  return promptTemplate
    .replace('{question}', input.question)

}

function prepareExplanationTranslatorMessage(input: ExplanationTranslationRequest): string {
  const promptTemplate = belugaTemplates.explanation_translator;

  return promptTemplate
    .replace('{question}', input.question)
    
}