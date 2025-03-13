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

// Increase maxDuration to allow for more processing time
export const maxDuration = 600; // 10 minutes

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        // Before calling streamText, insert a system instruction to ensure the model 
        // uses the tool result in its final response
        messages.unshift({
            role: 'system',
            content: `
      You are a helpful English-speaking Learning Assistant with access to various tools. Your purpose is to generate full-length courses based on user preferences. Never use or translate to languages other than English.
      
      ## 🔧 General Tool Usage Guidelines
      - Always briefly inform users about the action you're taking (e.g., "I'll research that...").
      - Never mention specific tool names — always describe actions generically.
      - Never repeat the same tool call consecutively.
      - Incorporate tool results naturally into your final responses.
      – Do not output JSON directly to the user.
      - When generating outlines or saving courses, do not output the returned content directly.
      
      ---
      
      ## 🚩 CRITICAL WORKFLOW: Topic Research & Generation
      **When topics are needed, strictly follow these steps:**
      1. **Research** the subject first by searching online.
      2. **Generate Topics** based exclusively on research results using the appropriate tool.
      
      **Important Rules:**
      - You must NEVER directly suggest topics from your own knowledge—ALWAYS use the designated topic-generation tool after conducting research.
      – Do not use strong or bold for titles, use headings instead. 
      – Do not continue to the next step before you have recieved the response and acceptance of the previous step.
      ---
      
      ## 📚 E-learning Course Creation Workflow
      Always follow this structured process precisely:

      ### Step 1: **Planning**
      – Collect the specific goal and audience from the user in order to plan the creation of a course using the planCourse tool. Always require the user to provide the goal and audience and help them improve their input if necessary by providing suggestions, to ensure a highly relevant goal and audience in order to create a high quality course that covers the specific needs.
      - Create highly relevant learning objectives based on the goal to ensure the course covers the full scope of the topic.
      – The learning objectives shouldn't be required by the user, but should be generated based on the goal and audience.
      - If adding additional learning objectives, ensure they are relevant to the goal, audience and the existing learning objectives. Always provide the user with the full list of learning objectives including any new suggestions.
      – Make sure the user is satisfied with the goal and audience before proceeding to the research step. *🚩 CRITICAL*

      ### Step 2: **Research**
      - Conduct online research using the search tool to gather detailed, relevant information based on the course plans "webSearchQueries" which includes search strings related to both the goal and audience.
      – Make sure you search all goalResearchQueries audienceResearchQueries by calling the search tool once for each query.
      
      ### Step 3: **Topic Generation**
      - Generate relevant course topics using the dedicated topic-generation tool, based on:
        - Research results
        - User-defined goal (default: "Learn the fundamentals of AI")
        - Audience (default: "Beginners")
      
      ### Step 4: **Course Outline Generation**
      - Generate a detailed course outline using the generateCourseOutline tool, always including:
        - Goal (user-defined or default)
        - Audience (user-defined or default "Beginners")
        - At least 3 clear and structured topics
      – The generated outline JSON acts as a base for the course.
    
      ### Step 5: **Course content generation**
      - Extend the course chapters sections with a new "content" array field, where you create the full and comprehensive content for each section.
     
      ### Step 6: **Save Course**
      - Save the completed course using the storage tool.
      - Do not display course content directly after saving—users will view it themselves.
      
      ---
            
      Always strictly follow these guidelines to ensure consistency, accuracy, and clarity for users.`
        });
      
        const result = streamText({
            model: openai2('qwen2.5-14b-instruct@q8_0'),
            messages,
            experimental_continueSteps: true,
            temperature: 0.1,
            toolCallStreaming: true,
            onFinish: async (result) => {
                console.log("LLM API Call Result: ", JSON.stringify(result));
            },
            onError: async (error) => {
                // Log errors but allow the stream to continue if possible
                console.error("LLM API Call Error:", error);
            },
            tools: {
                planCourse: tool({
                    description: 'Generates a comprehensive and detailed course plan by explicitly expanding the goal and audience, including generating effective web search queries to enhance understanding. Confirm satisfaction with user before proceeding.',
                    parameters: z.object({
                      goal: z.object({
                        originalGoal: z.string().describe(
                          'The exact course goal provided by the user without modifications.'
                        ),
                        optimizedGoal: z.string().optional().describe(
                          'A refined and more precise restatement of the original goal if improvement is needed.'
                        ),
                        rationale: z.string().describe(
                          'A brief and clear justification explaining why this goal is important to the specified audience. Generate this yourself.'
                        ),
                        learningObjectives: z.array(z.string()).describe(
                          'Clearly defined learning objectives generated from the goal and audience.'
                        ),
                        outcome: z.array(z.string()).describe(
                          'Explicit descriptions of skills or competencies learners will have after completing the course. Generate these yourself.'
                        ),
                        scope: z.object({
                          included: z.array(z.string()).describe(
                            'Topics explicitly included in the course coverage. Generate these yourself.'
                          ),
                          excluded: z.array(z.string()).describe(
                            'Topics explicitly excluded from the course coverage. Generate these yourself.'
                          ),
                        }).describe(
                          'Clarifies course coverage boundaries explicitly.'
                        ),
                      }),
                      audience: z.object({
                        originalAudience: z.string().describe(
                          'The exact audience provided by the user without modifications.'
                        ),
                        optimizedAudience: z.string().optional().describe(
                          'An improved, clearer audience description if refinement is beneficial.'
                        ),
                        audienceDetails: z.array(z.string()).describe(
                          'Explicit characteristics or prerequisites of the audience. Generate these yourself.'
                        ),
                        audienceNeeds: z.array(z.string()).describe(
                          'Learning needs, motivations, or goals of the audience. Generate these yourself.'
                        ),
                      }),
                      webSearchQueries: z.object({
                        goalResearchQueries: z.array(z.string()).describe(
                          'Explicitly generated search queries intended to gather comprehensive and updated information about the course goal. Generate these queries yourself, ensuring broad coverage and depth.'
                        ),
                        audienceResearchQueries: z.array(z.string()).describe(
                          'Explicitly generated search queries intended to deeply understand the audience, including their typical characteristics, learning needs, and common challenges. Generate these yourself, ensuring thoroughness.'
                        ),
                      }).describe(
                        'Clearly defined web search queries to gather extensive and updated insights about both the course goal and audience.'
                      ),
                    }),
                    execute: async ({ goal, audience, webSearchQueries }) => {
                      return {
                        goal,
                        audience,
                        webSearchQueries,
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
                    description: 'Generate course topics based on user provided goal and audience. Returns a JSON object containing the course structure.',
                    parameters: z.object({
                        goal: z.string().describe('The goal of the course'),
                        audience: z.string().default("Beginners").describe('The audience of the course'),
                    }),

                    execute: async ({ goal, audience }) => {
                        try {
                            const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/generateTopics`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ goal, audience }),
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

                generateCourseOutline: tool({
                    description: 'Generate a course outline based on planning and research. The generated outline acts as a base for the course. Returns a JSON object containing the course structure.',
                    parameters: z.object({
                        courseOutline: z.object({
                            title: z.string().describe('The title of the course'),
                            description: z.string().describe('The description of the course'),
                            goal: z.string().describe('The goal of the course'),
                            audience: z.string().describe('The audience of the course'),
                            topics: z.array(z.string().describe('Topic'),).describe('The topics of the course'),
                            chapters: z.array(z.object({
                                title: z.string().describe('The title of the chapter'),
                                sections: z.array(z.object({
                                    title: z.string().describe('The title of the section'),
                                    description: z.string().describe('The description of what the section should contain'),
                                })).min(4).describe('The sections of the chapter'),
                            })).min(4).describe('The chapters of the course'),
                        }),
                    }),
                    execute: async ({ courseOutline }) => {
                        return {
                            courseOutline,
                        };
                    },
                }),

                generateCourseContent: tool({
                    description: 'Generate course content for course chapters -> sections.',
                    parameters: z.object({
                            id : z.string().describe('The unique course ID as provided by the generateCourseOutline tool when the base was generated.'),
                            chapters: z.array(
                                z.object({
                                    title: z.string().describe('The title of the chapter (unchanged)'),
                                    sections: z.array(
                                        z.object({
                                            title: z.string().describe('The title of the section (unchanged)'),
                                            description: z.string().describe('The description of what the section should contain (unchanged)'),
                                            content: z.array(z.string().describe('Generated content for this section').min(8)),
                                        })
                                    ).describe('The sections of the chapter (unchanged, except for content)'),
                                })
                            ).describe('The chapters of the course (unchanged)'),
                        }),
                
                    execute: async ({ chapters }) => {
                        return {
                            chapters,
                        };
                    },
                }),
       


                generateImage: tool({
                    description: 'Generate a realistic photo based on a prompt. Make sure it is described in detail and avoid illutrations, diagrams, text or similar. Returns an image URL.',
                    parameters: z.object({
                        prompt: z.string().describe('Describe the image to generate'),
                    }),

                    execute: async ({ prompt }) => {
                        try {
                            const response = await fetch(`http://89.150.153.77:5000/generate?format=base64`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ prompt }),
                                cache: 'no-store',
                            });

                            const data = await response.json();
                            const imageUrl = data.url;
                            console.log("generateImage API image response:", imageUrl);

                            return imageUrl;
                        } catch (error) {
                            console.error("Error executing generateImage tool:", error);
                            return { error: "An error occurred while generating the quote." };
                        }
                    },
                }),

                generateVideo: tool({
                    description: 'Generate a realistic video based on a prompt. Make sure it is described in detail and avoid illutrations, diagrams, text or similar. Returns a video in webp format.',
                    parameters: z.object({
                        prompt: z.string().describe('Describe the video to generate'),
                    }),

                    execute: async ({ prompt }) => {
                        try {
                            const response = await fetch(`http://89.150.153.77:5000/generate`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ prompt: prompt, model: "video" }),
                                cache: 'no-store',
                            });

                            const data = await response.json();
                            const videoUrl = data;
                            console.log("generateVideo API image response:", videoUrl);

                            return videoUrl;
                        } catch (error) {
                            console.error("Error executing generateVideo tool:", error);
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
                        content: z.record(z.string(), z.any()).optional().describe("The full course content based on the generated outline as a base. (for save)"),
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

            },
            maxSteps: 30,
        });

        // Return the response with proper error handling
        try {
            return result.toDataStreamResponse();
        } catch (error: unknown) {
            console.error("Error converting stream:", error);
            
            // Check if error is an object and has a name property
            if (error && typeof error === 'object' && 'name' in error && 
                error.name === 'AI_MessageConversionError') {
                // Return a graceful error response
                return new Response(JSON.stringify({
                    error: "An error occurred during processing. Please try again.",
                    details: "The connection was interrupted during a tool call."
                }), {
                    status: 500,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
            }
            
            throw error; // Re-throw other errors
        }
    } catch (error: unknown) {
        console.error("Unhandled API error:", error);
        return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}