import React, { useState, useRef, useEffect } from 'react';
import { generateVideo, fileToBase64 } from '../services/geminiService';
import Loader from './common/Loader';
import FileUpload from './common/FileUpload';
import ResultCard from './common/ResultCard';
import PromptSuggestions from './common/PromptSuggestions';
import ErrorDisplay from './common/ErrorDisplay';

const VideoGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const [videoUrl, setVideoUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("กำลังประมวลผล...");
    const [error, setError] = useState('');
    const resultRef = useRef<HTMLDivElement>(null);
    const [hasApiKey, setHasApiKey] = useState(false);
    const [isCheckingApiKey, setIsCheckingApiKey] = useState(true);

    useEffect(() => {
        const checkApiKey = async () => {
            try {
                const keySelected = await (window as any).aistudio.hasSelectedApiKey();
                setHasApiKey(keySelected);
            } catch (e) {
                console.error("Error checking for API key:", e);
                setHasApiKey(false);
            } finally {
                setIsCheckingApiKey(false);
            }
        };
        checkApiKey();
    }, []);

    const handleSelectKey = async () => {
        try {
            await (window as any).aistudio.openSelectKey();
            // Optimistically assume key selection was successful
            setHasApiKey(true);
            setError(''); // Clear previous errors
        } catch (e) {
            console.error("Error opening API key selection:", e);
        }
    };

    const suggestions = [
        "ทำให้ภาพนี้เคลื่อนไหวเป็นภาพพระอาทิตย์ตกดิน",
        "ซูมเข้าไปที่วัตถุหลักช้าๆ",
        "เพิ่มเอฟเฟกต์หิมะตก",
        "ทำให้ดูเหมือนภาพวาดที่กำลังมีชีวิต"
    ];

    const handleFileChange = (file: File) => {
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        setVideoUrl('');
        setError('');
    };
    
    const handleSubmit = async () => {
        if (!imageFile) return;
        setIsLoading(true);
        setError('');
        setVideoUrl('');
        setLoadingMessage("กำลังเริ่มสร้างวิดีโอ...");
        try {
            const imageBase64 = await fileToBase64(imageFile);
            
            const timeout = setTimeout(() => {
                setLoadingMessage("การสร้างวิดีโออาจใช้เวลาสักครู่... (ประมาณ 1-2 นาที)");
            }, 10000);
            
            const url = await generateVideo(prompt, imageBase64, imageFile.type, aspectRatio);
            clearTimeout(timeout);
            setVideoUrl(url);
            setLoadingMessage("สร้างวิดีโอสำเร็จ!");
        } catch (err: any) {
             if (err.message && err.message.includes("Requested entity was not found.")) {
                setError('API Key ไม่ถูกต้องหรือไม่มีอยู่ โปรดเลือก API Key อีกครั้ง');
                setHasApiKey(false); // Reset key state to re-trigger selection UI
            } else {
                setError(err.message || 'เกิดข้อผิดพลาดในการสร้างวิดีโอ');
            }
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    if (isCheckingApiKey) {
        return <div className="mt-10"><Loader text="กำลังตรวจสอบ API Key..." /></div>;
    }

    if (!hasApiKey) {
        return (
            <div className="max-w-2xl mx-auto text-center p-10 bg-white rounded-2xl border border-gray-200 shadow-lg mt-10">
                <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">🔑</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">ต้องการ API Key สำหรับสร้างวิดีโอ</h2>
                <p className="text-gray-600 mb-8 leading-relaxed">
                    ฟีเจอร์นี้ใช้โมเดล <strong>Veo</strong> ซึ่งมีประสิทธิภาพสูง จำเป็นต้องใช้ API Key จากบัญชีที่มีการตั้งค่า Billing (Paid Tier) 
                    <br/>
                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-primary-600 font-semibold hover:underline inline-flex items-center gap-1 mt-2">
                        ดูข้อมูลเพิ่มเติมเกี่ยวกับการชำระเงิน <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </a>
                </p>
                <button
                    onClick={handleSelectKey}
                    className="bg-primary-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-primary-700 transition-all duration-200 shadow-md hover:shadow-primary-200"
                >
                    เลือก API Key
                </button>
                 {error && <ErrorDisplay error={error} />}
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto pb-10">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-8">
                {!imagePreview && <FileUpload onFileUpload={handleFileChange} />}
                
                {imagePreview && (
                     <div className="space-y-6 animate-fade-in">
                        <div className="relative group">
                             <img src={imagePreview} alt="Preview" className="rounded-xl shadow-md mx-auto max-w-full h-auto max-h-80 border border-gray-100" />
                             <button 
                                onClick={() => {setImageFile(null); setImagePreview('')}}
                                className="absolute top-2 right-2 bg-white/90 text-red-500 p-2 rounded-full shadow-sm hover:bg-red-50 transition-colors"
                                title="ลบภาพ"
                             >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                             </button>
                        </div>

                        <PromptSuggestions suggestions={suggestions} onSelect={setPrompt} />
                        
                        <div className="space-y-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">คำสั่งเพิ่มเติม (Optional):</label>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="เช่น: ทำให้ฝนตก, แพนกล้องไปทางซ้าย..."
                                    className="w-full bg-gray-50 border border-gray-300 rounded-xl p-4 focus:ring-2 focus:ring-primary-200 focus:border-primary-500 focus:outline-none transition-all duration-200 text-gray-800"
                                    disabled={isLoading}
                                    rows={2}
                                />
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <div className="flex items-center gap-4">
                                    <span className="text-gray-700 font-semibold flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        อัตราส่วนภาพ:
                                    </span>
                                    <div className="flex gap-2">
                                       <button onClick={() => setAspectRatio('16:9')} className={`px-4 py-2 text-sm rounded-lg transition-all ${aspectRatio === '16:9' ? 'bg-white text-primary-700 shadow-sm border border-primary-200 font-medium' : 'text-gray-500 hover:bg-gray-200'}`}>16:9 (แนวนอน)</button>
                                       <button onClick={() => setAspectRatio('9:16')} className={`px-4 py-2 text-sm rounded-lg transition-all ${aspectRatio === '9:16' ? 'bg-white text-primary-700 shadow-sm border border-primary-200 font-medium' : 'text-gray-500 hover:bg-gray-200'}`}>9:16 (แนวตั้ง)</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={isLoading || !imageFile}
                            className="w-full bg-primary-600 text-white font-bold py-4 px-6 rounded-xl hover:bg-primary-700 disabled:bg-gray-300 disabled:text-gray-500 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                        >
                             {isLoading ? (
                                <span>กำลังประมวลผล...</span>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                    สร้างวิดีโอ
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>

            {isLoading && <Loader text={loadingMessage} />}
            
            {error && <ErrorDisplay error={error} onRetry={handleSubmit} />}
            
            {videoUrl && (
                <ResultCard title="วิดีโอที่สร้าง" mediaUrl={videoUrl} mediaType="video" contentRef={resultRef}>
                    <video controls src={videoUrl} className="rounded-lg shadow-md mx-auto max-w-full h-auto border border-gray-100" />
                </ResultCard>
            )}
        </div>
    );
};

export default VideoGenerator;