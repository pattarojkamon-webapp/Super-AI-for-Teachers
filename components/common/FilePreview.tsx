import React, { useEffect, useState } from 'react';

interface FilePreviewProps {
    file: File;
    onRemove: () => void;
}

const FilePreview: React.FC<FilePreviewProps> = ({ file, onRemove }) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const isImage = file.type.startsWith('image/');

    useEffect(() => {
        let objectUrl: string | null = null;
        if (isImage) {
            objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
        }

        // Cleanup the object URL on component unmount
        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [file, isImage]);

    return (
        <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 shadow-sm animate-fade-in group hover:border-primary-300 transition-colors">
            {isImage && previewUrl ? (
                <img src={previewUrl} alt={file.name} className="w-14 h-14 rounded-lg object-cover border border-gray-100" />
            ) : (
                <div className="w-14 h-14 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0 border border-primary-100 text-primary-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
            )}
            <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 font-semibold truncate">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
            </div>
            <button onClick={onRemove} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
};

export default FilePreview;