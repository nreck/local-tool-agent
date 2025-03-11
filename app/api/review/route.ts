// @/app/api/review/route.ts
import { generateText } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { z } from 'zod';

const openai2 = createOpenAICompatible({
    name: 'lmstudio',
    baseURL: 'http://localhost:1234/v1',
});

export async function POST(req: Request) {
    const { recipe, ingredients } = await req.json();

    const prompt = `Recipe: ${recipe}. Includes the following ingredients: ${ingredients.join(", ")}.`;

    const { text } = await generateText({
        model: openai2('qwen2.5-14b-instruct-1m@q8_0'),
        system: "You a a recipe reviwer that reviews recipes based on name and ingredients, in order to ensure the recipe covers the full scope of the ingredients and is easy to follow.",
        prompt: prompt,
    });

    console.log("reviewRecipe output:", text);

    return new Response(JSON.stringify({ review: text }), {  // ✅ Wrap text inside an object
        headers: { 'Content-Type': 'application/json' },
        status: 200,
    });
}
