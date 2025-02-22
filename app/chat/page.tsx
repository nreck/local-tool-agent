// @/app/chat/page.tsx
"use client"
import { useEffect, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { MemoizedMarkdown } from '@/components/memoized-markdown';
import ToolOutput from '@/components/ToolOutput';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ChevronDownIcon, ChevronUpIcon, PaperClipIcon, XMarkIcon } from '@heroicons/react/24/outline';
import StartScreen from '@/components/StartScreen';
import { motion, AnimatePresence } from 'framer-motion';

export default function Chat() {
    const { messages, input, handleInputChange, handleSubmit, append, status, stop } = useChat();
    console.log("full response:", JSON.stringify(messages, null, 2));

    const chatContainerRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const [uploadedImages, setUploadedImages] = useState<string[]>([]); // Store image URLs

    const [autoScroll, setAutoScroll] = useState(true);
    const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});
    const [isStreaming, setIsStreaming] = useState(false); // Track if AI is currently streaming
    const [showStartScreen, setShowStartScreen] = useState(true); // Track if StartScreen should be visible

    // Hide StartScreen when a message is sent
    useEffect(() => {
        if (messages.length > 0) {
            setShowStartScreen(false);
        }
    }, [messages]);

    // Function to handle predefined prompt clicks and submit immediately
    const handlePredefinedPrompt = async (prompt: string) => {
        // First set the input value
        handleInputChange({ target: { value: prompt } } as React.ChangeEvent<HTMLInputElement>);

        // Wait for the next tick to ensure the input value is set
        await new Promise(resolve => setTimeout(resolve, 0));

        // Create a proper form submit event
        const form = document.querySelector('form');
        if (form) {
            form.requestSubmit();
        }
    };

    // Handle Image Upload
    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Upload to /public/uploads
        const formData = new FormData();
        formData.append("image", file);

        try {
            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error("Image upload failed");

            const { imageUrl } = await response.json();
            setUploadedImages((prev) => [...prev, imageUrl]); // Add uploaded image to state
        } catch (error) {
            console.error("Upload error:", error);
        }
    };


    const handleSubmitWithImages = async (event?: { preventDefault?: () => void }) => {
        if (event?.preventDefault) event.preventDefault(); // Prevent default form submission

        // Convert uploaded image URLs to Markdown format
        const markdownImages = uploadedImages
            .map(url => `![Uploaded Image](${url})`)
            .join("\n\n"); // Add spacing between images

        // Construct message content with Markdown-formatted images
        const userMessage = input || "Uploaded images:";
        const finalMessage = uploadedImages.length > 0
            ? `${userMessage}\n\n${markdownImages}`
            : userMessage;

        console.log("Final message being sent:", finalMessage);

        // Append the message directly instead of using handleSubmit
        append({
            role: "user",
            content: finalMessage, // This ensures images render as Markdown
            data: {
                imageUrls: uploadedImages, // Include images as structured metadata
            },
        });

        // Clear uploaded images and reset input
        setUploadedImages([]);
        handleInputChange({ target: { value: "" } } as React.ChangeEvent<HTMLInputElement>);
    };

    // Remove Image
    const removeImage = (imageUrl: string) => {
        setUploadedImages((prev) => prev.filter((img) => img !== imageUrl));
    };

    // Detect user scrolling
    useEffect(() => {
        const handleScroll = () => {
            if (!chatContainerRef.current) return;
            const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
            setAutoScroll(scrollHeight - scrollTop - clientHeight < 50);
        };

        chatContainerRef.current?.addEventListener('scroll', handleScroll);
        return () => chatContainerRef.current?.removeEventListener('scroll', handleScroll);
    }, []);

    // Auto-scroll when a new message arrives
    useEffect(() => {
        if (autoScroll) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, autoScroll]);

    const toggleToolExpansion = (messageId: string) => {
        setExpandedTools(prev => ({
            ...prev,
            [messageId]: !prev[messageId], // Toggle expansion state
        }));
    };

    const lastAssistantMessage = messages
        .filter(msg => msg.role === 'assistant')
        .slice(-1)[0]; // Get the last assistant message

    return (
        <div
            ref={chatContainerRef}
            className="flex flex-col w-full pt-16 pb-36 mx-auto stretch overflow-y-auto h-screen no-scrollbar"
        >
            {/* Show StartScreen only if no messages exist */}
            {showStartScreen && (
                <div className="flex flex-col items-center justify-center h-full">
                    <StartScreen onPromptClick={handlePredefinedPrompt} />
                </div>
            )}
            <div className="flex flex-col gap-y-3.5 w-full max-w-2xl mx-auto">
                {messages.map((m, index) => (
                    <div key={m.id} className="flex border border-transparent rounded-xl min-w-full w-full max-w-full h-fit max-h-fit overflow-hidden">
                        <div className="pr-5 pt-3">
                            {m.role === 'user' ? (
                                <div className="font-bold p-2 mb-3 mt-0.5 bg-zinc-300/80 text-white rounded-full overflow-hiden  w-8 h-8">
                                </div>
                            ) : (
                                <div className="font-bold mb-3 mt-0.5 bg-zinc-900 text-white rounded-full max-w-fit max-h-fit overflow-hidden w-8 h-8">
                                    <img src="avatar.jpeg" className='w-full h-full' />
                                </div>
                            )}
                        </div>
                        <AnimatePresence>

                            <div className={`whitespace-pre-wrap px-4 border rounded-xl w-full max-w-full h-fit max-h-fit  ${m.role === 'assistant' ? 'bg-zinc-50/80 shadow-2xl shadow-zinc-300/40 border-zinc-200' : 'bg-zinc-100/0 border-zinc-200'}`}>

                                <div className="prose max-w-full ai-content flex flex-col h-fit max-h-fit">
                                    {m.content && (
                                        <div className={`pt-4 flex flex-col gap-y-3 ${m.role === 'assistant' ? 'pb-4' : ''} ${m.role === 'user' ? 'pb-4' : ''}`}>

                                            <MemoizedMarkdown id={m.id} content={m.content} />
                                        </div>
                                    )}

                                    {m.id === lastAssistantMessage?.id && (status === 'submitted' || status === 'streaming') && (
                                        <motion.div
                                            key="thinking"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.2, ease: "easeInOut" }}
                                            className="flex items-center gap-2 py-4"
                                        >
                                            <span className="text-md animate-pulse"><LoadingSpinner /></span>
                                            <button className="hidden" type="button" onClick={() => stop()}>
                                                Stop
                                            </button>
                                        </motion.div>
                                    )}

                                    {m.toolInvocations?.some(invocation => invocation.state === 'result') && (
                                        <div className="flex flex-col gap-x-2  max-h-fit border-t border-zinc-200/80 pb-4">
                                            <button
                                                className="expand-tools flex items-center gap-x-2.5 mt-3.5 focus:outline-none"
                                                onClick={() => toggleToolExpansion(m.id)}
                                                disabled={isStreaming} // Disable button while AI is streaming
                                            >
                                                {/* Show LoadingSpinner while AI is still streaming */}
                                                {isStreaming ? (
                                                    <LoadingSpinner className="w-4 h-4" />
                                                ) : expandedTools[m.id] ? (
                                                    <ChevronUpIcon className="h-3.5 w-3.5 stroke-2 transition-transform duration-300" />
                                                ) : (
                                                    <ChevronDownIcon className="h-3.5 w-3.5 stroke-2 transition-transform duration-300" />
                                                )}
                                                <h5 className="text-sm tracking-tight font-bold">Function calls</h5>
                                            </button>

                                            {/* Render ToolOutput only if expanded */}
                                            {expandedTools[m.id] && (
                                                <div className="transition-opacity duration-300 opacity-100 pt-1.5 flex flex-col divide-y divide-zinc-200">
                                                    {m.toolInvocations.map((invocation, index) =>
                                                        invocation.state === 'result' ? (
                                                            <ToolOutput key={index} toolName={invocation.toolName} result={invocation.result} id={m.id} />
                                                        ) : null
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </AnimatePresence>
                    </div>
                ))}
            </div>

            {/* Display Uploaded Images */}
            {uploadedImages.length > 0 && (
                <div className="flex gap-2 p-2">
                    {uploadedImages.map((imageUrl, index) => (
                        <div key={index} className="relative">
                            <img src={imageUrl} alt="Uploaded" className="h-20 w-24 object-cover rounded-md" />
                            <button
                                onClick={() => removeImage(imageUrl)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Scroll anchor at the bottom */}
            <div ref={bottomRef} />

            {/* Input + Attach Button */}
            <form onSubmit={handleSubmitWithImages} className="fixed bottom-0 w-full max-w-screen-md mx-auto left-0 right-0 p-3 mb-8 flex items-center gap-2">
                <input
                    className="flex-grow p-4 placeholder-zinc-500 bg-zinc-50 border border-zinc-50 ring ring-zinc-200 outline outline-white rounded-lg shadow-2xl shadow-zinc-300"
                    value={input}
                    placeholder="Ask something..."
                    onChange={handleInputChange}
                />

                {/* File Upload Button */}
                <label className="cursor-pointer bg-zinc-200 p-2 rounded-lg">
                    <PaperClipIcon className="h-6 w-6 text-gray-700" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
            </form>
        </div>
    );
}
