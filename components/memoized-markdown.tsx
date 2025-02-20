// @/components/memoized-markdown.tsx
import { marked } from 'marked';
import { memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';

function parseMarkdownIntoBlocks(markdown: string): string[] {
    return marked
        .lexer(markdown)
        .map(token => {
            if (token.type === 'list') {
                return token.raw.trim(); // Preserve raw list structure
            }
            return token.raw.trim().replace(/\n{2,}/g, '\n\n'); // Keep double line breaks but remove extra spacing
        })
        .filter(token => token.length > 0);
}

const MemoizedMarkdownBlock = memo(
    ({ content }: { content: string }) => {
        return (
            <ReactMarkdown
                components={{
                    h1: ({ children }) => <h1 className="text-3xl font-bold mt-6 mb-4">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-lg font-semibold mb-3 mt-3.5">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-xl tracking-tight font-bold mb-1.5 mt-3.5">{children}</h3>,
                    h4: ({ children }) => <h4 className="text-md font-bold mb-1 mt-3.5">{children}</h4>,
                    ol: ({ children }) => <ol className="list-decimal list-inside ml-4 flex flex-col max-h-fit text-md pb-3">{children}</ol>,
                    ul: ({ children }) => <ul className="list-disc list-inside ml-4 flex flex-col max-h-fit text-md pb-3 mt-3">{children}</ul>,
                    li: ({ children }) => <li className="list-disc list-inside ml-0 [display:list-item]">{children}</li>,
                    p: ({ children }) => <p className="text-md">{children}</p>,
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,

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
        const blocks = useMemo(() => parseMarkdownIntoBlocks(content), [content]);

        return blocks.map((block, index) => (
            <MemoizedMarkdownBlock content={block} key={`${id}-block_${index}`} />
        ));
    },
);

MemoizedMarkdown.displayName = 'MemoizedMarkdown';
