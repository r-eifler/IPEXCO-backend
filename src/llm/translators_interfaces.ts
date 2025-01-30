import { OutputFormat } from "../db_schema/llm-context"

export interface LLMPrompts {
    systemPrompt: string,
    gt: {
        prompt: string,
        outputFormat: OutputFormat
    },
    et: {
        prompt: string,
        outputFormat: OutputFormat
    },
    qt: {
        prompt: string,
        outputFormat: OutputFormat
    }
}






  
