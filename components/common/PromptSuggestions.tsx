import React from 'react';

interface PromptSuggestionsProps {
    suggestions: string[];
    onSelect: (prompt: string) => void;
}

const PromptSuggestions: React.FC<PromptSuggestionsProps> = ({ suggestions, onSelect }) => {
    return (
        <div className="mb-6">
            <p className="text-sm text-gray-500 font-medium mb-3 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                แนวทางคำสั่งแนะนำ:
            </p>
            <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                    <button
                        key={index}
                        onClick={() => onSelect(suggestion)}
                        className="text-sm bg-white border border-gray-200 hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700 text-gray-600 px-4 py-2 rounded-full transition-all duration-200 shadow-sm"
                    >
                        {suggestion}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default PromptSuggestions;