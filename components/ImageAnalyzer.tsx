import React, { useState, useRef, useEffect } from 'react';
import { analyzeImage, fileToBase64 } from '../services/geminiService';
import Loader from './common/Loader';
import FileUpload from './common/FileUpload';
import ResultCard from './common/ResultCard';
import MarkdownRenderer from './common/MarkdownRenderer';
import ErrorDisplay from './common/ErrorDisplay';

const ImageAnalyzer: React.FC = () => {
    const [prompt, setPrompt] = useState('อธิบายไฟล์นี้อย่างละเอียด');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    
    const resultRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Cleanup camera on unmount
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    const handleFileChange = (file: File) => {
        setImageFile(file);
        if(file.type.startsWith('image/')) {
            setImagePreview(URL.createObjectURL(file));
        } else {
            setImagePreview('is_file'); 
        }
        setResult('');
        setError('');
    };

    const startCamera = async () => {
        setIsCameraOpen(true);
        setError('');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            // Wait a bit for the video element to be rendered
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play().catch(e => console.error("Error playing video:", e));
                }
            }, 100);
        } catch (err) {
            console.error("Error accessing camera:", err);
            setError("ไม่สามารถเข้าถึงกล้องได้ โปรดตรวจสอบสิทธิ์การเข้าถึง");
            setIsCameraOpen(false);
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCameraOpen(false);
    };

    const capturePhoto = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0);
                canvas.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
                        handleFileChange(file);
                        stopCamera();
                    }
                }, 'image/jpeg', 0.9);
            }
        }
    };
    
    const handleSubmit = async () => {
        if (!imageFile || !prompt.trim()) return;
        setIsLoading(true);
        setError('');
        setResult('');
        try {
            const imageBase64 = await fileToBase64(imageFile);
            const response = await analyzeImage(prompt, imageBase64, imageFile.type);
            setResult(response);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'เกิดข้อผิดพลาดในการวิเคราะห์ไฟล์');
        } finally {
            setIsLoading(false);
        }
    };

    const renderPreview = () => {
        if (!imageFile) return null;
        if (imageFile.type.startsWith('image/')) {
            return <img src={URL.createObjectURL(imageFile)} alt="Preview" className="rounded-xl shadow-md mx-auto max-w-full h-auto max-h-96 border border-gray-200 bg-white p-2" />
        }
        return (
            <div className="rounded-xl shadow-sm mx-auto max-w-md border border-gray-200 bg-white p-8 flex flex-col items-center justify-center text-center">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="font-bold text-gray-800 text-lg">{imageFile.name}</p>
                <p className="text-sm text-gray-500 uppercase mt-1">{imageFile.type.split('/')[1] || 'Document'}</p>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto pb-10">
            {!imagePreview && !isCameraOpen && (
                <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">อัปโหลดภาพหรือเอกสารเพื่อวิเคราะห์</h3>
                    <FileUpload onFileUpload={handleFileChange} accept="image/*,application/pdf" />
                    
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">หรือ</span>
                        </div>
                    </div>

                    <button 
                        onClick={startCamera}
                        className="w-full py-3 bg-primary-50 text-primary-700 rounded-xl font-semibold border border-primary-200 hover:bg-primary-100 transition-colors flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        ถ่ายภาพ
                    </button>
                </div>
            )}

            {isCameraOpen && (
                <div className="bg-black rounded-2xl overflow-hidden shadow-lg mb-6 relative aspect-[3/4] sm:aspect-video">
                    <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-center gap-8">
                         <button 
                            onClick={stopCamera}
                            className="p-3 rounded-full bg-white/20 text-white hover:bg-white/30 transition-all backdrop-blur-sm"
                            title="ยกเลิก"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <button 
                            onClick={capturePhoto}
                            className="w-16 h-16 rounded-full bg-white border-4 border-gray-300 flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
                            title="ถ่ายภาพ"
                        >
                            <div className="w-14 h-14 rounded-full border-2 border-black/10"></div>
                        </button>
                        <div className="w-12"></div> {/* Spacer for centering */}
                    </div>
                </div>
            )}
            
            {imagePreview && !isCameraOpen && (
                 <div className="space-y-6">
                    <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                        <div className="mb-6 relative">
                             {renderPreview()}
                             <button 
                                onClick={() => {setImageFile(null); setImagePreview('')}}
                                className="absolute top-0 right-0 bg-white text-gray-500 border border-gray-200 p-2 rounded-full shadow-sm hover:bg-red-50 hover:text-red-500 transition-colors"
                                title="เปลี่ยนไฟล์"
                             >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                             </button>
                        </div>
                        <div className="flex flex-col gap-3">
                            <label className="text-sm font-medium text-gray-700">คำสั่งวิเคราะห์:</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="ป้อนคำสั่งเพื่อวิเคราะห์..."
                                    className="flex-grow bg-gray-50 border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-primary-200 focus:border-primary-500 focus:outline-none transition-all duration-200 text-gray-800"
                                    disabled={isLoading}
                                />
                                <button
                                    onClick={handleSubmit}
                                    disabled={isLoading || !prompt.trim() || !imageFile}
                                    className="bg-primary-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-primary-700 disabled:bg-gray-300 disabled:text-gray-500 transition-all duration-200 shadow-md hover:shadow-lg whitespace-nowrap"
                                >
                                    {isLoading ? 'กำลังวิเคราะห์...' : 'วิเคราะห์'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isLoading && <Loader text="กำลังอ่านและวิเคราะห์ข้อมูล..." />}
            
            {error && <ErrorDisplay error={error} onRetry={() => { setError(''); if(isCameraOpen) startCamera(); else handleSubmit(); }} />}
            
            {result && (
                <ResultCard title="ผลการวิเคราะห์" textResult={result} contentRef={resultRef}>
                    <MarkdownRenderer content={result} />
                </ResultCard>
            )}
        </div>
    );
};

export default ImageAnalyzer;