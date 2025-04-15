import mongoose, { Schema } from "mongoose";
import { array, boolean, nativeEnum, nullable, number, object, string, infer as zinfer} from "zod";

export const PaymentInfoZ = object({
    min: number(),
    max: number(),
    steps: array(number())
  });
  
  export enum PropertyCreationInterfaceType {
    TEMPLATE_BASED = "TEMPLATE_BASED",
    LLM_CHAT = "LLM_CHAT",
  };
  
  export const PropertyCreationInterfaceTypeZ = nativeEnum(PropertyCreationInterfaceType);
  
  export enum ExplanationInterfaceType {
    TEMPLATE_QUESTION_ANSWER = "TEMPLATE_QUESTION_ANSWER",
    MUGS_VISUALIZATION = "MUGS_VISUALIZATION",
    LLM_CHAT = "LLM_CHAT",
    MUGS_VISUALIZATION_ANSWER = "MUGS_VISUALIZATION_ANSWER",
    CONFLICT_LIST = "CONFLICT_LIST"
  };
  
  export const ExplanationInterfaceTypeZ = nativeEnum(ExplanationInterfaceType);
  
  export enum LLMContextSetup {
    ITERATION_STEP = 'ITERATION_STEP',
    PROJECT = 'PROJECT',
  }
  
export const LLMContextSetupZ = nativeEnum(LLMContextSetup);
  
  export const GeneralSettingsZ = object({
    main: object({
        public: boolean(),
        maxRuns: nullable(number()),
        usePlanPropertyUtility: boolean(),
    }),
    services: object({
        computePlanAutomatically: boolean(),
        computeExplanationsAutomatically: boolean(),
        services: array(string()),
    }),
    interfaces: object({
        propertyCreationInterfaceType: PropertyCreationInterfaceTypeZ,
        explanationInterfaceType: ExplanationInterfaceTypeZ,
    }),
    llmConfig: object({
      model: string(),
      temperature: number(),
      maxCompletionTokens: nullable(number()),
      prompts: array(string()),
      outputSchema: array(string()),
      goalTranslator: boolean(),
      showReverseTranslation: boolean(),
      llmContextSetup: LLMContextSetupZ,
    }),
    userStudy: object({
        introTask: boolean(),
        checkMaxUtility: boolean(),
        showPaymentInfo: boolean(),
        paymentInfo: PaymentInfoZ,
    })
  })
  
  export type GeneralSettings = zinfer<typeof GeneralSettingsZ>;


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
        goalTranslator: { type: Boolean, required: true},
        showReverseTranslation: { type: Boolean, required: true},
        llmContextSetup: { type: String, required: true},
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
      goalTranslator: false,
      showReverseTranslation: false,
      llmContextSetup: LLMContextSetup.ITERATION_STEP,
    },
    userStudy: {
        introTask: false,
        checkMaxUtility: true,
        showPaymentInfo: false,
        paymentInfo: { min: 0, max: 10, steps: [0.5, 0.75, 1] }
    }
  };