import { OpenAI } from "openai";
import dotenv from 'dotenv';
dotenv.config({override: true});

export const openai_client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
    project: process.env.OPENAI_PROJECT_ID || '',
    organization: process.env.OPENAI_ORG_ID || '',    
});

