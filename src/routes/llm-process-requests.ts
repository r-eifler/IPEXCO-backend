import { openai_client } from "../llm/openai_client";

export async function processQtRequest(input: string, threadId: string, assistantId: string) {
        
    console.log("input (req.body.data)", input)
    console.log("threadId", threadId)
    console.log("assistantId", assistantId)
    const createdMessage = await openai_client.beta.threads.messages.create(threadId, {
        role: "user",
        content: input,
    });

    let run = await openai_client.beta.threads.runs.create(
        threadId, 
        { 
          assistant_id: assistantId
        }
    );
    
    // Poll and log status every 2 seconds
    while (true) {
        run = await openai_client.beta.threads.runs.retrieve(threadId, run.id);
        console.log(`Current run status: ${run.status}`);
        
        if (run.status === 'completed' || run.status === 'failed') {
            break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    }
    
    let run_status = run.status
    if (run.status === 'completed') {
        const messages = await openai_client.beta.threads.messages.list(
          run.thread_id
        );
        console.log("\n------MESSAGES FOR THIS THREAD------\n")
        for (const message of messages.data.reverse()) {
            const content = message.content[0];
            if (content && 'text' in content) {
                console.log(`${message.role} > ${content.text.value}`);
            } else {
                console.log(`${message.role} > [Content not available]`);
            }
        }

        const lastAssistantMessage = messages.data
            .reverse()
            .find(message => message.role === 'assistant');
        
        return {lastAssistantMessage, threadId, run_status}
    }
    console.log("Run status is not completed", run_status)
    return {lastAssistantMessage: undefined, threadId, run_status}
}

export async function processGtRequest(input: string, threadId: string, assistantId: string) {
    console.log("input (req.body.data)", input)
    const createdMessage = await openai_client.beta.threads.messages.create(threadId, {
        role: "user",
        content: input,
    });

    let run = await openai_client.beta.threads.runs.create(
        threadId, 
        { 
          assistant_id: assistantId
        }
    );
    
    // Poll and log status every 2 seconds
    while (true) {
        run = await openai_client.beta.threads.runs.retrieve(threadId, run.id);
        console.log(`Current run status: ${run.status}`);
        
        if (run.status === 'completed' || run.status === 'failed') {
            break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    }
    
    let run_status = run.status
    if (run.status === 'completed') {
        const messages = await openai_client.beta.threads.messages.list(
          run.thread_id
        );
        console.log("\n------MESSAGES FOR THIS THREAD------\n")
        for (const message of messages.data.reverse()) {
            const content = message.content[0];
            if (content && 'text' in content) {
                console.log(`${message.role} > ${content.text.value}`);
            } else {
                console.log(`${message.role} > [Content not available]`);
            }
        }

        const lastAssistantMessage = messages.data
            .reverse()
            .find(message => message.role === 'assistant');
        
        return {lastAssistantMessage, threadId, run_status}
    }
    console.log("Run status is not completed", run_status)
    return {lastAssistantMessage: undefined, threadId, run_status}
}

export async function processEtRequest(input: string, threadId: string, assistantId: string) {
    console.log("input (req.body.data)", input)
    const createdMessage = await openai_client.beta.threads.messages.create(threadId, {
        role: "user",
        content: input,
    });

    let run = await openai_client.beta.threads.runs.create(
        threadId, 
        { 
          assistant_id: assistantId
        }
    );
    
    // Poll and log status every 2 seconds
    while (true) {
        run = await openai_client.beta.threads.runs.retrieve(threadId, run.id);
        console.log(`Current run status: ${run.status}`);
        
        if (run.status === 'completed' || run.status === 'failed') {
            break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    }
    
    let run_status = run.status
    if (run.status === 'completed') {
        const messages = await openai_client.beta.threads.messages.list(
          run.thread_id
        );
        console.log("\n------MESSAGES FOR THIS THREAD------\n")
        for (const message of messages.data.reverse()) {
            const content = message.content[0];
            if (content && 'text' in content) {
                console.log(`${message.role} > ${content.text.value}`);
            } else {
                console.log(`${message.role} > [Content not available]`);
            }
        }

        const lastAssistantMessage = messages.data
            .reverse()
            .find(message => message.role === 'assistant');
        
        return {lastAssistantMessage, threadId, run_status}
    }
    console.log("Run status is not completed", run_status)
    return {lastAssistantMessage: undefined, threadId, run_status}
}


type AssistantType = "GT" | "ET" | "QT";
export async function showFullContextThread(threadId: string, assistant: AssistantType) {
    try {
        // Get all messages in the thread
        const messages = await openai_client.beta.threads.messages.list(threadId, {
            limit: 100, // Adjust limit as needed
            order: 'asc' // Get oldest messages first
        });

        // Get assistant details
        const assistantId = (assistant === "GT" ? 
            process.env.ASSISTANT_ID_GOALTRANSLATOR : 
            assistant === "ET" ? 
                process.env.ASSISTANT_ID_EXPLANATIONTRANSLATOR : 
                process.env.ASSISTANT_ID_QUESTIONTRANSLATOR) ?? 
            (() => { throw new Error(`ASSISTANT_ID_${assistant} is not set`); })();
        const assistantData = await openai_client.beta.assistants.retrieve(assistantId);

        // Format the output
        const context = {
            assistant: {
                name: assistantData.name,
                instructions: assistantData.instructions,
                model: assistantData.model
            },
            messages: messages.data.map(msg => ({
                role: msg.role,
                content: msg.content[0]?.type === 'text' ? msg.content[0].text.value : '[Non-text content]',
                created_at: new Date(msg.created_at * 1000).toISOString()
            }))
        };

        return context;

    } catch (error) {
        console.error('Error fetching thread context:', error);
        throw error;
    }
}
