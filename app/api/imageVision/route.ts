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
        const { imageUrl, prompt } = await req.json();

        if (!imageUrl) {
            return new Response(JSON.stringify({ error: "Image URL is required" }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const response = await generateObject({
            model: openai2('llava-v1.5-7b'),
            system: `You are a visual descriptor assistant that describes images and extracts information from them. Your output MUST be valid JSON and follow the given schema.`,
            prompt: prompt ? `Analyze these images: ${imageUrl}. ${prompt}` : `Analyze these images: ${imageUrl}`,
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

        console.log("Image analysis result:", JSON.stringify(response, null, 2));
        return Response.json(response);

    } catch (error) {
        console.error("Error in image analysis:", error);
        return new Response(JSON.stringify({ error: "Failed to analyze image" }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
