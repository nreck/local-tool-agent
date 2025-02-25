// @/app/api/imageVision/route.ts
import { generateObject } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { z } from 'zod';

const openai2 = createOpenAICompatible({
    name: 'lmstudio',
    baseURL: 'http://89.150.153.77:1234/v1',
});

export async function POST(req: Request) {
    try {
        // Log incoming request
        console.log("Incoming imageVision request...");

        const body = await req.json();
        console.log("Received payload:", JSON.stringify(body, null, 2));

        const { imageUrl, prompt } = body;

        if (!imageUrl) {
            console.error("Error: Missing imageUrl");
            return new Response(JSON.stringify({ error: "Image URL is required" }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        console.log("Calling generateObject with:");
        console.log("Model: llava-v1.5-7b");
        console.log("Image URL:", imageUrl);
        console.log("Prompt:", prompt || "No additional instructions provided");

        // Structured image analysis request
        const response = await generateObject({
            model: openai2('llava-v1.5-7b'),
            system: `You are a visual descriptor assistant that describes images and extracts information from them. Your output MUST be valid JSON and follow the given schema.`,
            prompt: `Analyze the following image:\n\n${imageUrl}\n\nAdditional instructions: ${prompt || "Provide a detailed description."}`,
            temperature: 0.2,
            schema: z.object({
                imageVision: z.array(z.object({
                    description: z.string().describe('Detailed description of the image'),
                    objects: z.array(z.string()).describe('List of main objects detected in the image'),
                    text: z.string().describe('Text detected in the image'),
                    scene: z.string().describe('Overall scene description'),
                    attributes: z.object({
                        colors: z.array(z.string()).describe('Dominant colors in the image'),
                        lighting: z.string().describe('Lighting conditions'),
                        composition: z.string().describe('Image composition description')
                    }).describe('Visual attributes of the image'),
                })),
            }),
        });

        // Log the full response from the AI
        console.log("AI Response:", JSON.stringify(response, null, 2));

        return Response.json(response);

    } catch (error: any) {
        console.error("Error in image analysis:", error);

        // Log additional error details if available
        if (error.response) {
            console.error("Error Response Data:", JSON.stringify(error.response, null, 2));
        }
        if (error.text) {
            console.error("Error Text:", error.text);
        }
        if (error.usage) {
            console.error("Usage Info:", JSON.stringify(error.usage, null, 2));
        }

        return new Response(JSON.stringify({ error: "Failed to analyze image", details: error.message || error }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
