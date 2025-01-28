import { openai_client } from "../llm/openai_client";
import { LLMContext, LLMMessage, OutputFormat } from '../db_schema/llm-context';

export async function processQtRequest(input: string, llmContext: LLMContext) {
    const context = llmContext.seenByQTMessages;
    const outputFormat = llmContext.outputFormatQT;

    return await processAnyRequest(input, context, outputFormat)
}

export async function processGtRequest(input: string, llmContext: LLMContext) {
    const context = llmContext.seenByGTMessages;
    const outputFormat = llmContext.outputFormatGT;

    return await processAnyRequest(input, context, outputFormat)
}

export async function processEtRequest(input: string, llmContext: LLMContext) {
    const context = llmContext.seenByETMessages;
    const outputFormat = llmContext.outputFormatET;

    return await processAnyRequest(input, context, outputFormat)
}

async function processAnyRequest(input: string, previousMessages: LLMMessage[], outputFormat: OutputFormat) {
    
    // Map "receiver" to "user" and "sender" to "assistant"
    const messages = previousMessages.map((message) => ({
        role: message.role === "receiver" ? "user" : "assistant",
        content: message.content,
    }));
    
    let outputMessage = ""
    let runStatus = ""

    // TODO: implement the logic for the request
    return {outputMessage, runStatus}
}