import React, { useState, useRef } from 'react';
import { searchWithGrounding } from '../services/geminiService';
import Loader from './common/Loader';
import ResultCard from './common/ResultCard';
import { GroundingChunk } from '@google/genai';
import MarkdownRenderer from './common/MarkdownRenderer';
import PromptSuggestions from './common/PromptSuggestions';
import FilePreview from './common/FilePreview';
import ErrorDisplay from './common/ErrorDisplay';

const InfoSearch: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [result, setResult] = useState<{ text: string; sources: GroundingChunk[] | undefined } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const resultRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const suggestions = [
        "ใครคือผู้ชนะรางวัลโนเบลสาขาสันติภาพล่าสุด?",
        "สรุปข่าวเทคโนโลยีที่สำคัญในสัปดาห์นี้",
        "ผลการแข่งขันฟุตบอลพรีเมียร์ลีกล่าสุดเป็นอย่างไร",
        "สภาพอากาศในกรุงเทพมหานครวันพรุ่งนี้"
    ];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
        e.target.value = '';
    };

    const handleSubmit = async () => {
        if (!prompt.trim()) return;
        setIsLoading(true);
        setError('');
        setResult(null);
        try {
            const response = await searchWithGrounding(prompt, file);
            setResult(response);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'เกิดข้อผิดพลาดในการค้นหา');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-10">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-8">
                <PromptSuggestions suggestions={suggestions} onSelect={setPrompt} />
                <div className="flex flex-col sm:flex-row gap-3 mt-2">
                    <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="ค้นหาข้อมูลล่าสุดด้วย Google Search..."
                        className="flex-grow bg-gray-50 border border-gray-300 rounded-xl p-4 focus:ring-2 focus:ring-primary-200 focus:border-primary-500 focus:outline-none transition-all duration-200 text-gray-800"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || !prompt.trim()}
                        className="bg-primary-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-primary-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg flex-shrink-0"
                    >
                        {isLoading ? 'กำลังค้นหา...' : 'ค้นหา'}
                    </button>
                </div>
                 <div className="mt-4">
                    {file ? (
                        <FilePreview file={file} onRemove={() => setFile(null)} />
                    ) : (
                         <div className="flex justify-start">
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                                disabled={isLoading}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                แนบไฟล์ประกอบการค้นหา
                            </button>
                             <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleFileChange} 
                                className="hidden" 
                                accept="image/*,application/pdf" 
                            />
                        </div>
                    )}
                </div>
            </div>

            {isLoading && <Loader text="กำลังค้นหาข้อมูลจาก Google..." />}
            
            {error && <ErrorDisplay error={error} onRetry={handleSubmit} />}
            
            {result && (
                <ResultCard title="ผลการค้นหา" textResult={result.text} contentRef={resultRef}>
                    <MarkdownRenderer content={result.text} />
                    {result.sources && result.sources.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-gray-200 bg-gray-50/50 -mx-6 px-6 pb-2">
                            <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                แหล่งข้อมูลอ้างอิง:
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {result.sources.map((source, index) => (
                                    <a 
                                        key={index} 
                                        href={source.web?.uri} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="block p-3 bg-white border border-gray-200 rounded-lg hover:border-primary-400 hover:shadow-sm transition-all text-sm group"
                                    >
                                        <div className="font-medium text-primary-700 group-hover:underline truncate">{source.web?.title || 'ไม่ระบุชื่อเว็บไซต์'}</div>
                                        <div className="text-gray-400 text-xs truncate mt-1">{source.web?.uri}</div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </ResultCard>
            )}
        </div>
    );
};

export default InfoSearch;