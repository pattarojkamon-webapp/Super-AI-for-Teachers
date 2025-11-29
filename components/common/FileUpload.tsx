import React, { useState, useCallback, useEffect } from 'react';

interface FileUploadProps {
    onFileUpload: (file: File) => void;
    accept?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, accept = "image/*" }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        if (isSuccess) {
            const timer = setTimeout(() => setIsSuccess(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [isSuccess]);

    const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setIsSuccess(true);
            onFileUpload(e.dataTransfer.files[0]);
            e.dataTransfer.clearData();
        }
    }, [onFileUpload]);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setIsSuccess(true);
            onFileUpload(e.target.files[0]);
        }
    }, [onFileUpload]);

    return (
        <div 
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 cursor-pointer group 
                ${isSuccess 
                    ? 'border-green-500 bg-green-50 scale-[1.02]' 
                    : isDragging 
                        ? 'border-primary-500 bg-primary-50 scale-[1.02]' 
                        : 'border-gray-300 bg-white hover:border-primary-400 hover:bg-gray-50 hover:shadow-sm'
                }`}
        >
            <input 
                type="file" 
                onChange={handleFileChange}
                accept={accept}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                aria-label="File upload"
            />
            <div className="flex flex-col items-center text-gray-500 group-hover:text-gray-700">
                <div className={`p-4 rounded-full mb-3 transition-colors duration-300 ${
                    isSuccess 
                        ? 'bg-green-100' 
                        : isDragging 
                            ? 'bg-white' 
                            : 'bg-gray-100 group-hover:bg-white'
                }`}>
                    {isSuccess ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${isDragging ? 'text-primary-600' : 'text-gray-400 group-hover:text-primary-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                    )}
                </div>
                <p className={`font-semibold text-lg ${isSuccess ? 'text-green-700' : ''}`}>
                    {isSuccess ? 'อัปโหลดสำเร็จ!' : 'ลากและวางไฟล์ที่นี่'}
                </p>
                {!isSuccess && <p className="text-sm text-gray-400 mt-1">หรือ <span className="text-primary-600 font-medium underline underline-offset-2">คลิกเพื่อเลือกไฟล์</span></p>}
            </div>
        </div>
    );
};

export default FileUpload;