// @/components/memoized-markdown.tsx
import { marked } from 'marked';
import { memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';

const MemoizedMarkdownBlock = memo(
    ({ content }: { content: string }) => {
        return (
            <ReactMarkdown
                components={{
                    h1: ({ children }) => <h1 className="text-3xl font-bold mt-6 mb-4">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-lg font-semibold mb-3 mt-3.5">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-xl tracking-tight font-bold mb-1.5 mt-3.5">{children}</h3>,
                    h4: ({ children }) => <h4 className="text-md font-bold mb-1 mt-3.5">{children}</h4>,
                    ol: ({ children }) => <ol className="flex flex-col max-h-fit text-md w-full">{children}</ol>,
                    ul: ({ children }) => <ul className="flex flex-col gap-y-1.5 max-h-fit text-md w-full">{children}</ul>,
                    li: ({ children }) => <li className="inline-table max-h-fit py-1">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold ">{children}</strong>,
                    a: ({ children, href }) => <a href={href} className="text-sky-500 font-medium max-w-fit">{children}</a>,
                    img: ({ src, alt }) => {
                        if (!src) return null;

                        // Detect Giphy URLs
                        const isGiphy = src.includes("giphy.com/media/");

                        // If it's a Giphy image, extract the ID for embedding
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

                        // Otherwise, return a normal image
                        return <img src={src} alt={alt} className="flex max-w-fit h-auto" />;
                    },


                }}
            >
                {content}
            </ReactMarkdown>
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
