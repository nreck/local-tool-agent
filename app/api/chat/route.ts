// @/app/api/chat/route.ts
import { streamText, tool } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { z } from 'zod';

const openai2 = createOpenAICompatible({
    name: 'lmstudio',
    baseURL: 'http://localhost:1234/v1',
});

const openai = createOpenAI({
    baseURL: 'http://localhost:1234/v1',
    compatibility: 'compatible', // strict mode, enable when using the OpenAI API
});
// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages } = await req.json();

    // Before calling streamText, insert a system instruction to ensure the model 
    // uses the tool result in its final response
    messages.unshift({
        role: 'system',
        content: `You are a helpful assistant. 
    1) You may call the "weather" tool if needed. 
    2) When you do, you must incorporate the tool's result into your final response for the user. 
    3) Do not simply return the tool result; respond with a helpful explanation.
    4) Always output in markdown format.
    5) If making a list, add a title above instead of inside. You cannot use headings or other tags like p and strong inside lists.`,
    });

    const result = streamText({
        model: openai2('qwen2.5-7b-instruct-1m'),
        messages,
        experimental_continueSteps: true,
        temperature: 0.5,
        onFinish: async (result) => {
            console.log("LLM API Call Result: ", JSON.stringify(result));
        },
        tools: {
            weather: tool({
                description: 'Get the weather in a location (fahrenheit). Do not output the tool call directly but use it in your final user-facing answer.',
                parameters: z.object({
                    location: z.string().describe('The location to get the weather for'),
                }),
                execute: async ({ location }) => {
                    const temperature = Math.round(Math.random() * (90 - 32) + 32);
                    return {
                        location,
                        temperature,
                    };
                },
            }),
                date: tool({
                description: 'Get the current date. Do not output the tool call directly but use it in your final user-facing answer.',
                parameters: z.object({
                    timezone: z.string().describe('The timezone to get the date for'),
                }),
                execute: async ({ timezone }) => {
                    const date = "March 6 2025"
                    return {
                        timezone,
                        date,
                    };
                },
            }),
            generateRecipe: tool({
                description: 'Generate a recipe based on the user input. Do not output the tool call directly but use it in your final user-facing answer.',
                parameters: z.object({
                    recipe: z.string().describe('The recipe to generate'),
                    ingredients: z.array(z.string()).describe('The ingredients for the recipe'),
                }),
                execute: async ({ recipe, ingredients }) => {
                    const object = {
                        recipe: recipe,
                        ingredients: ingredients
                    }
                    return {
                        response: object,
                        recipe: recipe,
                        ingredients: ingredients
                    };
                },
            }),
            reviewRecipe: tool({
                description: 'Review the ingredients of a recipe to ensure they are correct. Do not output the tool call directly but use it in your final user-facing answer.',
                parameters: z.object({
                    recipe: z.string().describe('The recipe to generate'),
                    ingredients: z.array(z.string()).describe('The ingredients for the recipe'),
                }),
                execute: async ({ recipe, ingredients }) => {
                    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/review`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ recipe, ingredients }),
                        cache: 'no-store',
                    });
            
                    if (!response.ok) {
                        throw new Error('Failed to review recipe');
                    }
            
                    const { review } = await response.json(); // ✅ Extract the review field correctly
            
                    return {
                        review,  // ✅ Ensure it's returned correctly
                    };
                },
            }),
                    },
        maxSteps: 15, // Let the LLM do multiple steps (tool call + final answer)
    });

    return result.toDataStreamResponse();
}