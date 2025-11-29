import React, { useState, useEffect, useRef } from 'react';
import { searchMapsWithGrounding } from '../services/geminiService';
import Loader from './common/Loader';
import ResultCard from './common/ResultCard';
import { GroundingChunk } from '@google/genai';
import MarkdownRenderer from './common/MarkdownRenderer';
import PromptSuggestions from './common/PromptSuggestions';
import ErrorDisplay from './common/ErrorDisplay';

const MapSearch: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [result, setResult] = useState<{ text: string; sources: GroundingChunk[] | undefined } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [location, setLocation] = useState<{ latitude: number, longitude: number } | null>(null);
    const [locationState, setLocationState] = useState<'loading' | 'success' | 'error'>('loading');
    const resultRef = useRef<HTMLDivElement>(null);

    const suggestions = [
        "ร้านอาหารอิตาเลียนดีๆ ใกล้ฉัน",
        "พิพิธภัณฑ์วิทยาศาสตร์ที่น่าสนใจ",
        "สวนสาธารณะสำหรับวิ่งออกกำลังกาย",
        "ร้านกาแฟบรรยากาศดีๆ"
    ];

    const requestLocation = () => {
        setLocationState('loading');
        setError('');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
                setLocationState('success');
            },
            (err) => {
                let errorMessage = 'เกิดข้อผิดพลาดในการเข้าถึงตำแหน่ง';
                 switch(err.code) {
                    case err.PERMISSION_DENIED:
                        errorMessage = 'คุณปฏิเสธการเข้าถึงตำแหน่ง โปรดเปิดใช้งานในตั้งค่าเบราว์เซอร์แล้วลองอีกครั้ง';
                        break;
                    case err.POSITION_UNAVAILABLE:
                        errorMessage = 'ไม่สามารถระบุตำแหน่งปัจจุบันได้ โปรดตรวจสอบการเชื่อมต่อของคุณ';
                        break;
                    case err.TIMEOUT:
                        errorMessage = 'หมดเวลาในการร้องขอตำแหน่ง โปรดลองอีกครั้ง';
                        break;
                 }
                setError(errorMessage);
                setLocationState('error');
                console.error(err);
            }
        );
    };

    useEffect(() => {
        requestLocation();
    }, []);

    const handleSubmit = async () => {
        if (!prompt.trim() || !location) return;
        setIsLoading(true);
        setResult(null);
        try {
            const response = await searchMapsWithGrounding(prompt, location.latitude, location.longitude);
            setResult(response);
            setError(''); // Clear previous search errors
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'เกิดข้อผิดพลาดในการค้นหาแผนที่');
        } finally {
            setIsLoading(false);
        }
    };
    
    const renderLocationStatus = () => {
        if (locationState === 'loading') {
            return (
                 <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <Loader text="กำลังขออนุญาตเข้าถึงตำแหน่ง..." />
                    <p className="text-gray-500 mt-4">ระบบจำเป็นต้องใช้ตำแหน่งของคุณเพื่อค้นหาสถานที่ใกล้เคียง</p>
                </div>
            )
        }
        if (locationState === 'error') {
             return <ErrorDisplay error={error} onRetry={requestLocation} />;
        }
        return null;
    }

    return (
        <div className="max-w-4xl mx-auto pb-10">
             {locationState !== 'success' ? renderLocationStatus() : (
                <>
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-8">
                        <div className="flex items-center justify-between mb-4">
                             <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                </svg>
                                ระบุตำแหน่งแล้ว
                             </div>
                        </div>
                        
                        <PromptSuggestions suggestions={suggestions} onSelect={setPrompt} />
                        
                        <div className="flex flex-col sm:flex-row gap-3 mt-2">
                            <input
                                type="text"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="ค้นหาสถานที่ด้วย Google Maps..."
                                className="flex-grow bg-gray-50 border border-gray-300 rounded-xl p-4 focus:ring-2 focus:ring-primary-200 focus:border-primary-500 focus:outline-none transition-all duration-200 text-gray-800"
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleSubmit}
                                disabled={isLoading || !prompt.trim()}
                                className="bg-primary-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-primary-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg whitespace-nowrap"
                            >
                                {isLoading ? 'กำลังค้นหา...' : 'ค้นหา'}
                            </button>
                        </div>
                    </div>

                    {isLoading && <Loader text="กำลังค้นหาพิกัดและข้อมูล..." />}
                    
                    {error && locationState === 'success' && <ErrorDisplay error={error} onRetry={handleSubmit} />}
                    
                    {result && (
                        <ResultCard title="ผลการค้นหาแผนที่" textResult={result.text} contentRef={resultRef}>
                            <MarkdownRenderer content={result.text} />
                            {result.sources && result.sources.length > 0 && (
                                <div className="mt-6 pt-4 border-t border-gray-200 bg-gray-50/50 -mx-6 px-6 pb-2">
                                    <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        สถานที่ที่พบ:
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {result.sources.map((source, index) => (
                                            source.maps && (
                                                <a 
                                                    key={index} 
                                                    href={source.maps.uri} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl hover:border-primary-400 hover:shadow-md transition-all group"
                                                >
                                                    <div className="p-2 bg-red-50 text-red-500 rounded-full group-hover:bg-red-100">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-semibold text-gray-800 truncate group-hover:text-primary-700">{source.maps.title || 'สถานที่'}</div>
                                                        <div className="text-xs text-gray-500">คลิกเพื่อเปิด Google Maps</div>
                                                    </div>
                                                </a>
                                            )
                                        ))}
                                    </div>
                                </div>
                            )}
                        </ResultCard>
                    )}
                </>
            )}
        </div>
    );
};

export default MapSearch;