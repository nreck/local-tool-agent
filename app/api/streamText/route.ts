// @/app/api/streamText/route.ts
// @/app/api/streamText/route.ts
import { streamText, tool, Output } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { z } from 'zod';
import { tavily } from '@tavily/core';
import zodToJsonSchema from 'zod-to-json-schema';

const openai2 = createOpenAICompatible({
    name: 'lmstudio',
    baseURL: 'http://89.150.153.77:1234/v1',
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// ✅ Define the schema using Zod
const personSchema = z.object({
    name: z.string(),
    age: z.number().nullable().describe('Age of the person.'),
    contact: z.object({
        type: z.literal('email'),
        value: z.string(),
    }),
    occupation: z.object({
        type: z.literal('employed'),
        company: z.string(),
        position: z.string(),
    }),
});

// ✅ Convert Zod schema to JSON Schema, ensuring full expansion
const rawJsonSchema = zodToJsonSchema(personSchema, {
    name: "person_schema",
    $refStrategy: "none" // Ensure no references ($ref)
});

// ✅ Ensure JSON serializability
const cleanedJsonSchema = JSON.parse(JSON.stringify(rawJsonSchema));
delete cleanedJsonSchema.definitions; // Remove unnecessary definitions

// ✅ LM Studio expects this exact format for response_format
const personJsonSchema = {
    name: "person_schema",
    strict: true, // ✅ Should be a boolean, not a string
    schema: cleanedJsonSchema
};

// 🚀 Debugging check: Ensure correct structure
console.log("✅ Final JSON Schema for LM Studio:", JSON.stringify(personJsonSchema, null, 2));

export async function POST(req: Request) {
    const { query } = await req.json();
    console.log("Incoming streamText request query:", JSON.stringify(query, null, 2));

    console.log("🛠️ Final response_format payload:", JSON.stringify({
        type: "json_schema",
        json_schema: personJsonSchema,
    }, null, 2));

    const result = streamText({
        model: openai2('qwq-32b'),
        system: `You are a helpful English-speaking assistant named Jarvis. You may call tools if needed to answer the user question.`,
        prompt: query,
        temperature: 0.5,

        // ✅ Ensure structured JSON output using the correct format for LM Studio
        experimental_output: Output.object({ schema: personSchema }),

        providerOptions: {
            openai2: {
                response_format: {
                    type: "json_schema",
                    json_schema: personJsonSchema // ✅ Fully compatible JSON Schema
                }
            }
        },

        onFinish: async (result) => {
            console.log("✅ streamText Call Result: ", JSON.stringify(result, null, 2));
        },
        onError: async (error) => {
            console.error("❌ Error during streamText execution:", error);
        },

        tools: {
            weather: tool({
                description: 'Get the weather in a location (fahrenheit). Do not output the tool call directly but use it in your final user-facing answer.',
                parameters: z.object({
                    location: z.string().describe('The location to get the weather for'),
                }),
                execute: async ({ location }) => {
                    const temperature = Math.round(Math.random() * (90 - 32) + 32);
                    return { location, temperature };
                },
            }),
            date: tool({
                description: 'Get the current date. Do not output the tool call directly but use it in your final user-facing answer.',
                parameters: z.object({
                    timezone: z.string().describe('The timezone to get the date for'),
                }),
                execute: async ({ timezone }) => {
                    return { timezone, date: "March 6 2025" };
                },
            }),
            tvlySearch: tool({
                description: 'Use Tavily to search the internet. Provide a query for best results. Do not output the tool call directly but use it in your final user-facing answer. Do not output topic-related search results directly, but use them to output relevant topics with the generateTopics tool. Do not use this tool for searching GIFs.',
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
                        console.log("🔍 Tavily response:", response);
                        return response;
                    } catch (error) {
                        console.error("❌ Error in Tavily search:", error);
                        return { error: "Failed to fetch Tavily search results" };
                    }
                },
            }),
        },
        maxSteps: 5,
    });

    // ✅ Access experimental_partialOutputStream from `result`
    for await (const partialOutput of result.experimental_partialOutputStream) {
        console.log("📡 Partial Schema Output: ", partialOutput);
    }

    return result.toDataStreamResponse();
}
