
// @/lib/serverActions.ts
"use server";

import { writeFile } from "fs/promises";
import { promises as fs } from "fs";

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

export interface Course {
    id: string;
    title: string;
    description?: string[];
    chapters: { title: string; sections: { content: string }[] }[];
    content?: object;
}

export interface CourseError {
    error: string;
}

export async function getCourseById(courseId: string): Promise<Course | CourseError> {
    const filePath = join(process.cwd(), "storage/courses", `${courseId}.json`);

    try {
        const data = await fs.readFile(filePath, "utf-8");
        const course: Course = JSON.parse(data);

        // ✅ Wrap `chapters` into `content` for the editor, but don't modify the file
        return {
            ...course,
            content: {
                type: "doc",
                content: course.chapters.flatMap((chapter, chapterIndex) => [
                    {
                        type: "heading",
                        attrs: { level: 2 },
                        content: [{ type: "text", text: chapter.title }],
                        meta: { type: "chapter", index: chapterIndex },
                    },
                    ...(chapter.sections || []).map((section, sectionIndex) => ({
                        type: "paragraph",
                        content: [{ type: "text", text: section.content || "" }],
                        meta: { type: "section", chapterIndex, sectionIndex },
                    })),
                ]),
            },
        };
    } catch (error) {
        console.error(`❌ Error loading course ${courseId}:`, error);
        return { error: "Course not found" };
    }
}



export async function saveCourse(courseId: string, updatedCourse: Course) {
    const filePath = join(process.cwd(), "storage/courses", `${courseId}.json`);

    try {
        // ✅ Save the course in the same format (don't modify structure)
        const { id, title, description, chapters } = updatedCourse;
        const courseToSave = { id, title, description, chapters };

        await fs.writeFile(filePath, JSON.stringify(courseToSave, null, 2));
        return { success: true, message: "Course saved successfully" };
    } catch (error) {
        console.error("❌ Error saving course:", error);
        return { error: "Failed to save course" };
    }
}


