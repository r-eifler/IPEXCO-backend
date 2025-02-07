import mongoose, { Schema } from "mongoose";

export interface PaymentInfo {
    min: number;
    max: number;
    steps: number[];
  }
  
  export enum PropertyCreationInterfaceType {
    TEMPLATE_BASED = "TEMPLATE_BASED",
    LLM_CHAT = "LLM_CHAT",
  }
  
  export enum ExplanationInterfaceType {
    TEMPLATE_QUESTION_ANSWER = "TEMPLATE_QUESTION_ANSWER",
    MUGS_VISUALIZATION = "MUGS_VISUALIZATION",
    LLM_CHAT = "LLM_CHAT",
  }
  
  export interface GeneralSettings {
    main: {
        public: boolean;
        maxRuns: number;
        usePlanPropertyUtility: boolean;
    }
    services: {
        computePlanAutomatically: boolean;
        computeExplanationsAutomatically: boolean;
        services: string[];
    }
    interfaces: {
        propertyCreationInterfaceType: PropertyCreationInterfaceType;
        explanationInterfaceType: ExplanationInterfaceType;
    }
    llmConfig: {
        model: string,
        temperature: number,
        maxCompletionTokens: number| null,
        prompts: string[],
        outputSchema: string[],
    }
    userStudy: {
        introTask: boolean;
        checkMaxUtility: boolean;
        showPaymentInfo: boolean;
        paymentInfo?: PaymentInfo;
    }
  }


  export const GeneralSettingsSchema = new Schema({
    main: {
        public: { type: Boolean, required: true},
        maxRuns: { type: Number, required: true},
        usePlanPropertyUtility: { type: Boolean, required: true},
    },
    services: {
        computePlanAutomatically: { type: Boolean, required: true},
        computeExplanationsAutomatically:{ type: Boolean, required: true},
        services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'services' }],
    },
    interfaces: {
        propertyCreationInterfaceType: { type: String, required: true},
        explanationInterfaceType: { type: String, required: true},
    },
    llmConfig: {
        model: { type: String, required: true},
        temperature: { type: Number, required: true},
        maxCompletionTokens: { type: Number, required: false},
        prompts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'prompt' }],
        outputSchema: [{ type: mongoose.Schema.Types.ObjectId, ref: 'output-schema' }],
    },
    userStudy: {
        introTask: { type: Boolean, required: true},
        checkMaxUtility: { type: Boolean, required: true},
        showPaymentInfo: { type: Boolean, required: true},
        paymentInfo: {
            min: { type: Number, required: false},
            max: { type: Number, required: false},
            steps: [{ type: Number, required: false}],
        }
    }
});


export const defaultGeneralSetting: GeneralSettings = {
    main: {
      public: false,
      maxRuns: 100,
      usePlanPropertyUtility: false,
    },
    services: {
        computePlanAutomatically: true,
        computeExplanationsAutomatically: true,
        services: [],
    },
    interfaces: {
        explanationInterfaceType: ExplanationInterfaceType.TEMPLATE_QUESTION_ANSWER,
        propertyCreationInterfaceType: PropertyCreationInterfaceType.TEMPLATE_BASED,
    },
    llmConfig: {
      model: 'gpt-4o-mini',
      temperature: 0,
      maxCompletionTokens: null,
      prompts: [],
      outputSchema: [],
    },
    userStudy: {
        introTask: false,
        checkMaxUtility: true,
        showPaymentInfo: false,
        paymentInfo: { min: 0, max: 10, steps: [0.5, 0.75, 1] }
    }
  };