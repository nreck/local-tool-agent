// @/app/api/chat/route.ts
import { streamText, tool } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { z } from 'zod';
import { tavily } from '@tavily/core';

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
    1) You may call tools if needed to answer the user question.
    2) When you do, you must incorporate the tool's result into your final response for the user. 
    3) Always use the generateRecipe tool to generate a recipe.
    4) Do not simply return the tool result; respond with a helpful explanation.
    5) If making a list, add a title above instead of inside. You cannot use headings or other tags like p and strong inside lists.
    6) Do not render lists inside lists.
    7) Always ensure to call tools again, even if prompted the same question again. Do not make up an answer or use an earlier result.`,
    });

    const result = streamText({
        model: openai2('qwen2.5-14b-instruct'),
        messages,
        experimental_continueSteps: true,
        temperature: 0.3,
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
            //This demonstrates how to generate a schema
            generateRecipe: tool({
                description: 'Generate a recipe based on the user input. Do not output the tool call directly but use it in your final user-facing answer.',
                parameters: z.object({
                    recipe: z.string().describe('The recipe to generate'),
                    ingredients: z.array(z.string()).describe('The ingredients for the recipe'),
                    steps: z.array(z.string()).describe('The steps for the recipe'),
                }),
                execute: async ({ recipe, ingredients, steps }) => {
                    const object = {
                        recipe: recipe,
                        ingredients: ingredients,
                        steps: steps,
                    }
                    return {
                        response: object,
                        recipe: recipe,
                        ingredients: ingredients,
                        steps: steps,
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
            tvlySearch: tool({
                description: 'Use Tavily to search the internet. Provide a query for best results. Do not output the tool call directly but use it in your final user-facing answer.',
                parameters: z.object({
                    query: z.string().describe('The user search query'),
                }),
                execute: async ({ query }) => {
                    const tvlyClient = tavily({ apiKey: process.env.TVLY_API_KEY });
                    const response = await tvlyClient.search(
                        query,
                        {
                            searchDepth: 'advanced', 
                            topic: 'general',      
                            maxResults: 3,
                            includeImages: false,
                            includeImageDescriptions: false,
                            includeAnswer: false,        // strictly boolean if your local library expects that
                            includeRawContent: false,
                            includeDomains: [],
                            excludeDomains: [],
                        }
                    );

                    return response;
                },
            }),


        },
        maxSteps: 20, // Let the LLM do multiple steps (tool call + final answer)
    });

    return result.toDataStreamResponse();
}