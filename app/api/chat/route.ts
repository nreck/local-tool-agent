// @/app/api/chat/route.ts
import { streamText, tool } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { z } from 'zod';
import { tavily } from '@tavily/core';

const openai2 = createOpenAICompatible({
    name: 'lmstudio',
    baseURL: 'http://localhost:1234/v1',
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages } = await req.json();

    // Before calling streamText, insert a system instruction to ensure the model 
    // uses the tool result in its final response
    messages.unshift({
        role: 'system',
        content: `You are a helpful english speaking assistant. 
    1) You may call tools if needed to answer the user question.
    2) When you do, you must incorporate the tool's result into your final response for the user. 
    3) Always use the generateRecipe tool to generate a recipe.
    4) Do not simply return the tool result; respond with a helpful explanation.
    5) If making a list, add a title above instead of inside. You cannot use headings or other tags like p and strong inside lists.
    6) Do not render lists inside lists.
    7) If calling generateCourseOutline, **you MUST provide a proper goal, audience, and at least 3 topics**. 
    8) If the user doesn't provide a goal, set a **default goal**. If they don't provide an audience, assume **"beginners"**. If no topics, assume **["Introduction", "Fundamentals", "Advanced Concepts"]**.
    9) Always wait for tool results before continuing.`,
    });


    const result = streamText({
        model: openai2('qwen2.5-14b-instruct'),
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

                    const { review } = await response.json();

                    return {
                        review,
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
                            includeAnswer: false,
                            includeRawContent: false,
                            includeDomains: [],
                            excludeDomains: [],
                        }
                    );
                    return response;
                },
            }),
            generateCourseOutline: tool({
                description: 'Generate a course outline based on user input. Returns a JSON object containing the course structure.',
                parameters: z.object({
                    goal: z.string().default("Learn the fundamentals of AI").describe('The goal of the course'),
                    audience: z.string().default("Beginners").describe('The audience of the course'),
                    topics: z.array(z.string()).default(["Introduction to AI", "Machine Learning Basics", "Deep Learning Concepts"]).describe('The topics to cover'),
                }),
                execute: async ({ goal, audience, topics }) => {
                    try {
                        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/generateCourseOutline`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ goal, audience, topics }),
                            cache: 'no-store',
                        });

                        // ✅ Read response as JSON instead of text
                        const data = await response.json();

                        console.log("generateCourseOutline API response:", data);

                        return data; // ✅ Return structured JSON directly to the chat agent
                    } catch (error) {
                        console.error("Error executing generateCourseOutline tool:", error);
                        return { error: "An error occurred while generating the course outline." };
                    }
                },
            }),


        },
        maxSteps: 20,
    });

    return result.toDataStreamResponse();
}