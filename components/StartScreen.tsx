// @/components/StartScreen.tsx
import { CakeIcon } from "@heroicons/react/16/solid";

interface StartScreenProps {
  onPromptClick: (prompt: string) => void;
}

const promptTemplates = [
    {
        icon: "🎓",
        label: "Generate course",
        prompt: "Generate a practical, easy-to-follow course for onboarding remote tech employees to Microsoft Teams. The goal is to help them feel comfortable and confident using Teams for daily communication, collaboration, and productivity—without overwhelming them with too much information at once.",
        description: "Generate a structured course outline for specific learning objectives."
    },
    {
        icon: "🔍",
        label: "Search web",
        prompt: "Search the web for eloomi and find the latest information about the company, purpose, stakeholders and products.",
        description: "Search and retrieve information about eloomi."
    },
   
    {
        icon: "🗂️",
        label: "Related topics",
        prompt: "Generate 5 topics about the latest technology trends.",
        description: "Generate topics on technology trends."
    },
    
];

const StartScreen = ({ onPromptClick }: StartScreenProps) => {
  return (
    <div className="flex flex-col items-center space-y-5">
      <div className="flex flex-col items-center space-y-1 mb-3">
      <h2 className="text-xl font-medium text-zinc-600"><span className="font-semibold text-zinc-900">Learning agent </span><span className="font-light">/</span> Client interface</h2>
      <span className="text-zinc-500 text-sm mt-0.5">Currently running on Qwen-2.5-14B</span>
      </div>
      <div className="flex flex-col gap-2.5">
        {promptTemplates.map((template, index) => (
          <button 
            key={index}
            className="p-3.5 px-5 bg-zinc-100 border border-zinc-200 rounded-lg shadow-sm hover:bg-zinc-200"
            onClick={() => onPromptClick(template.prompt)}
          >
            <div className="flex flex-col items-start pr-">
              <div className="flex items-center gap-x-4">
                {template.icon}
               <div className="flex flex-col items-start justify-start">
               <span className="font-medium  text-zinc-800 text-md ">{template.label}</span>
               <p className="text-zinc-500 text-sm max-w-[300px] text-left">{template.description}</p>
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
