import { useState, useMemo } from "react";
import { MemoizedMarkdown } from "@/components/memoized-markdown";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface ToolOutputProps {
    toolName: string;
    result: any;
    id: string;
}

export default function ToolOutput({ toolName, result, id }: ToolOutputProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showFullJson, setShowFullJson] = useState(false);

    // Move the JSON string memoization outside the map function
    const memoizedResults = useMemo(() => {
        return Object.entries(result).map(([key, value]) => {
            if (typeof value === "object" && value !== null) {
                const json = JSON.stringify(value, null, 2) ?? "{}";
                return {
                    key,
                    value,
                    jsonString: json.length > 5000 ? json.slice(0, 5000) + "... (truncated)" : json
                };
            }
            return { key, value, jsonString: null };
        });
    }, [result]);

    return (
        <div className="inline items-center w-full min-w-full py-2">
            {/* Expand/Collapse Button */}
            <button
                onClick={() => setIsExpanded((prev) => !prev)}
                className="flex items-center gap-x-1.5 font-bold font-mono text-xs focus:outline-none"
            >
                {isExpanded ? (
                    <ChevronUpIcon className="h-3.5 w-3.5 stroke-2 transition-transform duration-300" />
                ) : (
                    <ChevronDownIcon className="h-3.5 w-3.5 stroke-2 transition-transform duration-300" />
                )}
                <span className="pl-1.5">Tool:</span>
                <span className="text-zinc-800 font-semibold">{toolName}</span>
            </button>

            {/* Function Call Details (Expandable) */}
            {isExpanded && (
                <div className="flex flex-col text-sm gap-y-1.5 transition-opacity duration-300 opacity-100 pt-3">
                    {/* Tool Name Header */}
                    <div className="flex items-start gap-x-1.5 border border-zinc-200 pr-0 pl-2 rounded-md max-w-fit from-zinc-50 bg-gradient-to-br via-80% via-zinc-400/10 to-white overflow-hidden font-semibold text-xs tracking-tight">
                        <span className="py-1.5 min-w-[80px] text-zinc-900">Tool</span>
                        <span className="text-xs font-mono font-normal tracking-wide text-zinc-900 bg-white/80 border-l border-zinc-200 px-2.5 py-1.5">
                            {toolName}
                        </span>
                    </div>

                    {/* Updated mapping using memoizedResults */}
                    {memoizedResults.map(({ key, value, jsonString }) => {
                        // 1) Special case: 'results' array from search tools
                        if (key === "results" && Array.isArray(value)) {
                            return (
                                <div
                                    key={key}
                                    className="flex flex-col gap-2 border border-zinc-200 p-2 rounded-md max-w-xl bg-gradient-to-br from-zinc-50 via-zinc-400/10 to-white"
                                >
                                    <span className="pb-1 font-bold">{key}:</span>
                                    <div className="text-xs font-normal tracking-wide text-zinc-900">
                                        {value.length > 0 ? (
                                            value.map((item: any, index: number) => (
                                                <div key={index} className="mb-2 p-2 border-b last:border-none border-zinc-300">
                                                    <p className="font-bold">Result #{index + 1}</p>
                                                    {item.title && <p className="mt-1"><strong>Title:</strong> {item.title}</p>}
                                                    {item.url && <p className="mt-1"><strong>URL:</strong> <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{item.url}</a></p>}
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

                        // 2) Special case: 'images' array from search tools
                        if (key === "images" && Array.isArray(value)) {
                            return (
                                <div
                                    key={key}
                                    className="flex flex-col gap-2 border border-zinc-200 p-2 rounded-md max-w-xl bg-gradient-to-br from-zinc-50 via-zinc-400/10 to-white"
                                >
                                    <span className="pb-1 font-bold">{key}:</span>
                                    <div className="text-xs font-normal tracking-wide text-zinc-900 flex flex-wrap gap-2">
                                        {value.length > 0 ? (
                                            value.map((item: any, index: number) => (
                                                <div key={index} className="flex flex-col border p-1 rounded-md max-w-[100px] items-center">
                                                    <img src={item.url} alt={`image-${index}`} className="max-w-[96px] max-h-[96px] object-cover rounded-md" />
                                                    {item.description && (
                                                        <p className="text-[10px] text-center mt-1">{item.description}</p>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <p>No images found.</p>
                                        )}
                                    </div>
                                </div>
                            );
                        }

                        // 3) Default case: Render JSON objects with optimized syntax highlighting
                        if (typeof value === "object" && value !== null && jsonString) {
                            return (
                                <div
                                    key={key}
                                    className="border border-zinc-200 p-2 rounded-md max-w-xl bg-gradient-to-br from-zinc-50 via-zinc-400/10 to-white"
                                >
                                    <span className="pb-1 font-semibold text-xs text-zinc-900">{key}:</span>
                                    <button
                                        onClick={() => setShowFullJson((prev) => !prev)}
                                        className="text-xs font-medium text-sky-600 font-mono my-1 ml-1"
                                    >
                                        {showFullJson ? "Hide" : "JSON"}
                                    </button>

                                    {showFullJson && (
                                        <SyntaxHighlighter language="json" style={vscDarkPlus} wrapLongLines>
                                            {jsonString}
                                        </SyntaxHighlighter>
                                    )}
                                </div>
                            );
                        }

                        // 4) Default rendering for everything else
                        return (
                            <div
                                key={key}
                                className="flex items-start gap-x-1.5 border border-zinc-200 pr-0 pl-2 rounded-md w-fit max-w-xl from-zinc-50 bg-gradient-to-br via-80% via-zinc-400/10 to-white overflow-hidden font-semibold text-xs tracking-tight"
                            >
                                <span className="py-1.5 min-w-[80px] font-semibold text-xs text-zinc-900">{key}</span>
                                <span className="text-xs font-mono font-normal tracking-wide text-zinc-900 bg-white/80 border-l border-zinc-200 px-2.5 py-1.5 max-h-40 overflow-hidden overflow-y-scroll">
                                    {typeof value === "string" ? value : String(value)}
                                </span>
                            </div>
                        );
                    })}

                    {/* Special case: If the tool returns Markdown content */}
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
