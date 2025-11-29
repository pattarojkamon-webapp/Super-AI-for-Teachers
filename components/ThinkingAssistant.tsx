import React, { useState, useRef } from 'react';
import { generateTextWithThinking } from '../services/geminiService';
import Loader from './common/Loader';
import ResultCard from './common/ResultCard';
import MarkdownRenderer from './common/MarkdownRenderer';
import PromptSuggestions from './common/PromptSuggestions';
import FilePreview from './common/FilePreview';
import ErrorDisplay from './common/ErrorDisplay';

const ThinkingAssistant: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const resultRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const suggestions = [
        "วิเคราะห์ผลกระทบของการเปลี่ยนแปลงสภาพภูมิอากาศต่อเศรษฐกิจโลกในอีก 20 ปีข้างหน้า",
        "เปรียบเทียบข้อดีข้อเสียของรูปแบบการเรียนการสอนแบบ Active Learning และ Passive Learning",
        "สร้างแผนการสอนเรื่อง 'วัฏจักรของน้ำ' สำหรับนักเรียนชั้นประถมศึกษาปีที่ 4",
        "อธิบายทฤษฎีสัมพัทธภาพของไอน์สไตน์ให้เข้าใจง่ายที่สุด"
    ];
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
        e.target.value = '';
    };

    const handleSubmit = async () => {
        if (!prompt.trim() && !file) return;
        setIsLoading(true);
        setError('');
        setResult('');
        try {
            const response = await generateTextWithThinking(prompt, file);
            setResult(response);
        } catch (err: any) {
            console.error("Thinking Error:", err);
            
            // Robust error message extraction
            let errorMessage = 'เกิดข้อผิดพลาดในการสร้างคำตอบ';
            if (err instanceof Error) {
                errorMessage = err.message;
            } else if (typeof err === 'string') {
                errorMessage = err;
            } else if (err && typeof err === 'object') {
                errorMessage = err.message || err.statusText || JSON.stringify(err);
                if (errorMessage === '{}') errorMessage = "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
            }
            
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClear = () => {
        setResult('');
        setError('');
    };

    return (
        <div className="max-w-4xl mx-auto pb-10">
             <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-8">
                <PromptSuggestions suggestions={suggestions} onSelect={setPrompt} />
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="ป้อนคำถามหรือหัวข้อที่ซับซ้อนที่นี่..."
                    className="w-full h-48 bg-gray-50 border border-gray-300 rounded-xl p-4 focus:ring-2 focus:ring-primary-200 focus:border-primary-500 focus:outline-none transition-all duration-200 text-gray-800 placeholder-gray-400 resize-y"
                    disabled={isLoading}
                />
                 <div className="mt-4 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
                    <div className="flex-1">
                        {file ? (
                            <FilePreview file={file} onRemove={() => setFile(null)} />
                        ) : (
                            <>
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full sm:w-auto flex items-center justify-center gap-2 py-2.5 px-4 border border-dashed border-gray-300 rounded-xl text-gray-500 hover:bg-gray-50 hover:border-primary-400 hover:text-primary-600 transition-all duration-200 text-sm font-medium"
                                    disabled={isLoading}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                    แนบไฟล์ (รูปภาพ, PDF)
                                </button>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleFileChange} 
                                    className="hidden" 
                                    accept="image/*,application/pdf" 
                                />
                            </>
                        )}
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || (!prompt.trim() && !file)}
                        className="bg-primary-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-primary-700 disabled:bg-gray-300 disabled:text-gray-500 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <span className="animate-pulse">กำลังคิด...</span>
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                                วิเคราะห์เชิงลึก
                            </>
                        )}
                    </button>
                </div>
            </div>

            {isLoading && <div className="mt-8"><Loader text="ระบบกำลังประมวลผลความคิด (Thinking Process)... อาจใช้เวลาสักครู่" /></div>}
            
            {error && <ErrorDisplay error={error} onRetry={handleSubmit} />}
            
            {result && (
                <ResultCard title="ผลการวิเคราะห์" textResult={result} contentRef={resultRef} onClose={handleClear}>
                    <MarkdownRenderer content={result} />
                </ResultCard>
            )}
        </div>
    );
};

export default ThinkingAssistant;