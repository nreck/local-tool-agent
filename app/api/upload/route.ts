// @/app/api/upload/route.ts
import { writeFile } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

export async function POST(req: NextRequest) {
    const formData = await req.formData();
    const file = formData.get("image") as File;

    if (!file) {
        return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const fileBuffer = await file.arrayBuffer();
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = path.join(process.cwd(), "public/uploads", fileName);

    try {
        await writeFile(filePath, Buffer.from(fileBuffer));
        // Get the base URL from the request
        const protocol = req.headers.get("x-forwarded-proto") || "http";
        const host = req.headers.get("host") || "";
        const baseUrl = `${protocol}://${host}`;

        // Return the full URL to the uploaded image
        const imageUrl = `${baseUrl}/uploads/${fileName}`;
        return NextResponse.json({
            imageUrl,
            name: file.name,
            contentType: file.type
        });
    } catch (error) {
        return NextResponse.json({ error: "File upload failed" }, { status: 500 });
    }
}