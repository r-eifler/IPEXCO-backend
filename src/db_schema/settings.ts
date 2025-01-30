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
  
  export interface GeneralSettings extends Document{
    main: {
        public: boolean;
        maxRuns: number;
        usePlanPropertyUtility: boolean;
    }
    services: {
        computePlanAutomatically: boolean;
        computeExplanationsAutomatically: boolean;
        planners: string[];
        explainer: string[]
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
        planners: [{ type: mongoose.Schema.Types.ObjectId, ref: 'planner' }],
        explainer: [{ type: mongoose.Schema.Types.ObjectId, ref: 'explainer' }],
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
    }
});

