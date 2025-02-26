import { v4 as uuidv4 } from "uuid"; // UUID generator
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Define the storage path
const STORAGE_DIR = path.join(process.cwd(), "storage/courses");

// Ensure directory exists
if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

// ✅ Create a new course with a generated UUID
export async function POST(req: NextRequest) {
    try {
        console.log("🔹 Received POST request to save course");

        const body = await req.json();
        console.log("📌 Request Body:", body);

        const { title, content } = body;
        if (!title || !content) {
            console.error("❌ Missing title or content");
            return NextResponse.json({ error: "Missing title or content" }, { status: 400 });
        }

        // Generate a UUID-based ID
        const id = uuidv4();
        const filePath = path.join(STORAGE_DIR, `${id}.json`);

        console.log(`📁 Saving course with ID: ${id}`);

        // Store `title` inside JSON
        const courseData = { id, title, ...content };
        fs.writeFileSync(filePath, JSON.stringify(courseData, null, 2));

        console.log("✅ Course saved successfully");
        return NextResponse.json({ success: true, id, message: "Course saved successfully" });

    } catch (error) {
        console.error("❌ Error in POST request:", error);
        return NextResponse.json({ error: "Failed to save course", details: String(error) }, { status: 500 });
    }
}

// ✅ Retrieve a specific course OR list all courses
export async function GET(req: NextRequest) {
    try {
        console.log("🔹 Received GET request to fetch course(s)");

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (id) {
            console.log(`📌 Fetching course with ID: ${id}`);
            const filePath = path.join(STORAGE_DIR, `${id}.json`);
            if (!fs.existsSync(filePath)) {
                console.error(`❌ Course not found: ${id}`);
                return NextResponse.json({ error: "Course not found" }, { status: 404 });
            }
            const content = fs.readFileSync(filePath, "utf-8");
            console.log("✅ Course retrieved successfully");
            return NextResponse.json(JSON.parse(content));
        } 
        
        else {
            console.log("📌 Listing all stored courses...");
            const files = fs.readdirSync(STORAGE_DIR).filter(file => file.endsWith(".json"));

            const courses = files.map(file => {
                const filePath = path.join(STORAGE_DIR, file);
                const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
                return { id: file.replace(".json", ""), title: content.title };
            });

            console.log("✅ Found courses:", courses);
            return NextResponse.json({ courses });
        }
    } catch (error) {
        console.error("❌ Error retrieving course data:", error);
        return NextResponse.json({ error: "Failed to retrieve course data" }, { status: 500 });
    }
}

// ✅ Edit an existing course
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
        let courseData = JSON.parse(fs.readFileSync(filePath, "utf-8"));

        console.log(`✏️ Updating key "${key}" with value:`, value);

        // Convert key into a path array (e.g., "chapters/1/sections/1/content" → ["chapters", "1", "sections", "1", "content"])
        const pathKeys: string[] = key.split("/").filter((k: string) => k !== ""); 

        let ref: any = courseData;
        for (let i = 0; i < pathKeys.length - 1; i++) {
            const keyPart: string = pathKeys[i];

            // Convert numerical indexes to integers
            const index = parseInt(keyPart);
            if (!isNaN(index)) {
                if (!Array.isArray(ref)) {
                    console.error(`❌ Path error: Expected an array at ${pathKeys.slice(0, i + 1).join("/")}, but found ${typeof ref}`);
                    return NextResponse.json({ error: `Invalid path: ${pathKeys.slice(0, i + 1).join("/")}` }, { status: 400 });
                }
                if (!ref[index]) {
                    console.error(`❌ Path error: Index ${index} does not exist in array at ${pathKeys.slice(0, i).join("/")}`);
                    return NextResponse.json({ error: `Invalid index: ${index}` }, { status: 400 });
                }
                ref = ref[index]; // Navigate to next level
            } else {
                if (!(keyPart in ref)) {
                    console.error(`❌ Path error: Key "${keyPart}" not found at ${pathKeys.slice(0, i).join("/")}`);
                    return NextResponse.json({ error: `Invalid key: ${keyPart}` }, { status: 400 });
                }
                ref = ref[keyPart]; // Navigate deeper
            }
        }

        // Set the final key value
        const lastKey: string = pathKeys[pathKeys.length - 1];
        ref[lastKey] = value;

        // Save back to file
        fs.writeFileSync(filePath, JSON.stringify(courseData, null, 2));

        console.log("✅ Course updated successfully");
        return NextResponse.json({ success: true, message: "Course updated successfully" });

    } catch (error) {
        console.error("❌ Error in PUT request:", error);
        return NextResponse.json({ error: "Failed to update course", details: String(error) }, { status: 500 });
    }
}
