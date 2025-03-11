// @/app/api/generateTopics/route.ts
import { generateObject } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { z } from 'zod';

const openai2 = createOpenAICompatible({
    name: 'lmstudio',
    baseURL: 'http://89.150.153.77:1234/v1',
});

export async function POST(req: Request) {
    try {
        let { goal, audience } = await req.json();

        if (!goal || goal.trim() === "") goal = "Learn the fundamentals of AI";
        if (!audience || audience.trim() === "") audience = "Beginners interested in AI";
        console.log("generateTopics received:", { goal, audience });

        const response = await generateObject({
            model: openai2('qwen2.5-14b-instruct'),
            system: `You are an english topic generator that generates highly relevant one-two words topics based on a goal and audience. Your output MUST be valid JSON and follow the given schema. DO NOT provide explanations, introductions, markdown formatting, or any extra text—only return the JSON object.`,
            prompt: `Create a course outline for a course with the goal of "${goal}". Audience: "${audience}".`,
            temperature: 0.2,
            schemaName: "topics",
            schema: z.object({
                goal: z.string().describe('The goal from the user'),
                audience: z.string().describe('The audience of the course'),
                topics: z.array(z.object({
                    topic: z.string().describe('The topic name'),
                    reasoning: z.string().describe('Your reasoning for this topic')
                })).describe('Array of topics'),
                reasoning: z.string().describe('Your overall reasoning for the topic selection'),
            }),
        });

        console.log("generateTopics final output:", JSON.stringify(response, null, 2));

        return response.toJsonResponse();

    } catch (error) {
        console.error("Error in generateTopics:", error);
        return new Response(JSON.stringify({ error: "Failed to generate topics." }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
