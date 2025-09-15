import { openai_client } from "../llm/openai_client";
import { LLMContext, LLMMessage, OutputFormat } from '../db_schema/llm-context';
import { LLMRequestLogModel } from '../db_schema/llm-request-log';

export async function processQtRequest(input: string, llmContext: LLMContext, settings: any) {
    const context = llmContext.seenByQTMessages;
    const outputFormat = llmContext.outputFormatQT;

    return await processAnyRequest(input, context, outputFormat, settings, 'QT', {
        project: llmContext.project,
        user: llmContext.user,
        iterationStepId: llmContext.iterationStepId
    });
}

export async function processGtRequest(input: string, llmContext: LLMContext, settings: any) {
    const context = llmContext.seenByGTMessages;
    const outputFormat = llmContext.outputFormatGT;

    return await processAnyRequest(input, context, outputFormat, settings, 'GT', {
        project: llmContext.project,
        user: llmContext.user,
        iterationStepId: llmContext.iterationStepId
    });
}

export async function processEtRequest(input: string, llmContext: LLMContext, settings: any) {
    const context = llmContext.seenByETMessages;
    const outputFormat = llmContext.outputFormatET;
    
    return await processAnyRequest(input, context, outputFormat, settings, 'ET', {
        project: llmContext.project,
        user: llmContext.user,
        iterationStepId: llmContext.iterationStepId
    });
}

async function processAnyRequest(
    input: string, 
    previousMessages: LLMMessage[], 
    outputFormat: OutputFormat, 
    settings: any,
    requestType: 'QT' | 'GT' | 'ET' | 'GENERIC' = 'GENERIC',
    contextInfo?: {
        project?: string | null;
        user?: string | null;
        iterationStepId?: string | null;
    }
) {
    const startTime = Date.now();
    let success = false;
    let error: string | undefined;
    let response: any;

    try {
        // Validate schema if present
        if (outputFormat.schema) {
            try {
                JSON.parse(outputFormat.schema);
            } catch (schemaError) {
                // Schema validation failed, but continue processing
                console.log('Schema validation failed:', schemaError);
            }
        }

        // Map "receiver" to "user" and "sender" to "assistant"
        const messages = previousMessages.map((message) => ({
            role: message.role === "receiver" ? Role.user : message.role === "sender" ? Role.assistant : Role.system,
            content: message.content,
        }));
        
        response = await openai_client.chat.completions.create({
            model: settings.model || "gpt-4o-mini",
            temperature: settings.temperature,
            max_completion_tokens: settings.maxCompletionTokens,
            messages: [...messages, { role: Role.user, content: input }],
            response_format: outputFormat.structured && outputFormat.schema ? JSON.parse(outputFormat.schema) : undefined,
        });

        success = true;
        return response.choices[0];

    } catch (err) {
        error = err instanceof Error ? err.message : 'Unknown error occurred';
        throw err;
    } finally {
        const processingTimeMs = Date.now() - startTime;
        
        // Log to database
        try {
            const llmRequestLog = new LLMRequestLogModel({
                requestType,
                input,
                previousMessagesCount: previousMessages.length,
                outputFormat: {
                    structured: outputFormat.structured,
                    schema: outputFormat.schema || undefined
                },
                settings: {
                    model: settings.model,
                    temperature: settings.temperature,
                    maxCompletionTokens: settings.maxCompletionTokens
                },
                response: success ? {
                    content: response?.choices?.[0]?.message?.content,
                    finishReason: response?.choices?.[0]?.finish_reason,
                    usage: {
                        promptTokens: response?.usage?.prompt_tokens,
                        completionTokens: response?.usage?.completion_tokens,
                        totalTokens: response?.usage?.total_tokens
                    }
                } : undefined,
                processingTimeMs,
                success,
                error,
                project: contextInfo?.project || undefined,
                user: contextInfo?.user || undefined,
                iterationStepId: contextInfo?.iterationStepId || undefined
            });
            
            await llmRequestLog.save();
        } catch (logError) {
            // If logging fails, fall back to console logging to avoid breaking the main functionality
            console.error('Failed to log LLM request to database:', logError);
            console.log(`LLM Request - Type: ${requestType}, Success: ${success}, Time: ${processingTimeMs}ms`);
        }
    }
}

enum Role {
    user = "user",
    assistant = "assistant",
    system = "system",
}