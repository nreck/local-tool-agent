import { useState } from "react";
import { MemoizedMarkdown } from "@/components/memoized-markdown";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

interface ToolOutputProps {
    toolName: string;
    result: any;
    id: string;
}

export default function ToolOutput({ toolName, result, id }: ToolOutputProps) {
    const [isExpanded, setIsExpanded] = useState(true);

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
                    {/* Dynamic Key-Value Pairs */}
                    {Object.entries(result).map(([key, value]) => {
                        // 1) Special case: 'results' array from tvlySearch
                        if (key === "results" && Array.isArray(value)) {
                            return (
                                <div
                                    key={key}
                                    className="flex flex-col gap-1 border border-zinc-200 p-2 rounded-md w-fit max-w-xl bg-gradient-to-br from-zinc-50 via-zinc-400/10 to-white font-semibold text-xs tracking-tight"
                                >
                                    <span className="pb-1 font-bold">{key}:</span>
                                    <div className="text-xs font-normal tracking-wide text-zinc-900">
                                        {value.length > 0 ? (
                                            value.map((item: any, index: number) => (
                                                <div key={index} className="mb-2 p-2 border-b last:border-none border-zinc-300">
                                                    <p className="font-bold">Result #{index + 1}</p>
                                                    {/* Safely render fields if they exist */}
                                                    {item.title && <p className="mt-1"><strong>Title:</strong> {item.title}</p>}
                                                    {item.url && <p className="mt-1"><strong>URL:</strong> {item.url}</p>}
                                                    {item.content && <p className="mt-1 whitespace-pre-wrap"><strong>Content:</strong> {item.content}</p>}
                                                </div>
                                            ))
                                        ) : (
                                            <p>No results found.</p>
                                        )}
                                    </div>
                                </div>
                            );
                        }

                        // 2) Special case: 'images' array from tvlySearch
                        if (key === "images" && Array.isArray(value)) {
                            return (
                                <div
                                    key={key}
                                    className="flex flex-col gap-1 border border-zinc-200 p-2 rounded-md w-fit max-w-xl bg-gradient-to-br from-zinc-50 via-zinc-400/10 to-white font-semibold text-xs tracking-tight"
                                >
                                    <span className="pb-1 font-bold">{key}:</span>
                                    <div className="text-xs font-normal tracking-wide text-zinc-900 flex flex-wrap gap-2">
                                        {value.length > 0 ? (
                                            value.map((item: any, index: number) => {
                                                // If we have an object with { url, description } -> handle it
                                                if (typeof item === "object" && item.url) {
                                                    return (
                                                        <div key={index} className="flex flex-col border p-1 rounded-md max-w-[100px] items-center">
                                                            <img src={item.url} alt={`tvly-search-image-${index}`} className="max-w-[96px] max-h-[96px] object-cover" />
                                                            {item.description && (
                                                                <p className="text-[10px] text-center mt-1">{item.description}</p>
                                                            )}
                                                        </div>
                                                    );
                                                }
                                                // If it's just a URL string
                                                if (typeof item === "string") {
                                                    return (
                                                        <div key={index} className="border p-1 rounded-md max-w-[100px]">
                                                            <img src={item} alt={`tvly-search-image-${index}`} className="max-w-[96px] max-h-[96px] object-cover" />
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })
                                        ) : (
                                            <p>No images found.</p>
                                        )}
                                    </div>
                                </div>
                            );
                        }

                        // 3) Default rendering for everything else
                        return (
                            <div
                                key={key}
                                className="flex items-start gap-x-1.5 border border-zinc-200 pr-0 pl-2 rounded-md w-fit max-w-xl from-zinc-50 bg-gradient-to-br via-80% via-zinc-400/10 to-white overflow-hidden font-semibold text-xs tracking-tight"
                            >
                                <span className="py-1.5 min-w-[80px]">{key}</span>
                                <span className="text-xs font-mono font-normal tracking-wide text-zinc-900 bg-white/80 border-l border-zinc-200 px-2.5 py-1.5 max-h-40 overflow-hidden overflow-y-scroll">
                                    {Array.isArray(value) ? (
                                        value.every(item => typeof item === "object") ? (
                                            <div className="flex flex-col gap-2">
                                                {value.map((item, index) => (
                                                    <div key={index} className="p-2 border border-zinc-300 rounded-md">
                                                        <pre className="text-xs font-mono whitespace-pre-wrap">{JSON.stringify(item, null, 2)}</pre>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            value.join(", ")
                                        )
                                    ) : typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)}

                                </span>
                            </div>
                        );
                    })}


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
