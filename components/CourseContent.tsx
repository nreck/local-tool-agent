// @/components/CourseContent.tsx
interface CourseData {
  title: string;
  description?: string[] | string;
  goal?: string;
  audience?: string;
  topics?: string[] | string;
  chapters?: {
    title: string;
    sections: {
      title: string;
      description?: string;
      content?: string[] | string;        
    }[];
  }[];
  courseOutline?: {
    title: string;
    description?: string[] | string;
    goal?: string;
    audience?: string;
    topics?: string[] | string;
    chapters: {
      title: string;
      sections: {
        title: string;
        description?: string;
        content?: string[] | string;
      }[];
    }[];
  };
}

export default function CourseContent({ data }: { data: CourseData }) {
  // Get title from either root or courseOutline
  const title = data.courseOutline?.title || data.title;
  
  // Handle cases where description might be in different places or formats
  const descriptions = (() => {
    const desc = data.courseOutline?.description || data.description;
    return Array.isArray(desc) 
      ? desc 
      : typeof desc === 'string' 
        ? [desc] 
        : [];
  })();

  // Handle chapters that might be at root level or nested in courseOutline
  const chapters = data.chapters || data.courseOutline?.chapters || [];

  return (
    <div className="space-y-4 p-1.5 pr-8">
      <h1 className="text-xl font-bold">{title}</h1>
      
      {descriptions.length > 0 && (
        <div className="space-y-2">
          {descriptions.map((desc, i) => (
            <p key={i} className="text-zinc-600">{desc}</p>
          ))}
        </div>
      )}

      <div className="space-y-6">
        {chapters.map((chapter, i) => (
          <div key={i} className="space-y-3">
            <h2 className="text-md font-bold">{chapter.title}</h2>
            <div className="space-y-3 pl-1.5">
              {chapter.sections.map((section, j) => (
                <div key={j} className="border-l-2 border-zinc-400/50 pl-4 flex flex-col gap-y-1 py-1.5">
                  <h3 className="font-semibold text-sm">{section.title}</h3>
                  <p className="text-zinc-600 text-sm">{section.content}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
