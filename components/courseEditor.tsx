// @/components/courseEditor.tsx
import React, { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { getCourseById, saveCourse } from "@/lib/serverActions"; // ✅ Import server actions

interface Course {
  id: string;
  title: string;
  description?: string[];
  chapters: { title: string; sections: { content: string }[] }[];
  content?: object;
}

interface CourseError {
  error: string;
}

interface CourseEditorProps {
  courseId: string;
  onSave: (updatedCourse: Course) => void;
}

const CourseEditor: React.FC<CourseEditorProps> = ({ courseId, onSave }) => {
  const [courseData, setCourseData] = useState<Course | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  // ✅ Auto-refresh every 5 seconds
useEffect(() => {
    const fetchCourse = async () => {
        setLoading(true);
        try {
            const data = await getCourseById(courseId);
            if ("error" in data) throw new Error(data.error);

            // ✅ Only update if content has actually changed
            setCourseData(prevData => 
                JSON.stringify(prevData?.content) !== JSON.stringify(data.content) ? data : prevData
            );
        } catch (err: any) {
            setError(err.message || "Failed to load course");
        } finally {
            setLoading(false);
        }
    };

    if (courseId) {
        fetchCourse();
    }
}, [courseId]);
    
  

  const editor = useEditor({
    extensions: [StarterKit],
    content: courseData?.content || { type: "doc", content: [] }, 
    onUpdate: ({ editor }) => {
        const newContent = editor.getJSON();
        if (newContent?.content && courseData) {
          const updatedChapters = [...courseData.chapters];
      
          let hasChanges = false;
          newContent.content.forEach((node) => {
            if (node.meta) {
              const { type, chapterIndex, sectionIndex } = node.meta;
              if (type === "chapter" && updatedChapters[chapterIndex].title !== node.content?.[0]?.text) {
                updatedChapters[chapterIndex].title = node.content?.[0]?.text || "";
                hasChanges = true;
              }
              if (type === "section" && updatedChapters[chapterIndex].sections[sectionIndex].content !== node.content?.[0]?.text) {
                updatedChapters[chapterIndex].sections[sectionIndex].content = node.content?.[0]?.text || "";
                hasChanges = true;
              }
            }
          });
      
          if (hasChanges) {
            setCourseData({ ...courseData, chapters: updatedChapters });
          }
        }
        editor.view.dispatch(editor.state.tr.setMeta("preventDispatch", true));

      },
      
  });

  // ✅ Sync editor content when course data updates
  useEffect(() => {
    if (editor && courseData?.content && JSON.stringify(editor.getJSON()) !== JSON.stringify(courseData.content)) {
      editor.commands.setContent(courseData.content);
    }
  }, [courseData, editor]);
  
  // ✅ Save updated course data
  const handleSave = async () => {
    if (!courseData) return;
    setSaving(true);
    try {
      const response = await saveCourse(courseId, courseData);
      if (response.error) {
        throw new Error(response.error);
      }
      onSave(courseData);
    } catch (error: any) {
      setError(error.message || "Failed to save course");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading course...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="">
      <h2 className="text-lg font-bold mb-2">Editing: {courseData?.title}</h2>
      <EditorContent editor={editor} />

      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={handleSave}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
};

export default CourseEditor;
