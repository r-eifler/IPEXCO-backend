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
    console.log("processAnyRequest - Input:", input);
    console.log("processAnyRequest - Previous Messages:", previousMessages);
    console.log("processAnyRequest - Output Format:", outputFormat);
    console.log("processAnyRequest - Settings:", settings);

    try {
        console.log("processAnyRequest - Attempting to parse outputFormat.schema:", outputFormat.schema);
        if (outputFormat.schema) {
            console.log("processAnyRequest - Parsed schema:", JSON.parse(outputFormat.schema));
        } else {
            console.log("processAnyRequest - outputFormat.schema is undefined or null.");
        }
    } catch (error) {
        console.log("Error parsing schema, trying to parse stringified schema")
        console.log(error)
        console.log(JSON.parse(JSON.stringify(outputFormat.schema)) || "{}")

    } finally {
        console.log("processAnyRequest - Done checking json-schema-validity");
    }

    
    // Map "receiver" to "user" and "sender" to "assistant"
    const messages = previousMessages.map((message) => ({
        role: message.role === "receiver" ? Role.user : message.role === "sender" ? Role.assistant : Role.system,
        content: message.content,
    }));
    console.log("processAnyRequest - Mapped messages for OpenAI:", messages);
    
    const response = await openai_client.chat.completions.create({
        model: settings.model || "gpt-4o-mini",
        temperature: settings.temperature,
        max_completion_tokens: settings.maxCompletionTokens,
        messages: [...messages, { role: Role.user, content: input }],
        response_format: outputFormat.structured && outputFormat.schema ? JSON.parse(outputFormat.schema) : undefined,
    });

    console.log("processAnyRequest - OpenAI API Response:", response);
    return response.choices[0] ;
    
}

enum Role {
    user = "user",
    assistant = "assistant",
    system = "system",
}