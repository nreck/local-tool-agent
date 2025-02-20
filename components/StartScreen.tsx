import { CakeIcon } from "@heroicons/react/16/solid";

// @/components/StartScreen.tsx
interface StartScreenProps {
    label?: string;
    className?: string;
  }
  
  const StartScreen = ({ label, className }: StartScreenProps) => {
    return (
      <div className={`relative flex w-full items-center ${className || ""}`}>
        <div className="flex flex-col p-3 border border-zinc-200 rounded-lg">
            <CakeIcon className="w-6 h-6 text-gray-300" />
            <span className="Create a recipe"></span>
        </div>
        
      </div>
    );
  };
  
  export default StartScreen;
  