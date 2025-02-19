'use client';

import { useChat } from '@ai-sdk/react';

export default function Chat() {
    const { messages, input, handleInputChange, handleSubmit } = useChat();
    console.log("full response:", JSON.stringify(messages, null, 2));
    return (
        <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
            {messages.map(m => (
                <div key={m.id} className="whitespace-pre-wrap">
                    {m.role === 'user' ? 'User: ' : 'AI: '}
                    {m.toolInvocations ? (
                        <>
                            <p>{m.content}</p>
                            {m.toolInvocations.map((invocation, index) => (
                                invocation.state === 'result' && (
                                    <div key={index}>
                                        {(() => {
                                            switch (invocation.toolName) {
                                                case 'weather':
                                                    return (
                                                        <div className='bg-blue-100 rounded-xl p-6'>
                                                            <p>Location: {invocation.result.location}</p>
                                                            <p>Temperature: {invocation.result.temperature}°F</p>
                                                        </div>
                                                    );
                                                    case 'date':
                                                        return (
                                                            <div className='bg-red-100 rounded-xl p-6'>
                                                                <p>Date: {invocation.result.date}</p>
                                                            </div>
                                                        );
                                                        case 'generateRecipe':
                                                            return (
                                                                <div className='bg-red-100 rounded-xl p-6'>
                                                                    <p>Recipe: {invocation.result.recipe}</p>
                                                                
                                                                    <p>Ingredients:</p>
                                                                    <ul>
                                                                        {Array.isArray(invocation.result.ingredients) ? (
                                                                            invocation.result.ingredients.map((ingredient: any, index: any) => (
                                                                                <li key={index}>{ingredient}</li>
                                                                            ))
                                                                        ) : (
                                                                            <li>{invocation.result.ingredients}</li>
                                                                        )}
                                                                    </ul>
                                                                    <p>Response: {JSON.stringify(invocation.result.response)}</p>
                                                                </div>
                                                            );
                                                default:
                                                    return <p className='text-blue-500'>{invocation.result}</p>;
                                            }
                                        })()}
                                    </div>
                                )
                            ))}
                        </>
                    ) : (
                        <p>{m.content}</p>
                    )}
                </div>
            ))}

            <form onSubmit={handleSubmit}>
                <input
                    className="fixed dark:bg-zinc-900 bottom-0 w-full max-w-md p-2 mb-8 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl"
                    value={input}
                    placeholder="Say something..."
                    onChange={handleInputChange}
                />
            </form>
        </div>
    );
}   