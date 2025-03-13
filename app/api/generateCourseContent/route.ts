// @/app/api/generateCourseContent/route.ts
import { generateObject } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { z } from 'zod';

const openai2 = createOpenAICompatible({
    name: 'lmstudio',
    baseURL: 'http://89.150.153.77:1234/v1',
});

export async function POST(req: Request) {
    try {
        let { courseOutline } = await req.json();
        console.log("generateCourseContent received:", { courseOutline });

        const response = await generateObject({
            model: openai2('qwq-32b'),
            system: `You are an english course content generator. Your output MUST be valid JSON and follow the given schema. DO NOT provide explanations, introductions, markdown formatting, or any extra text—only return the JSON object.`,
            prompt: `Generate the content for the course sections based on the outline ${courseOutline}.`,
            temperature: 0.4,
            maxTokens: 8000,
            schemaName: "CourseContent",
            schema: z.object({
                courseContent: z.object({
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

        console.log("generateCourseContent final output:", JSON.stringify(response, null, 2));

        return response.toJsonResponse();

    } catch (error) {
        console.error("Error in generateCourseContent:", error);
        return new Response(JSON.stringify({ error: "Failed to generate course outline." }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
