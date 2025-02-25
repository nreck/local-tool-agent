// @/app/api/course/blob/route.js
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Define the storage path
const STORAGE_DIR = path.join(process.cwd(), "storage/courses");

// Ensure directory exists
if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

// ✅ Save or update course JSON
export async function POST(req: NextRequest) {
    try {
        console.log("🔹 Received POST request to save course");

        const body = await req.json();
        console.log("📌 Request Body:", body);

        const { id, content } = body;
        if (!id || !content) {
            console.error("❌ Missing ID or content");
            return NextResponse.json({ error: "Missing ID or content" }, { status: 400 });
        }

        const filePath = path.join(STORAGE_DIR, `${id}.json`);
        console.log(`📁 Saving course to: ${filePath}`);

        fs.writeFileSync(filePath, JSON.stringify(content, null, 2));

        console.log("✅ Course saved successfully");
        return NextResponse.json({ success: true, message: "Course saved successfully" });
    } catch (error) {
        console.error("❌ Error in POST request:", error);
        return NextResponse.json({ error: "Failed to save course", details: String(error) }, { status: 500 });
    }
}

// ✅ Retrieve a course JSON
export async function GET(req: NextRequest) {
    try {
        console.log("🔹 Received GET request to fetch course");

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        console.log("📌 Course ID:", id);

        if (!id) {
            console.error("❌ Missing ID parameter");
            return NextResponse.json({ error: "Missing ID" }, { status: 400 });
        }

        const filePath = path.join(STORAGE_DIR, `${id}.json`);
        if (!fs.existsSync(filePath)) {
            console.error(`❌ Course not found: ${filePath}`);
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        console.log(`📁 Reading course from: ${filePath}`);
        const content = fs.readFileSync(filePath, "utf-8");

        console.log("✅ Course retrieved successfully");
        return NextResponse.json(JSON.parse(content));
    } catch (error) {
        console.error("❌ Error in GET request:", error);
        return NextResponse.json({ error: "Failed to retrieve course", details: String(error) }, { status: 500 });
    }
}

// ✅ Edit a specific line in course JSON
export async function PUT(req: NextRequest) {
    try {
        console.log("🔹 Received PUT request to edit course");

        const body = await req.json();
        console.log("📌 Request Body:", body);

        const { id, key, value } = body;
        if (!id || !key || value === undefined) {
            console.error("❌ Missing ID, key, or value");
            return NextResponse.json({ error: "Missing ID, key, or value" }, { status: 400 });
        }

        const filePath = path.join(STORAGE_DIR, `${id}.json`);
        if (!fs.existsSync(filePath)) {
            console.error(`❌ Course not found: ${filePath}`);
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        console.log(`📁 Reading course for update: ${filePath}`);
        let content = JSON.parse(fs.readFileSync(filePath, "utf-8"));

        console.log(`✏️ Updating key "${key}" with value:`, value);
        content[key] = value;

        fs.writeFileSync(filePath, JSON.stringify(content, null, 2));

        console.log("✅ Course updated successfully");
        return NextResponse.json({ success: true, message: "Course updated successfully" });
    } catch (error) {
        console.error("❌ Error in PUT request:", error);
        return NextResponse.json({ error: "Failed to update course", details: String(error) }, { status: 500 });
    }
}
