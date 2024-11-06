import { openai_client } from "../llm/openai_client";

export async function processQtRequest(input: string, threadId: string) {
        
    console.log("input (req.body.data)", input)
    const createdMessage = await openai_client.beta.threads.messages.create(threadId, {
        role: "user",
        content: input,
    });

    console.log("createdMessage", createdMessage)
    let run = await openai_client.beta.threads.runs.createAndPoll(
        threadId, 
        { 
          assistant_id: process.env.ASSISTANT_ID_QUESTIONTRANSLATOR ??
                    (() => {
                        throw new Error('ASSISTANT_ID_QUESTIONTRANSLATOR is not set');
                    })()
        }
      );
    let run_status = run.status
    if (run.status === 'completed') {
        const messages = await openai_client.beta.threads.messages.list(
          run.thread_id
        );
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

export async function processGtRequest(input: string, threadId: string) {
    console.log("input (req.body.data)", input)
    const createdMessage = await openai_client.beta.threads.messages.create(threadId, {
        role: "user",
        content: input,
    });

    console.log("createdMessage", createdMessage)
    let run = await openai_client.beta.threads.runs.createAndPoll(
        threadId, 
        { 
          assistant_id: process.env.ASSISTANT_ID_GOALTRANSLATOR ??
                    (() => {
                        throw new Error('ASSISTANT_ID_GOALTRANSLATOR is not set');
                    })()
        }
    );
    let run_status = run.status
    if (run.status === 'completed') {
        const messages = await openai_client.beta.threads.messages.list(
          run.thread_id
        );
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

export async function processEtRequest(input: string, threadId: string) {
    console.log("input (req.body.data)", input)
    const createdMessage = await openai_client.beta.threads.messages.create(threadId, {
        role: "user",
        content: input,
    });

    console.log("createdMessage", createdMessage)
    let run = await openai_client.beta.threads.runs.createAndPoll(
        threadId, 
        { 
          assistant_id: process.env.ASSISTANT_ID_EXPLANATIONTRANSLATOR ??
                    (() => {
                        throw new Error('ASSISTANT_ID_EXPLANATIONTRANSLATOR is not set');
                    })()
        }
    );
    let run_status = run.status
    if (run.status === 'completed') {
        const messages = await openai_client.beta.threads.messages.list(
          run.thread_id
        );
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
