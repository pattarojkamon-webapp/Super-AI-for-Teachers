import React, { useState, useCallback } from 'react';
import { generateSpeech } from '../services/geminiService';
import Loader from './common/Loader';
import PromptSuggestions from './common/PromptSuggestions';
import ErrorDisplay from './common/ErrorDisplay';

// Audio decoding utilities
function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}


const TextToSpeech: React.FC = () => {
    const [text, setText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioData, setAudioData] = useState<string | null>(null);

    const suggestions = [
        "สวัสดีนักเรียนทุกคน วันนี้เราจะมาเรียนเรื่องความสำคัญของป่าไม้กันนะคะ",
        "ยินดีต้อนรับเข้าสู่กิจกรรมวันวิทยาศาสตร์ประจำปี",
        "อย่าลืมทำการบ้านที่ครูให้ไป และส่งในคาบเรียนถัดไป",
    ];
    
    const playAudio = useCallback(async (base64Audio: string) => {
        try {
            const audioContext = new (window.AudioContext)({ sampleRate: 24000 });
            const decodedBytes = decode(base64Audio);
            const audioBuffer = await decodeAudioData(decodedBytes, audioContext, 24000, 1);

            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            
            source.onended = () => setIsPlaying(false);
            
            source.start();
            setIsPlaying(true);
        } catch (e) {
            console.error("Error playing audio: ", e);
            setError("ไม่สามารถเล่นเสียงได้");
            setIsPlaying(false);
        }
    }, []);

    const handleSubmit = async () => {
        if (!text.trim()) return;
        setIsLoading(true);
        setError('');
        setAudioData(null);
        try {
            const base64Audio = await generateSpeech(text);
            setAudioData(base64Audio);
            await playAudio(base64Audio);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'เกิดข้อผิดพลาดในการสร้างเสียง');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = () => {
        if (!audioData) return;
        const byteCharacters = atob(audioData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {type: 'audio/wav'});
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `speech.wav`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="max-w-4xl mx-auto pb-10">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <PromptSuggestions suggestions={suggestions} onSelect={setText} />
                <div className="mt-4">
                     <label className="block text-sm font-medium text-gray-700 mb-2">ข้อความที่ต้องการแปลงเสียง:</label>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="ป้อนข้อความภาษาไทยหรืออังกฤษที่นี่..."
                        className="w-full h-48 bg-gray-50 border border-gray-300 rounded-xl p-4 focus:ring-2 focus:ring-primary-200 focus:border-primary-500 focus:outline-none transition-all duration-200 text-gray-800 placeholder-gray-400 resize-y"
                        disabled={isLoading || isPlaying}
                    />
                </div>
                 <div className="mt-4 flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || !text.trim() || isPlaying}
                        className="flex-grow bg-primary-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-primary-700 disabled:bg-gray-300 disabled:text-gray-500 transition-all duration-200 shadow-md hover:shadow-lg disabled:shadow-none flex items-center justify-center gap-2"
                    >
                         {isLoading ? (
                             <span>กำลังสร้างเสียง...</span>
                         ) : isPlaying ? (
                             <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                                กำลังเล่นเสียง...
                             </>
                         ) : (
                             <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                สร้างและเล่นเสียง
                             </>
                         )}
                    </button>
                    {audioData && !isLoading && !isPlaying && (
                         <button
                            onClick={handleDownload}
                            className="bg-white text-gray-700 border border-gray-300 font-bold py-3 px-6 rounded-xl hover:bg-gray-50 hover:text-primary-600 hover:border-primary-300 transition-colors shadow-sm flex items-center justify-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            ดาวน์โหลด
                        </button>
                    )}
                </div>
            </div>

            {isLoading && <div className="mt-8"><Loader text="กำลังสร้างไฟล์เสียง..." /></div>}
            
            {error && <ErrorDisplay error={error} onRetry={handleSubmit} />}
        </div>
    );
};

export default TextToSpeech;