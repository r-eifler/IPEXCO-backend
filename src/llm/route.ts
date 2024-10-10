import { AssistantResponse } from 'ai';
import OpenAI from 'openai';
import { GoalTranslationRequest, QuestionTranslationRequest, ExplanationTranslationRequest } from './translators_interfaces';
import belugaPrompts from './data/prompts/beluga/prompts.json';
import belugaTemplates from './data/prompts/beluga/templates.json';
import { openai } from '@ai-sdk/openai'
import { openai_client } from './openai_client';


// UNUSED
export async function POST(req: Request) {
  const input = await req.json();

  // Create a thread if needed
  const threadId = input.threadId ?? (await openai_client.beta.threads.create({})).id;

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
  const createdMessage = await openai_client.beta.threads.messages.create(threadId, {
    role: 'user',
    content: messageContent,
  });

  return AssistantResponse(
    { threadId, messageId: createdMessage.id },
    async ({ forwardStream, sendDataMessage }) => {
      // Run the assistant on the thread
      const runStream = openai_client.beta.threads.runs.stream(threadId, {
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
          openai_client.beta.threads.runs.submitToolOutputsStream(
            threadId,
            runResult.id,
            { tool_outputs },
          ),
        );
      }
    },
  );
}

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