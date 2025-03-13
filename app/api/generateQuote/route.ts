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
        let { quote, author, source } = await req.json();

        // Set defaults if not provided
        if (!quote || quote.trim() === "") quote = "inspiration";
        if (!author || author.trim() === "") author = "motivational";
        if (!source || source.trim() === "") source = "medium";

        console.log("generateQuote received:", { quote, author, source });

        const response = await generateObject({
            model: openai2('qwq-32b'),
            system: `You are a quote formatter. Your output MUST be valid JSON and follow the given schema..`,
            prompt: `Quote: "${quote}". Author: "${author}". Source: "${source}".`,
            temperature: 0.5,
            schemaName: "Quote",
            schema: z.object({
                quote: z.object({
                    quote: z.string().describe('The quote'),
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
