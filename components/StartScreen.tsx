// @/components/StartScreen.tsx
import { CakeIcon } from "@heroicons/react/16/solid";

interface StartScreenProps {
  onPromptClick: (prompt: string) => void;
}

const promptTemplates = [
  {
    icon: <CakeIcon className="w-6 h-6 text-zinc-400 mb-1 mx-auto" />,
    label: "Create recipe",
    prompt: "How do I bake a chocolate cake?"
  },
  {
    icon: "🌤️",
    label: "Weather forecast",
    prompt: "How's the weather in Copenhagen today?"
  },
  {
    icon: "📚",
    label: "Find a book",
    prompt: "Can you recommend a good book?"
  },
  {
    icon: "🔍",
    label: "Search the web",
    prompt: "Find information about eloomi."
  },

  {
    icon: "🎓",
    label: "Create course",
    prompt: "Create a course about artificial intelligence."
  },
  {
    icon: "🗂️",
    label: "Find topics",
    prompt: "Show me trending topics in technology."
  }
];


const StartScreen = ({ onPromptClick }: StartScreenProps) => {
  return (
    <div className="flex flex-col items-center space-y-5">
      <div className="flex flex-col items-center space-y-1.5 mb-4">
      <h2 className="text-lg font-medium text-zinc-600"><span className="font-semibold text-zinc-900">dayforce </span><span className="font-light">/</span> Learning assistant</h2>
      <span className="text-zinc-500 text-sm">Prototype currently running on Qwen-2.5-14B</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {promptTemplates.map((template, index) => (
          <button 
            key={index}
            className="p-3.5 bg-zinc-100 rounded-lg shadow-sm hover:bg-zinc-200"
            onClick={() => onPromptClick(template.prompt)}
          >
            <div className="flex flex-col items-start pr-1.5">
              <div className="flex items-center gap-x-3">
                {template.icon}
               <div className="flex flex-col items-start justify-start">
               <span className="font-semibold text-sm ">{template.label}</span>
               <p className="text-zinc-500 text-xs mt-0.5 ">{template.prompt}</p>
               </div>

              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default StartScreen;
