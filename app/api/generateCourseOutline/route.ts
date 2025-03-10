// @/app/api/generateCourseOutline/route.ts
import { generateObject } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { z } from 'zod';

const openai2 = createOpenAICompatible({
    name: 'lmstudio',
    baseURL: 'http://89.150.153.77:1234/v1',
});

export async function POST(req: Request) {
    try {
        let { goal, audience, topics } = await req.json();

        if (!goal || goal.trim() === "") goal = "Learn the fundamentals of AI";
        if (!audience || audience.trim() === "") audience = "Beginners interested in AI";
        if (!Array.isArray(topics) || topics.length === 0) {
            topics = ["Introduction to AI", "Machine Learning Basics", "Deep Learning Concepts"];
        }

        console.log("generateCourseOutline received:", { goal, audience, topics });

        const response = await generateObject({
            model: openai2('qwen2.5-14b-instruct@q8_0'),
            system: `You are an english course outline generator. Your output MUST be valid JSON and follow the given schema. DO NOT provide explanations, introductions, markdown formatting, or any extra text—only return the JSON object.`,
            prompt: `Create a course outline for a course with the goal of "${goal}". Topics: ${topics.join(", ")}. Audience: ${audience}.`,
            temperature: 0.4,
            maxTokens: 8000,
            schemaName: "CourseOutline",
            schema: z.object({
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
                        })).describe('The sections of the chapter'),
                    })).describe('The chapters of the course'),
                }),
            }),
        });

        console.log("generateCourseOutline final output:", JSON.stringify(response, null, 2));

        return response.toJsonResponse();

    } catch (error) {
        console.error("Error in generateCourseOutline:", error);
        return new Response(JSON.stringify({ error: "Failed to generate course outline." }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
