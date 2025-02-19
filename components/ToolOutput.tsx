// @/components/ToolOutput.tsx
import { MemoizedMarkdown } from "@/components/memoized-markdown";

interface ToolOutputProps {
    toolName: string;
    result: any;
    id: string;
}

export default function ToolOutput({ toolName, result, id }: ToolOutputProps) {
    return (
        <div className="inline items-center rounded-lg mt-2 max-w-fit">
            <span className="font-semibold text-zinc-800 flex mr-3 text-sm hidden">Tools</span>

            <div className="flex flex-col text-sm ">
                {toolName === "weather" && (
                    <div className="flex gap-y-0 gap-x-2 ">
                        <span className="flex items-center gap-x-1.5 border border-zinc-200 pr-0 pl-2 rounded-md max-w-fit from-zinc-50 bg-gradient-to-br  via-80% via-zinc-400/10 to-white overflow-hidden font-semibold text-xs tracking-tight">Location <span className="text-xs font-mono font-normal tracking-wide font- text-zinc-900 bg-white/80 border-lr border-zinc-200 px-2.5 py-1.5 max-w-fit">{result.location}</span></span>
                        <span className="flex items-center gap-x-1.5 border border-zinc-200 pr-0 pl-2 rounded-md max-w-fit from-zinc-50 bg-gradient-to-br  via-80% via-zinc-400/10 to-white overflow-hidden font-semibold text-xs tracking-tight">Temperature <span className="text-xs font-mono font-normal tracking-wide font- text-zinc-900 bg-white/80 border-lr border-zinc-200 px-2.5 py-1.5 max-w-fit">{result.temperature}°F</span></span>
                    </div>
                )}

                {toolName === "date" && (
                    <div className="flex gap-y-1.5 gap-x-2 self-justify-end">
                        <span className="flex items-center gap-x-1.5 border border-zinc-200 pr-0 pl-2 rounded-md max-w-fit from-zinc-50 bg-gradient-to-br  via-80% via-zinc-400/10 to-white overflow-hidden font-semibold text-xs tracking-tight">Date <span className="text-xs font-mono font-normal tracking-wide font- text-zinc-900 bg-white/80 border-lr border-zinc-200 px-2.5 py-1.5 max-w-fit">{result.date}</span></span>
                    </div>

                )}

                {toolName === "generateRecipe" && (
                    <div>
                        <div className="flex flex-col gap-y-1.5 gap-x-2">
                            <span className="flex items-center gap-x-1.5 border border-zinc-200 pr-0 pl-2 rounded-md max-w-fit from-zinc-50 bg-gradient-to-br  via-80% via-zinc-400/10 to-white overflow-hidden font-semibold text-xs tracking-tight">Recipe <span className="text-xs font-mono font-normal tracking-wide font- text-zinc-900 bg-white/80 border-lr border-zinc-200 px-2.5 py-1.5 max-w-fit">{result.recipe}</span></span>
                            <span className="flex items-center gap-x-1.5 border border-zinc-200 pr-0 pl-2 rounded-md max-w-fit from-zinc-50 bg-gradient-to-br  via-80% via-zinc-400/10 to-white overflow-hidden font-semibold text-xs tracking-tight">Ingredients <span className="text-xs font-mono font-normal tracking-wide font- text-zinc-900 bg-white/80 border-lr border-zinc-200 px-2.5 py-1.5  min-w-min">{Array.isArray(result.ingredients) ? result.ingredients.join(", ") : result.ingredients}</span></span>
                        </div>
                        <div className="flex bg-zinc-200/80 mt-2.5 p-4 text-xs rounded-md">
                            {JSON.stringify(result.response)}
                        </div>
                    </div>
                )}

                {toolName === "reviewRecipe" && (
                    <div className="min-w-full flex flex-col bg-zinc-200/80 text-xs p-4 rounded-md max-h-80 overflow-hidden overflow-y-scroll">
                       {result.review}
                    </div>
                )}

                {!(["weather", "date", "generateRecipe", "reviewRecipe"].includes(toolName)) && (
                    <MemoizedMarkdown id={`${id}-default`} content={JSON.stringify(result)} />
                )}
            </div>
        </div>
    );
}
