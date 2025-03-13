import { marked } from 'marked';
import { memo, useMemo, Fragment, useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

const MemoizedMarkdownBlock = memo(
    ({ content }: { content: string }) => {
        // Add state to track which thinking sections are expanded
        const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
        // Track which sections were streaming in the previous render
        const previousStreamingSections = useRef<Record<string, boolean>>({});
        // Add state to track sections that are currently transitioning (auto-collapsing)
        const [transitioningSections, setTransitioningSections] = useState<Record<string, boolean>>({});
        
        // Parse content and extract thinking sections - handle streaming
        const processedContent = useMemo(() => {
            const result = [];
            let currentIndex = 0;
            let lastProcessedIndex = 0;
            
            // Function to handle normal text before thinking sections
            const addTextBeforeThinking = (endIndex: number) => {
                if (endIndex > lastProcessedIndex) {
                    const textContent = content.substring(lastProcessedIndex, endIndex);
                    if (textContent) {
                        result.push({
                            type: 'markdown',
                            content: textContent,
                            key: `md-${lastProcessedIndex}`
                        });
                    }
                }
            };
            
            // Look for opening thinking tags
            while ((currentIndex = content.indexOf('<think>', currentIndex)) !== -1) {
                // Add any text before the thinking tag
                addTextBeforeThinking(currentIndex);
                
                // Find the closing tag - if it exists
                const closeTagIndex = content.indexOf('</think>', currentIndex + 7);
                
                if (closeTagIndex !== -1) {
                    // Complete thinking section
                    const thinkContent = content.substring(currentIndex + 7, closeTagIndex);
                    result.push({
                        type: 'thinking',
                        content: thinkContent,
                        key: `thinking-${currentIndex}`
                    });
                    
                    // Move past the closing tag
                    lastProcessedIndex = closeTagIndex + 8;
                    currentIndex = lastProcessedIndex;
                } else {
                    // Incomplete thinking section - still streaming
                    const thinkContent = content.substring(currentIndex + 7);
                    result.push({
                        type: 'thinking',
                        content: thinkContent,
                        isStreaming: true,
                        key: `thinking-streaming-${currentIndex}`
                    });
                    
                    // We've processed everything available so far
                    lastProcessedIndex = content.length;
                    break;
                }
            }
            
            // Add any remaining content after the last thinking section
            if (lastProcessedIndex < content.length) {
                result.push({
                    type: 'markdown',
                    content: content.substring(lastProcessedIndex),
                    key: `md-${lastProcessedIndex}`
                });
            }
            
            return result;
        }, [content]);
        
        // Toggle expansion of a thinking section
        const toggleThinkingSection = (key: string) => {
            // Clear any transitioning state when user manually toggles
            if (transitioningSections[key]) {
                setTransitioningSections(prev => ({
                    ...prev,
                    [key]: false
                }));
            }
            
            setExpandedSections(prev => ({
                ...prev,
                [key]: !prev[key]
            }));
        };
        
        // Effect to detect when a section stops streaming and set a delay to collapse it
        useEffect(() => {
            const currentStreamingSections: Record<string, boolean> = {};
            const timers: NodeJS.Timeout[] = [];
            
            processedContent.forEach(part => {
                if (part.type === 'thinking') {
                    // Mark sections that are currently streaming
                    if (part.isStreaming) {
                        currentStreamingSections[part.key] = true;
                        // Auto-expand streaming sections if they're not already expanded
                        if (!expandedSections[part.key]) {
                            setExpandedSections(prev => ({
                                ...prev,
                                [part.key]: true
                            }));
                        }
                    } 
                    // Check if this section just finished streaming (was streaming before, now complete)
                    else if (previousStreamingSections.current[part.key] && !part.isStreaming) {
                        // First mark the section as transitioning
                        setTransitioningSections(prev => ({
                            ...prev,
                            [part.key]: true
                        }));
                        
                        // Set a timer to start the collapse animation after a delay
                        const timer = setTimeout(() => {
                            setExpandedSections(prev => ({
                                ...prev,
                                [part.key]: false
                            }));
                            
                            // Set another timer to clear the transitioning state after animation completes
                            setTimeout(() => {
                                setTransitioningSections(prev => ({
                                    ...prev,
                                    [part.key]: false
                                }));
                            }, 1000); // Slightly longer than animation duration
                        }, 2000);
                        
                        timers.push(timer);
                    }
                }
            });
            
            // Update the ref with current streaming sections for next comparison
            previousStreamingSections.current = currentStreamingSections;
            
            // Clean up any pending timers when component unmounts or content changes
            return () => {
                timers.forEach(timer => clearTimeout(timer));
            };
        }, [processedContent, expandedSections]);
        
        return (
            <>
                {processedContent.map((part) => {
                    if (part.type === 'thinking') {
                        // For streaming sections, default to expanded. For completed sections, default to collapsed
                        const isExpanded = part.isStreaming || expandedSections[part.key] === true;
                        const isTransitioning = transitioningSections[part.key] === true;
                        
                        // Render thinking section as a div
                        return (
                            <div 
                                key={part.key}
                                className="flex flex-col w-full max-h-fit border-[1.5px] border-dashed border-zinc-300 rounded-md p-4 text-zinc-700 whitespace-pre-wrap"
                            >
                                <div 
                                    onClick={() => toggleThinkingSection(part.key)}
                                    className="font-bold text-sm text-zinc-500 tracking-tight flex items-center gap-2 cursor-pointer w-full"
                                >
                                    {part.isStreaming && <LoadingSpinner className="w-4 h-4" />}
                                    {!part.isStreaming && isExpanded ? (
                                        <ChevronUpIcon className="h-3.5 w-3.5 stroke-2" />
                                    ) : !part.isStreaming && (
                                        <ChevronDownIcon className="h-3.5 w-3.5 stroke-2" />
                                    )}
                                    Thinking
                                </div>
                                
                                {/* Always render the content, but control visibility with animations */}
                                <motion.div
                                    animate={{
                                        height: isExpanded ? "auto" : "0px",
                                        opacity: isExpanded ? 1 : 0,
                                        marginTop: isExpanded ? "0.5rem" : "0px"
                                    }}
                                    initial={false}
                                    transition={{ 
                                        duration: isTransitioning ? 0.5 : 0.3, // Slightly longer duration for auto-collapse
                                        ease: "easeInOut",
                                        opacity: { duration: isTransitioning ? 0.4 : 0.2 },
                                        height: { duration: isTransitioning ? 0.5 : 0.3 }
                                    }}
                                    className="w-full overflow-hidden"
                                    style={{ 
                                        display: "block",
                                        transformOrigin: "top"
                                    }}
                                >
                                    <div className='text-zinc-600 text-sm w-full block' style={{ minHeight: "1.5rem" }}>
                                        {part.content}
                                    </div>
                                </motion.div>
                            </div>
                        );
                    } else {
                        // Render regular markdown content
                        return (
                            <ReactMarkdown
                                key={part.key}
                                components={{
                                    h1: ({ children }) => <h1 className="text-3xl font-bold mt-6 mb-4">{children}</h1>,
                                    h2: ({ children }) => <h2 className="text-lg font-semibold mb-3 mt-3.5">{children}</h2>,
                                    h3: ({ children }) => <h3 className="text-xl tracking-tight font-bold mb-1.5 mt-3.5">{children}</h3>,
                                    h4: ({ children }) => <h4 className="text-md font-bold mb-1 mt-3.5">{children}</h4>,
                                    ol: ({ children }) => <ol className="flex relative flex-col gap-y-1.5 py- list-disc list-inside ml-5">{children}</ol>,
                                    ul: ({ children }) => <ul className="flex relative flex-col gap-y-1.5 py- list-disc list-inside ml-5">{children}</ul>,
                                    li: ({ children }) => <li className="py-0 flex flex-col max-h-fit gap-y-1.5">{children}</li>,
                                    strong: ({ children }) => <strong className="font-semibold ">{children}</strong>,
                                    a: ({ children, href }) => <a href={href} className="text-sky-500 font-medium max-w-fit">{children}</a>,
                                    blockquote: ({ children }) => (
                                        <blockquote className="border-l-4 border-zinc-200 pl-4 my-4 italic text-zinc-700">
                                            {children}
                                        </blockquote>
                                    ),
                                    img: ({ src, alt }) => {
                                        if (!src) return null;

                                        const isGiphy = src.includes("giphy.com/media/");

                                        if (isGiphy) {
                                            const giphyId = src.split("/media/")[1]?.split("/")[0];

                                            return (
                                                <iframe
                                                    src={`https://giphy.com/embed/${giphyId}`}
                                                    width="100%"
                                                    height="auto"
                                                    allowFullScreen
                                                    className="flex max-w-fit h-auto bg-zinc-200 rounded-lg"
                                                />
                                            );
                                        }

                                        return <img src={src} alt={alt} className="flex w-fit max-w-full h-auto" />;
                                    }
                                }}
                            >
                                {part.content}
                            </ReactMarkdown>
                        );
                    }
                })}
            </>
        );
    },
    (prevProps, nextProps) => prevProps.content === nextProps.content,
);

MemoizedMarkdownBlock.displayName = 'MemoizedMarkdownBlock';

export const MemoizedMarkdown = memo(
    ({ content, id }: { content: string; id: string }) => {
        return (
            <MemoizedMarkdownBlock content={content} key={id} />
        );
    },
);

MemoizedMarkdown.displayName = 'MemoizedMarkdown';
