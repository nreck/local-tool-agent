"use server";

import { writeFile } from "fs/promises";
import { join } from "path";

export async function uploadImage(formData: FormData) {
    const file = formData.get("image") as File | null;

    if (!file) {
        return { error: "No file uploaded" };
    }

    try {
        // Save image in the public/uploads folder (temporary storage, use a cloud provider for production)
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const filePath = join(process.cwd(), "public/uploads", file.name);

        await writeFile(filePath, buffer);

        return { success: true, imageUrl: `/uploads/${file.name}` };
    } catch (error) {
        console.error("Error uploading image:", error);
        return { error: "Failed to upload image" };
    }
}
