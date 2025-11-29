import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
    content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
    return (
        <div className="markdown-content">
            <ReactMarkdown
                children={content}
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-gray-900 mt-6 mb-4 pb-2 border-b border-gray-200" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-xl font-bold text-gray-800 mt-5 mb-3" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2" {...props} />,
                    p: ({node, ...props}) => <p className="mb-4 text-gray-700 leading-7" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 text-gray-700 pl-2" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4 text-gray-700 pl-2" {...props} />,
                    li: ({node, ...props}) => <li className="mb-2 pl-1 marker:text-primary-500" {...props} />,
                    a: ({node, ...props}) => <a className="text-primary-600 font-medium hover:underline decoration-primary-300 underline-offset-2" {...props} />,
                    code: ({node, inline, ...props}) => {
                        return inline ? (
                            <code className="bg-gray-100 text-primary-700 border border-gray-200 rounded-md px-1.5 py-0.5 text-sm font-mono" {...props} />
                        ) : (
                            <div className="relative group">
                                <pre className="bg-gray-800 text-gray-100 rounded-xl p-4 my-4 overflow-x-auto shadow-md">
                                    <code {...props} />
                                </pre>
                            </div>
                        );
                    },
                    blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-primary-300 bg-primary-50/50 pl-4 py-2 my-4 italic text-gray-600 rounded-r-lg" {...props} />,
                    table: ({node, ...props}) => <div className="overflow-x-auto my-4 rounded-lg border border-gray-200"><table className="min-w-full divide-y divide-gray-200" {...props} /></div>,
                    th: ({node, ...props}) => <th className="bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" {...props} />,
                    td: ({node, ...props}) => <td className="bg-white px-4 py-3 text-sm text-gray-700 border-t border-gray-100" {...props} />,
                }}
            />
        </div>
    );
};

export default MarkdownRenderer;