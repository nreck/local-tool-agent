// @/app/api/chat/route.ts
import { streamText, tool } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { z } from 'zod';
import { tavily } from '@tavily/core';
import { giphyTools } from '@/lib/tools/giphy'

const openai2 = createOpenAICompatible({
    name: 'lmstudio',
    baseURL: 'http://89.150.153.77:1234/v1',
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
    3) If making a list, add a title above instead of inside. You cannot use headings or other tags like p and strong inside lists.
    4) Do not render lists inside lists.
    5) If calling generateCourseOutline, **you MUST provide a proper goal, audience, and at least 3 topics**. 
    6) If the user doesn't provide a goal, set a **default goal**. If they don't provide an audience, assume **"beginners"**. If no topics, assume **["Introduction", "Fundamentals", "Advanced Concepts"]**.
    7) Always wait for tool results before continuing.
    8) In order to create a course succesfully, always use the generateTopics tool to confirm your topics choice. Use the tvlySearch tool to search the web for these topics, before using the generateCourseOutline tool to create a highly relevant course outline based on the tools results and the user goal and audienece.
    9) When generating topics, make sure to use the tvlySearch tool to research the user request before confirming the topics with the generateTopics tool. Always use the tool to output topics!
    10) Always inform the user about what you are doing and why you are doing it before proceeding.
    11) Use the GiphyTools to search for GIFs when needed.
    12) Use the imageVision tool to analyze images and provide a description. Provide an image URL to process.
    `,

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
            tvlySearch: tool({
                description: 'Use Tavily to search the internet. Provide a query for best results. Do not output the tool call directly but use it in your final user-facing answer. Do not output topic related search results directly, but use them to output relevant topics with the generateTopics tool. Do not use this tool for searching GIFs.',
                parameters: z.object({
                    query: z.string().describe('The user search query'),
                }),
                execute: async ({ query }) => {
                    try {
                        const tvlyClient = tavily({ apiKey: process.env.TVLY_API_KEY });
                        const response = await tvlyClient.search(query, {
                            searchDepth: 'advanced',
                            topic: 'general',
                            maxResults: 3,
                            includeImageDescriptions: false,
                            includeAnswer: true,
                            includeRawContent: false,
                            includeDomains: [],
                            excludeDomains: [],
                        });
                        console.log("Tavily response:", response);
                        return response;
                    } catch (error) {
                        console.error("Error in Tavily search:", error);
                        return { error: "Failed to fetch Tavily search results" };
                    }
                },
            }),
            generateTopics: tool({
                description: 'Output topic suggestions based on the user provided request.',
                parameters: z.object({
                    goal: z.string().describe('The goal from the user'),
                    topics: z.array(z.object({
                        topic: z.string().describe('The topic name'),
                        reasoning: z.string().describe('Your reasoning for this topic')
                    })).describe('Array of topics'),
                    reasoning: z.string().describe('Your overall reasoning for the topic selection'),
                }),
                execute: async ({ goal, topics, reasoning }) => {
                    const object = {
                        goal: goal,
                        topics: topics,
                        reasoning: reasoning,
                    }
                    return {
                        response: object,
                        goal: goal,
                        topics: topics,
                        reasoning: reasoning,
                    };
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
            imageVision: tool({
                description: 'Analyze an image and provide a description. Provide an image URL to process.',
                parameters: z.object({
                    imageUrl: z.string().describe('The URL of the image to analyze'),
                    prompt: z.string().optional().describe('Optional specific question about the image'),
                }),
                execute: async ({ imageUrl, prompt }) => {
                    try {
                        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/imageVision`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ imageUrl, prompt }),
                            cache: 'no-store',
                        });

                        const data = await response.json();
                        console.log("Vision API response:", data);
                        return data;
                    } catch (error) {
                        console.error("Error executing vision tool:", error);
                        return { error: "Failed to analyze image" };
                    }
                },
            }),
            generateQuote: tool({
                description: 'Generate an inspirational or topical quote. Returns a JSON object containing the quote and its details. Always use the tvlySearch to find quotes, their authors and sources from the web before generating a quote. Please make sure to prompt the tvlySearch tool with the explicit need of the authors too.',
                parameters: z.object({
                    topic: z.string().default("inspiration").describe('The topic or theme of the quote'),
                    style: z.string().default("motivational").describe('The style of the quote (e.g., motivational, philosophical, humorous)'),
                    length: z.string().default("medium").describe('The desired length of the quote (short, medium, long)'),
                    source: z.string().describe('Results from tvlySearch tool'),
                }),

                execute: async ({ topic, style, length, source }) => {
                    try {
                        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/generateQuote`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ topic, style, length, source }),
                            cache: 'no-store',
                        });

                        const data = await response.json();
                        console.log("generateQuote API response:", data);
                        return data;
                    } catch (error) {
                        console.error("Error executing generateQuote tool:", error);
                        return { error: "An error occurred while generating the quote." };
                    }
                },
            }),

            ...giphyTools({ apiKey: process.env.GIPHY_API_KEY || '' }),
        },
        maxSteps: 30,
    });
    console.log("Tavily API Key:", process.env.TVLY_API_KEY);


    return result.toDataStreamResponse();
}