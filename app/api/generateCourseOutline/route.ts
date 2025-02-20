// @/app/api/generateCourseOutline/route.ts
import { streamText } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

const openai2 = createOpenAICompatible({
    name: 'lmstudio',
    baseURL: 'http://localhost:1234/v1',
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

        const response = streamText({
            model: openai2('qwen2.5-7b-instruct-1m@q3_k_l'),
            system: "You are a course outline generator.",
            prompt: `Create a course outline for a course with the goal of "${goal}". Topics: ${topics.join(", ")}. Audience: ${audience}.`,
            maxSteps: 6,
            onFinish: async (result) => {
                console.log("generateCourseOutline output:", result.text); // Log the string output
            },
        });

        // Return as plain text instead of JSON
        return new Response(response.textStream, {
            status: 200,
            headers: { 'Content-Type': 'text/plain' }, // Ensure plain text response
        });

    } catch (error) {
        console.error("Error in generateCourseOutline:", error);
        return new Response("Failed to generate course outline.", { status: 500 });
    }
}
