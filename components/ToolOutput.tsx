import { useState } from "react";
import { MemoizedMarkdown } from "@/components/memoized-markdown";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

interface ToolOutputProps {
    toolName: string;
    result: any;
    id: string;
}

export default function ToolOutput({ toolName, result, id }: ToolOutputProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="inline items-center w-full min-w-full py-2">
            {/* Expand/Collapse Button */}
            <button
                onClick={() => setIsExpanded(prev => !prev)}
                className="flex items-center gap-x-1.5 font-bold font-mono text-xs focus:outline-none"
            >
                {isExpanded ? (
                    <ChevronUpIcon className="h-3.5 w-3.5 stroke-2 transition-transform duration-300" />
                ) : (
                    <ChevronDownIcon className="h-3.5 w-3.5 stroke-2 transition-transform duration-300" />
                )}
                <span className="pl-1.5">Tool:</span><span className="text-zinc-800 font-semibold">{toolName}</span>
            </button>

            {/* Function Call Details (Expandable) */}
            {isExpanded && (
                <div className="flex flex-col text-sm gap-y-1.5 transition-opacity duration-300 opacity-100 pt-3">
                    {/* Tool Name */}
                    <div className="flex items-start gap-x-1.5 border border-zinc-200 pr-0 pl-2 rounded-md max-w-fit from-zinc-50 bg-gradient-to-br via-80% via-zinc-400/10 to-white overflow-hidden font-semibold text-xs tracking-tight">
                        <span className="py-1.5 min-w-[80px]">Tool</span>
                        <span className="text-xs font-mono font-normal tracking-wide text-zinc-900 bg-white/80 border-l border-zinc-200 px-2.5 py-1.5">
                            {toolName}
                        </span>
                    </div>

                    {/* Dynamic Key-Value Pairs */}
                    {Object.entries(result).map(([key, value]) => (
                        <div key={key} className="flex items-start gap-x-1.5 border border-zinc-200 pr-0 pl-2 rounded-md w-fit max-w-xl from-zinc-50 bg-gradient-to-br via-80% via-zinc-400/10 to-white overflow-hidden font-semibold text-xs tracking-tight">
                            <span className="py-1.5 min-w-[80px]">{key}</span>
                            <span className="text-xs font-mono font-normal tracking-wide text-zinc-900 bg-white/80 border-l border-zinc-200 px-2.5 py-1.5 max-h-40 overflow-hidden overflow-y-scroll">
                                {Array.isArray(value) ? value.join(", ") : typeof value === "object" ? JSON.stringify(value) : String(value)}
                            </span>
                        </div>
                    ))}

                    {/* Special handling for reviewRecipe - Render Markdown */}
                    {toolName === "reviewRecipe" && (
                        <div className="min-w-full flex flex-col bg-zinc-200/80 text-xs p-4 rounded-md max-h-40 overflow-hidden overflow-y-scroll">
                            <MemoizedMarkdown id={`${id}-review`} content={result.review || "No review available"} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
