import React, { useState, useRef } from 'react';
import { generateImage, editImage, fileToBase64 } from '../services/geminiService';
import Loader from './common/Loader';
import ResultCard from './common/ResultCard';
import PromptSuggestions from './common/PromptSuggestions';
import ErrorDisplay from './common/ErrorDisplay';
import FilePreview from './common/FilePreview';

const ImageGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [selectedStyle, setSelectedStyle] = useState('None');
    const [imageUrl, setImageUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
    const resultRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const suggestions = [
        "ภาพวาดสีน้ำมันของแมวสวมหมวกนักบินอวกาศ",
        "โลโก้สำหรับชมรมวิทยาศาสตร์ของโรงเรียน",
        "ห้องเรียนในอนาคตที่เต็มไปด้วยเทคโนโลยีโฮโลแกรม",
        "ภาพวาดสไตล์การ์ตูนของเด็กๆ กำลังอ่านหนังสือใต้ต้นไม้ใหญ่"
    ];

    const aspectRatios = [
        { id: '1:1', label: '1:1 (จัตุรัส)' },
        { id: '16:9', label: '16:9 (แนวนอน)' },
        { id: '4:3', label: '4:3 (แนวนอน)' },
        { id: '3:4', label: '3:4 (แนวตั้ง)' },
        { id: '9:16', label: '9:16 (แนวตั้ง)' },
    ];

    const styles = [
        { id: 'None', label: 'ไม่ระบุ (Default)' },
        { id: 'Photorealistic', label: 'สมจริง (Photorealistic)' },
        { id: 'Cartoon', label: 'การ์ตูน (Cartoon)' },
        { id: 'Anime', label: 'อนิเมะ (Anime)' },
        { id: 'Oil Painting', label: 'สีน้ำมัน (Oil Painting)' },
        { id: 'Watercolor', label: 'สีน้ำ (Watercolor)' },
        { id: 'Pixel Art', label: 'พิกเซล (Pixel Art)' },
        { id: '3D Render', label: '3D Render' },
        { id: 'Sketch', label: 'สเก็ตช์ (Sketch)' },
        { id: 'Line Art', label: 'ลายเส้น (Line Art)' },
        { id: 'Cyberpunk', label: 'ไซเบอร์พังค์ (Cyberpunk)' },
        { id: 'Pop Art', label: 'ป๊อปอาร์ต (Pop Art)' },
        { id: 'Steampunk', label: 'สตีมพังค์ (Steampunk)' },
        { id: 'Minimalist', label: 'มินิมอล (Minimalist)' },
        { id: 'Abstract', label: 'นามธรรม (Abstract)' },
        { id: 'Vintage', label: 'วินเทจ (Vintage)' },
        { id: 'Fantasy', label: 'แฟนตาซี (Fantasy)' },
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
        setImageUrl('');
        try {
            let finalPrompt = prompt;
            if (selectedStyle !== 'None') {
                finalPrompt = `${prompt}, ${selectedStyle} style`;
            }

            let url = '';
            if (file) {
                 const imageBase64 = await fileToBase64(file);
                 // Using editImage for Image + Text -> Image (Image Editing/Variation)
                 url = await editImage(finalPrompt, imageBase64, file.type, aspectRatio, negativePrompt);
            } else {
                 // Using generateImage for Text -> Image (Imagen 3)
                 url = await generateImage(finalPrompt, aspectRatio, negativePrompt);
            }
            setImageUrl(url);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'เกิดข้อผิดพลาดในการสร้างภาพ');
        } finally {
            setIsLoading(false);
        }
    };

    const handleShare = async () => {
        if (!imageUrl) return;
        try {
            const blob = await (await fetch(imageUrl)).blob();
            const file = new File([blob], "generated_image.jpg", { type: blob.type });
            if (navigator.share) {
                await navigator.share({
                    files: [file],
                    title: 'ภาพจาก Super AI Teacher',
                    text: prompt,
                });
            } else {
                alert("อุปกรณ์ของคุณไม่รองรับการแชร์โดยตรง");
            }
        } catch (error) {
            console.error("Error sharing:", error);
        }
    };

    const handleDownload = async () => {
        if (!imageUrl) return;

        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const mimeType = blob.type;
            const extension = mimeType === 'image/jpeg' ? 'jpg' : 'png';
            const fileName = `generated-image-${Date.now()}.${extension}`;

            if ('showSaveFilePicker' in window) {
                try {
                    const handle = await (window as any).showSaveFilePicker({
                        suggestedName: fileName,
                        types: [{
                            description: 'Image File',
                            accept: { [mimeType]: [`.${extension}`] },
                        }],
                    });
                    const writable = await handle.createWritable();
                    await writable.write(blob);
                    await writable.close();
                    return;
                } catch (err: any) {
                    if (err.name === 'AbortError') return;
                }
            }

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Download failed:", error);
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-10">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-8 transition-all hover:shadow-md">
                <div className="mb-6 p-5 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2 mb-4 border-b border-gray-200 pb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <h3 className="text-sm font-bold text-gray-700">ตั้งค่ารูปภาพ (Image Settings)</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Image Style Selection */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                                สไตล์รูปภาพ (Style)
                            </label>
                            <div className="relative">
                                <select
                                    value={selectedStyle}
                                    onChange={(e) => setSelectedStyle(e.target.value)}
                                    className="block w-full pl-3 pr-10 py-2.5 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 rounded-lg bg-white text-gray-700 appearance-none cursor-pointer shadow-sm transition-all"
                                    disabled={isLoading}
                                >
                                    {styles.map((style) => (
                                        <option key={style.id} value={style.id}>
                                            {style.label}
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Aspect Ratio Selection */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                                สัดส่วนภาพ (Aspect Ratio)
                            </label>
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                                {aspectRatios.map((ratio) => (
                                    <button
                                        key={ratio.id}
                                        onClick={() => setAspectRatio(ratio.id)}
                                        disabled={isLoading}
                                        className={`px-1 py-2.5 text-xs rounded-lg transition-all duration-200 border flex items-center justify-center font-medium ${
                                            aspectRatio === ratio.id
                                                ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                                                : 'bg-white text-gray-600 border-gray-300 hover:bg-primary-50 hover:border-primary-200 hover:text-primary-600'
                                        }`}
                                    >
                                        {ratio.id}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 border-t border-gray-200 pt-4">
                        <button 
                            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                            className="flex items-center text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-primary-600 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-1 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            ตั้งค่าขั้นสูง (Advanced Settings)
                        </button>
                        
                        {isAdvancedOpen && (
                            <div className="mt-4 animate-fade-in">
                                <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                                    Negative Prompt (สิ่งที่ต้องการหลีกเลี่ยง)
                                </label>
                                <input
                                    type="text"
                                    value={negativePrompt}
                                    onChange={(e) => setNegativePrompt(e.target.value)}
                                    placeholder="เช่น: เบลอ, ไม่ชัด, สีเพี้ยน, คนเยอะ (optional)"
                                    className="block w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-700 placeholder-gray-400 shadow-sm"
                                    disabled={isLoading}
                                />
                                <p className="text-xs text-gray-400 mt-1">ระบุสิ่งที่คุณไม่ต้องการให้ปรากฏในภาพ</p>
                            </div>
                        )}
                    </div>
                </div>

                <PromptSuggestions suggestions={suggestions} onSelect={setPrompt} />
                
                <div className="space-y-3">
                     {file && (
                        <div className="mb-2">
                            <FilePreview file={file} onRemove={() => setFile(null)} />
                        </div>
                    )}
                    
                    <div className="flex items-end gap-2 bg-gray-50 p-2 rounded-xl border border-gray-300 focus-within:ring-2 focus-within:ring-primary-200 focus-within:border-primary-500 transition-all shadow-sm">
                         <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            className="hidden" 
                            accept="image/*" 
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            title="แนบภาพต้นฉบับ (Optional)"
                            disabled={isLoading}
                            className="p-3 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors disabled:opacity-50 flex-shrink-0"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </button>
                        
                        <input
                            type="text"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={file ? "ป้อนคำสั่งเพื่อแก้ไขหรือสร้างจากภาพนี้..." : "ป้อนคำสั่งเพื่อสร้างภาพ..."}
                            className="flex-grow bg-transparent border-none focus:ring-0 p-3 text-gray-800 placeholder-gray-400 min-w-0"
                            disabled={isLoading}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleSubmit();
                                }
                            }}
                        />
                        
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading || (!prompt.trim() && !file)}
                            className="bg-primary-600 text-white font-bold p-3 rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-all shadow-md flex-shrink-0"
                            title="สร้างภาพ"
                        >
                             {isLoading ? (
                                <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                             ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                             )}
                        </button>
                    </div>
                </div>
            </div>

            {isLoading && <Loader text={file ? "AI กำลังสร้างสรรค์ภาพจากต้นฉบับของคุณ..." : "AI กำลังวาดภาพตามจินตนาการของคุณ..."} />}
            
            {error && <ErrorDisplay error={error} onRetry={handleSubmit} />}
            
            {imageUrl && (
                <ResultCard title="ภาพที่สร้าง" mediaUrl={imageUrl} mediaType="image" contentRef={resultRef}>
                    <img src={imageUrl} alt={prompt} className="rounded-lg shadow-md mx-auto max-w-full h-auto border border-gray-100" />
                    <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500 italic text-center bg-gray-50 py-2 px-4 rounded-lg border border-gray-100 flex-wrap">
                        <span>Prompt: "{prompt}"</span>
                        <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                        <span>{aspectRatio}</span>
                        {selectedStyle !== 'None' && (
                            <>
                                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                <span>Style: {selectedStyle}</span>
                            </>
                        )}
                        {negativePrompt && (
                            <>
                                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                <span className="text-red-400">No: {negativePrompt}</span>
                            </>
                        )}
                        {file && (
                            <>
                                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                <span className="flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                    </svg>
                                    Image Reference
                                </span>
                            </>
                        )}
                    </div>
                    <div className="mt-6 flex justify-center gap-3">
                         <button 
                            onClick={handleShare}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                            แชร์ (Share)
                        </button>
                        <button 
                            onClick={handleDownload}
                            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            บันทึกเป็น (Save As)
                        </button>
                    </div>
                </ResultCard>
            )}
        </div>
    );
};

export default ImageGenerator;