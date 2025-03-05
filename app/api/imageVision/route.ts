// @/app/api/imageVision/route.ts
import { z } from 'zod';

export async function POST(req: Request) {
    try {
        // Log incoming request
        console.log("Incoming imageVision request...");

        const body = await req.json();
        console.log("Received payload:", JSON.stringify(body, null, 2));

        const { fileUrl } = body;

        if (!fileUrl) {
            console.error("Error: Missing fileUrl");
            return new Response(JSON.stringify({ error: "Image URL is required" }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        console.log("File URL:", fileUrl);

        // Fetch the image from the provided URL
        const imageResponse = await fetch(fileUrl);
        if (!imageResponse.ok) {
            throw new Error(`Failed to fetch image from URL: ${imageResponse.statusText}`);
        }
        
        // Get image as blob
        const imageBlob = await imageResponse.blob();
        
        // Create FormData and append the image
        const formData = new FormData();
        formData.append('file', imageBlob, 'image.jpg');
        
        // Send the image to the vision API
        const visionApiResponse = await fetch('http://89.150.153.77:3005/process_pdf/', {
            method: 'POST',
            body: formData,
        });
        
        if (!visionApiResponse.ok) {
            throw new Error(`Vision API error: ${visionApiResponse.statusText}`);
        }
        
        const response = await visionApiResponse.json();

        // Log the full response from the API
        console.log("API response:", JSON.stringify(response, null, 2));

        return Response.json(response);

    } catch (error: any) {
        console.error("Error in analysis:", error);

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

        return new Response(JSON.stringify({ error: "Failed to analyze", details: error.message || error }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
