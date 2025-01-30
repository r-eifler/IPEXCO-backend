export interface LLMConfig {
    model: string;
    temperature: number;
    maxCompletionTokens: number | null;
    prompt: string;
    responseFormat: string;
  }
  
  export const defaultLLMConfig: LLMConfig = {
    model: 'gpt-4o-mini',
    temperature: 0,
    maxCompletionTokens: null,
    prompt: '',
    responseFormat: '',
  };
  
  export interface AllLLMConfig {
    systemPrompt: string;
    llmConfig: {
      qt: LLMConfig;
      et: LLMConfig;
      gt: LLMConfig;
    };
  }
  
  export const defaultAllLLMConfig: AllLLMConfig = {
    systemPrompt: '',
    llmConfig: {
      qt: defaultLLMConfig,
      et: defaultLLMConfig,
      gt: defaultLLMConfig,
    },
  };
  