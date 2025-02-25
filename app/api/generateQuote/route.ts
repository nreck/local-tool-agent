// @/app/api/generateQuote/route.ts
import { generateObject } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { z } from 'zod';

const openai2 = createOpenAICompatible({
    name: 'lmstudio',
    baseURL: 'http://89.150.153.77:1234/v1',
});

export async function POST(req: Request) {
    try {
        let { topic, style, length, source } = await req.json();

        // Set defaults if not provided
        if (!topic || topic.trim() === "") topic = "inspiration";
        if (!style || style.trim() === "") style = "motivational";
        if (!length || length.trim() === "") length = "medium";

        console.log("generateQuote received:", { topic, style, length });

        const response = await generateObject({
            model: openai2('qwen2.5-14b-instruct'),
            system: `You are a quote generator. Your output MUST be valid JSON and follow the given schema. Generate thoughtful, impactful quotes that resonate with the given topic and style.`,
            prompt: `Output a quote about ${topic}. Make sure it's a real quote from an actual author that you know the name of. Context from web search: ${source}`,
            temperature: 0.5,
            schemaName: "Quote",
            schema: z.object({
                quote: z.object({
                    text: z.string().describe('The main quote text'),
                    author: z.string().describe('The author of the quote'),
                    source: z.string().describe('What did you base this on?'),
                }),
            }),
        });

        console.log("generateQuote final output:", JSON.stringify(response, null, 2));
        return response.toJsonResponse();

    } catch (error) {
        console.error("Error in generateQuote:", error);
        return new Response(JSON.stringify({ error: "Failed to generate quote." }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
