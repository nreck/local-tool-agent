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
    13) Always output quotes using the outputQuote tool. Use the tvlySearch tool to find real quotes including their authors and the source, before outputting a quote using this tool.
    13) When outputting quotes, always add > in front of the quote it self and to place the author below the quote, to make sure it's formatted correctly.
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
            outputQuote: tool({
                description: 'Output a quote based on user inquiry. Always use the tvlySearch to find real quotes including their authors and the source, before outputting a quote using this tool.',
                parameters: z.object({
                    quote: z.string().default("inspiration").describe('The topic or theme of the quote'),
                    author: z.string().default("motivational").describe('The style of the quote (e.g., motivational, philosophical, humorous)'),
                    source: z.string().describe('Results from tvlySearch tool')
                }),

                execute: async ({ quote, author, source }) => {
                    try {
                        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/generateQuote`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ quote, author, source }),
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


            saveCourseToBlob: tool({
    description: "Save, retrieve, edit, or list all courses in JSON blob storage",
    parameters: z.object({
        action: z.enum(["save", "get", "edit", "list"]).describe("Action to perform: save, get, edit, or list all courses"),
        title: z.string().optional().describe("Course title (needed for 'save', not 'list' or 'get')"),
        id: z.string().optional().describe("Unique course ID (needed for 'get' and 'edit')"),
        content: z.record(z.string(), z.any()).optional().describe("Course content (for save)"),
        key: z.string().optional().describe("Key to edit (for edit action)"),
        value: z.any().optional().describe("New value (for edit action)"),
    }),
    execute: async ({ action, title, id, content, key, value }) => {
        try {
            console.log("🔹 saveCourseToBlob called with:", { action, title, id, content, key, value });

            const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
            let response;

            if (action === "save") {
                if (!title || !content) {
                    return { error: "Title and content are required to save a course." };
                }
                console.log("📌 Sending POST request to save new course...");
                response = await fetch(`${BASE_URL}/api/course/blob`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title, content }),
                });
            } 
            
            else if (action === "get") {
                if (!id) {
                    return { error: "Course ID is required to retrieve a course." };
                }
                console.log(`📌 Sending GET request to fetch course: ${id}`);
                response = await fetch(`${BASE_URL}/api/course/blob?id=${id}`);
            } 
            
            else if (action === "edit") {
                if (!id || !key || value === undefined) {
                    return { error: "Course ID, key, and new value are required for editing." };
                }
                console.log(`📌 Sending PUT request to edit course: ${id}, key: ${key}`);
                response = await fetch(`${BASE_URL}/api/course/blob`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id, key, value }),
                });
            } 
            
            else if (action === "list") { 
                console.log("📌 Sending GET request to list all courses...");
                response = await fetch(`${BASE_URL}/api/course/blob`);
            } 
            
            else {
                throw new Error("Invalid action specified");
            }

            console.log("🔍 Checking API response...");
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ API Error [${response.status}]:`, errorText);
                return { error: `API Error: ${response.status} - ${errorText}` };
            }

            const data = await response.json();
            console.log("✅ API Response:", data);

            return data;
        } catch (error) {
            console.error("❌ Error processing course data:", error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return { error: `Failed to process course data: ${errorMessage}` };
        }
    },
})

            
            
            



            // Commented out streamText tool
            /*
            streamText: tool({
                description: 'An assistant named streamText. Inform the user that the agent answered and then the response',
                parameters: z.object({
                    query: z.string().describe('Your query'),
                }),
                execute: async ({ query }) => {
                    try {
                        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/streamText`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ query }),
                            cache: 'no-store',
                        });
                
                        // Read the streamed response and construct a usable text output
                        const reader = response.body?.getReader();
                        let resultText = "";
                
                        if (reader) {
                            const decoder = new TextDecoder();
                            let done = false;
                            while (!done) {
                                const { value, done: readerDone } = await reader.read();
                                if (value) resultText += decoder.decode(value, { stream: true });
                                done = readerDone;
                            }
                        }
                
                        return { text: resultText.trim() };
                    } catch (error) {
                        console.error("Error in streamText tool:", error);
                        return { error: "Failed to retrieve streamed text response." };
                    }
                }
            }),
            */

            //...giphyTools({ apiKey: process.env.GIPHY_API_KEY || '' }),
        },
        maxSteps: 30,
    });
    console.log("Tavily API Key:", process.env.TVLY_API_KEY);


    return result.toDataStreamResponse();
}