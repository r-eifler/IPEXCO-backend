import { openai_client } from "../llm/openai_client";
import { LLMContext, LLMMessage, OutputFormat } from '../db_schema/llm-context';

export async function processQtRequest(input: string, llmContext: LLMContext, settings: any) {
    const context = llmContext.seenByQTMessages;
    const outputFormat = llmContext.outputFormatQT;

    return await processAnyRequest(input, context, outputFormat, settings)
}

export async function processGtRequest(input: string, llmContext: LLMContext, settings: any) {
    const context = llmContext.seenByGTMessages;
    const outputFormat = llmContext.outputFormatGT;

    return await processAnyRequest(input, context, outputFormat, settings)
}

export async function processEtRequest(input: string, llmContext: LLMContext, settings: any) {
    const context = llmContext.seenByETMessages;
    const outputFormat = llmContext.outputFormatET;
    

    return await processAnyRequest(input, context, outputFormat, settings)
}

async function processAnyRequest(input: string, previousMessages: LLMMessage[], outputFormat: OutputFormat, settings: any) {
    console.log("Checking json-schema-validity")
    console.log(outputFormat.schema)
    try {
        console.log(JSON.parse(outputFormat.schema || "{}"))
    } catch (error) {
        console.log("Error parsing schema, trying to parse stringified schema")
        console.log(error)
        console.log(JSON.parse(JSON.stringify(outputFormat.schema)) || "{}")

    } finally {
        console.log("Done checking json-schema-validity")
    }

    
    // Map "receiver" to "user" and "sender" to "assistant"
    const messages = previousMessages.map((message) => ({
        role: message.role === "receiver" ? Role.user : message.role === "sender" ? Role.assistant : Role.system,
        content: message.content,
    }));
    
    const response = await openai_client.chat.completions.create({
        model: settings.model || "gpt-4o-mini",
        temperature: settings.temperature,
        max_completion_tokens: settings.maxCompletionTokens,
        messages: [...messages, { role: Role.user, content: input }],
        response_format: outputFormat.structured && outputFormat.schema ? JSON.parse(outputFormat.schema) : undefined,
    });

    return response.choices[0] ;
    
}

enum Role {
    user = "user",
    assistant = "assistant",
    system = "system",
}