
import { BaseProjectModel } from "../db_schema/project";
import { OutputSchemaModel, PromptModel } from "../db_schema/prompt";

export async function initializeAssistants(projectId: string) {
    console.log("Initializing assistants...");
   
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not set in the environment variables');
    }

    const projectSettings = await getProjectSettings(projectId);

    const promptsIds = projectSettings.llmConfig.prompts;
    const outputSchemaIds = projectSettings.llmConfig.outputSchema;


    // get the prompts and output schemas from the database 
    const prompts = await PromptModel.find({_id: {$in: promptsIds}});
    const outputSchemas = await OutputSchemaModel.find({ _id: { $in: outputSchemaIds } });
    
    const systemPrompt = prompts.find(prompt => prompt.type === "SYSTEM")?.text;
    const gtPrompt = prompts.find(prompt => prompt.agent === "GOAL_TRANSLATOR")?.text;
    const etPrompt = prompts.find(prompt => prompt.agent === "EXPLANATION_TRANSLATOR")?.text;
    const qtPrompt = prompts.find(prompt => prompt.agent === "QUESTION_CLASSIFIER")?.text;
    const questionSuggestionPrompt = prompts.find(prompt => prompt.agent === "QUESTION_SUGGESTER")?.text;

    const outputFormatQT = outputSchemas.find(schema => schema.agent === "QUESTION_CLASSIFIER")?.text;
    const outputFormatET = outputSchemas.find(schema => schema.agent === "EXPLANATION_TRANSLATOR")?.text;
    const outputFormatGT = outputSchemas.find(schema => schema.agent === "GOAL_TRANSLATOR")?.text;

    // check if the prompts are valid
    if(!systemPrompt || !etPrompt || !qtPrompt){
        throw new Error('One of the prompts is missing or invalid. printing all prompts: \n\n' + prompts);
    }
    if(!outputFormatQT || !outputFormatET){
        throw new Error('One of the output formats is missing or invalid. printing all output formats: \n\n' + outputSchemas);
    }
      
    return {
        seenByGTMessages:  [{role: "developer", content: `${systemPrompt}\n\n${gtPrompt}`}] ,
        seenByETMessages:  [{role: "developer", content: `${systemPrompt}\n\n${etPrompt}`}] ,
        seenByQTMessages: [{ role: "developer", content: `${systemPrompt}\n\n${qtPrompt}` }],
        seenByQuestionSuggestionMessages: [{ role: "developer", content: `${systemPrompt}\n\n${questionSuggestionPrompt}` }],
        outputFormatQT: outputFormatQT,
        outputFormatET: outputFormatET,
        outputFormatGT: outputFormatGT
    };
}

async function getProjectSettings(projectId: string) {
    const project = await BaseProjectModel.findById(projectId);
    if (!project) {
        throw new Error('Project not found');
    }
    return project.settings;
}


