// @/app/chat/page.tsx
'use client';
import { useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { MemoizedMarkdown } from '@/components/memoized-markdown';
import ToolOutput from '@/components/ToolOutput';

export default function Chat() {
    const { messages, input, handleInputChange, handleSubmit } = useChat();
    console.log("full response:", JSON.stringify(messages, null, 2));

    // A ref pointing to the bottom "anchor" in the chat
  const bottomRef = useRef<HTMLDivElement>(null);

  // Whenever `messages` changes (token streamed or new user input), scroll to bottom
  useEffect(() => {
    // Scroll into view smoothly
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


    const lastMessage = messages[messages.length - 1];
    const isGenerating = lastMessage?.role === 'assistant' && !lastMessage?.content;

    return (
        <div className="flex flex-col w-full max-w-2xl pt-16 pb-36 mx-auto stretch gap-y-3.5">
            {messages.map((m, index) => (

                <div key={m.id} className="flex border border-transparent rounded-xl ">
                    <div className='mr-6 pt-3'>
                        {m.role === 'user' ? <div className="font-bold p-2 mb-3 mt-0.5 bg-zinc-300/80 text-white rounded-full max-w-fit max-h-fit">
                            <svg data-testid="geist-icon" height="12" strokeLinejoin="round" viewBox="0 0 16 16" width="12" className='text-white' style={{ color: 'currentColor' }}>
                            </svg>
                        </div> : (
                            <div className="font-bold p-2 mb-3 mt-0.5 bg-zinc-900 text-white rounded-full max-w-fit max-h-fit">
                                <svg data-testid="geist-icon" height="12" strokeLinejoin="round" viewBox="0 0 16 16" width="12" className='text-white' style={{ color: 'currentColor' }}>
                                    <path d="M2.5 0.5V0H3.5V0.5C3.5 1.60457 4.39543 2.5 5.5 2.5H6V3V3.5H5.5C4.39543 3.5 3.5 4.39543 3.5 5.5V6H3H2.5V5.5C2.5 4.39543 1.60457 3.5 0.5 3.5H0V3V2.5H0.5C1.60457 2.5 2.5 1.60457 2.5 0.5Z" fill="currentColor"></path>
                                    <path d="M14.5 4.5V5H13.5V4.5C13.5 3.94772 13.0523 3.5 12.5 3.5H12V3V2.5H12.5C13.0523 2.5 13.5 2.05228 13.5 1.5V1H14H14.5V1.5C14.5 2.05228 14.9477 2.5 15.5 2.5H16V3V3.5H15.5C14.9477 3.5 14.5 3.94772 14.5 4.5Z" fill="currentColor"></path>
                                    <path d="M8.40706 4.92939L8.5 4H9.5L9.59294 4.92939C9.82973 7.29734 11.7027 9.17027 14.0706 9.40706L15 9.5V10.5L14.0706 10.5929C11.7027 10.8297 9.82973 12.7027 9.59294 15.0706L9.5 16H8.5L8.40706 15.0706C8.17027 12.7027 6.29734 10.8297 3.92939 10.5929L3 10.5V9.5L3.92939 9.40706C6.29734 9.17027 8.17027 7.29734 8.40706 4.92939Z" fill="currentColor"></path>
                                </svg>
                            </div>
                        )}
                    </div>
                    <div className={`whitespace-pre-wrap p-4 border  rounded-xl ${m.role === 'assistant' ? 'bg-zinc-50/80  shadow-2xl shadow-zinc-300/40 border-zinc-200' : 'bg-zinc-100/0 border-zinc-200'}`}>
                        <div className="font-bold">


                            {m.role === 'assistant' && index === messages.length - 1 && isGenerating && (
                                <span className="animate-pulse text-xs font-semibold text-zinc-500 my-3 bg-white border border-zing-300 rounded-lg px-1.5 py-1 shadow-sm max-w-fit">
                                    Processing
                                </span>
                            )}
                        </div>

                        <div className="prose">
                            <MemoizedMarkdown id={m.id} content={m.content} />
                            {m.toolInvocations && (
                                <div className="flex flex-col gap-x-2 mt-6 max-h-fit border-t border-zinc-200/80">

                                    {m.toolInvocations?.map((invocation, index) => (
                                        invocation.state === 'result' && (
                                            <ToolOutput key={index} toolName={invocation.toolName} result={invocation.result} id={m.id} />
                                        )
                                    ))}</div>
                            )}
                        </div>
                    </div>
                </div>
            ))}

            {/* This div is the scroll anchor at the bottom */}
      <div ref={bottomRef} />

            <form onSubmit={handleSubmit}>
                <input className="fixed bottom-0 w-full max-w-screen-md mx-auto left-0 right-0 p-3 mb-8 placeholder-zinc-500 bg-zinc-50 border border-zinc-50 ring ring-zinc-200 outline outline-white p-4 rounded-lg shadow-2xl shadow-zinc-300"
                    value={input}
                    placeholder="Ask something"
                    onChange={handleInputChange}
                />
            </form>
        </div>
    );
}
