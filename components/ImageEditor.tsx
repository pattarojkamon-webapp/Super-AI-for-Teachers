import React, { useState } from 'react';
import { editImage, fileToBase64 } from '../services/geminiService';
import Loader from './common/Loader';
import FileUpload from './common/FileUpload';
import PromptSuggestions from './common/PromptSuggestions';
import ErrorDisplay from './common/ErrorDisplay';

const ImageEditor: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [originalFile, setOriginalFile] = useState<File | null>(null);
    const [originalPreview, setOriginalPreview] = useState<string>('');
    const [editedImageUrl, setEditedImageUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Config States
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [selectedStyle, setSelectedStyle] = useState('None');

    const suggestions = [
        "เพิ่มฟิลเตอร์เรโทร",
        "เปลี่ยนพื้นหลังเป็นชายหาด",
        "ทำให้ภาพดูสว่างขึ้น",
        "ลบวัตถุที่ไม่ต้องการออก",
        "เปลี่ยนเป็นสไตล์ภาพวาดสีน้ำมัน"
    ];

    const aspectRatios = [
        { id: '1:1', label: '1:1 (จัตุรัส)' },
        { id: '16:9', label: '16:9 (แนวนอน)' },
        { id: '4:3', label: '4:3 (แนวนอน)' },
        { id: '3:4', label: '3:4 (แนวตั้ง)' },
        { id: '9:16', label: '9:16 (แนวตั้ง)' },
    ];

    const styles = [
        { id: 'None', label: 'ปกติ (None)' },
        { id: 'Photorealistic', label: 'สมจริง' },
        { id: 'Cartoon', label: 'การ์ตูน' },
        { id: 'Anime', label: 'อนิเมะ' },
        { id: 'Oil Painting', label: 'สีน้ำมัน' },
        { id: 'Watercolor', label: 'สีน้ำ' },
        { id: 'Pixel Art', label: 'พิกเซล' },
        { id: '3D Render', label: '3D' },
        { id: 'Sketch', label: 'ภาพร่าง' },
        { id: 'Line Art', label: 'ลายเส้น' },
        { id: 'Cyberpunk', label: 'ไซเบอร์พังค์' },
        { id: 'Pop Art', label: 'ป๊อปอาร์ต' },
        { id: 'Steampunk', label: 'สตีมพังค์' },
        { id: 'Minimalist', label: 'มินิมอล' },
        { id: 'Abstract', label: 'นามธรรม' },
        { id: 'Vintage', label: 'วินเทจ' },
        { id: 'Fantasy', label: 'แฟนตาซี' },
        { id: 'Noir', label: 'นัวร์/ขาวดำ' },
        { id: 'Impressionism', label: 'อิมเพรสชันนิสม์' },
        { id: 'Surrealism', label: 'เหนือจริง' },
        { id: 'Flat Design', label: 'แฟลตดีไซน์' },
    ];

    const handleFileChange = (file: File) => {
        setOriginalFile(file);
        setOriginalPreview(URL.createObjectURL(file));
        setEditedImageUrl('');
        setError('');
    };

    const handleSubmit = async () => {
        if (!originalFile || !prompt.trim()) return;
        setIsLoading(true);
        setError('');
        setEditedImageUrl('');
        try {
            // Prepend clear instruction for the model including style
            let instructionalPrompt = `Modify this image: ${prompt}`;
            if (selectedStyle !== 'None') {
                instructionalPrompt += `. Style: ${selectedStyle}`;
            }

            const imageBase64 = await fileToBase64(originalFile);
            const responseUrl = await editImage(instructionalPrompt, imageBase64, originalFile.type, aspectRatio);
            setEditedImageUrl(responseUrl);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'เกิดข้อผิดพลาดในการแก้ไขภาพ');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!editedImageUrl) return;

        try {
            const response = await fetch(editedImageUrl);
            const blob = await response.blob();
            const mimeType = blob.type || 'image/png';
            const extension = mimeType.split('/')[1] || 'png';
            const fileName = `edited-image.${extension}`;

            if ('showSaveFilePicker' in window) {
                try {
                    const handle = await (window as any).showSaveFilePicker({
                        suggestedName: fileName,
                        types: [{
                            description: 'Image',
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

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

        } catch (e) {
            console.error("Download error:", e);
            const link = document.createElement('a');
            link.href = editedImageUrl;
            link.download = `edited-image.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };
    
    return (
        <div className="max-w-6xl mx-auto pb-10">
            {/* Upload Frame */}
            {!originalPreview && (
                <div className="bg-white p-10 rounded-3xl border-2 border-dashed border-primary-200 shadow-sm hover:border-primary-400 hover:shadow-md transition-all duration-300 bg-gradient-to-b from-primary-50/30 to-transparent group cursor-pointer relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                     <div className="relative z-10">
                        <h3 className="text-xl font-bold text-gray-700 mb-6 text-center flex flex-col items-center justify-center gap-3">
                            <span className="bg-white p-4 rounded-2xl shadow-sm text-primary-600 border border-primary-100 group-hover:scale-110 transition-transform duration-300">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            </span>
                            <span>อัปโหลดภาพต้นฉบับ</span>
                            <span className="text-sm font-normal text-gray-500">เพื่อเริ่มการแก้ไขและตกแต่ง</span>
                        </h3>
                        <div className="max-w-xl mx-auto transform group-hover:-translate-y-1 transition-transform duration-300">
                            <FileUpload onFileUpload={handleFileChange} />
                        </div>
                    </div>
                </div>
            )}

            {originalPreview && (
                <div className="space-y-6 animate-fade-in">
                    {/* Main Workspace */}
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                        {/* Source */}
                        <div className="flex flex-col gap-3 bg-white p-4 rounded-3xl border border-gray-200 shadow-sm relative group">
                            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-2 px-2">
                                <h3 className="text-md font-bold text-gray-700 flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-gray-400"></span>
                                    ภาพต้นฉบับ
                                </h3>
                                <button 
                                    onClick={() => { setOriginalFile(null); setOriginalPreview(''); setEditedImageUrl(''); }}
                                    className="text-xs text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-full border border-red-100 transition-colors flex items-center gap-1"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    เปลี่ยนรูป
                                </button>
                            </div>
                            <div className="aspect-square flex items-center justify-center bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 relative">
                                <img src={originalPreview} alt="Original" className="max-w-full max-h-full object-contain" />
                                <div className="absolute inset-0 border-4 border-white/50 rounded-2xl pointer-events-none"></div>
                            </div>
                        </div>
                        
                        {/* Result */}
                        <div className="flex flex-col gap-3 bg-white p-4 rounded-3xl border border-gray-200 shadow-sm">
                           <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-2 px-2">
                             <h3 className="text-md font-bold text-gray-700 flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 animate-pulse"></span>
                                ภาพที่แก้ไขแล้ว
                             </h3>
                             {editedImageUrl && (
                                <button onClick={handleDownload} className="text-xs bg-primary-600 hover:bg-primary-700 text-white font-medium px-3 py-1.5 rounded-full transition-all duration-200 shadow-sm flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    บันทึกภาพ
                                </button>
                             )}
                           </div>
                             <div className="aspect-square bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative">
                                {isLoading ? <Loader text="กำลังเนรมิตภาพใหม่..." /> : (
                                    editedImageUrl ? (
                                        <div className="relative w-full h-full flex items-center justify-center">
                                            <img src={editedImageUrl} alt="Edited" className="max-w-full max-h-full object-contain animate-fade-in" />
                                        </div>
                                    ) : (
                                        <div className="text-gray-400 text-center p-4 flex flex-col items-center select-none">
                                            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3 text-2xl">✨</div>
                                            <p className="text-sm font-medium">ภาพผลลัพธ์จะปรากฏที่นี่</p>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Controls Panel */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm transition-shadow hover:shadow-md">
                        
                        <div className="mb-6 p-5 bg-gray-50/80 rounded-2xl border border-gray-100">
                            <div className="flex items-center gap-2 mb-4 border-b border-gray-200 pb-3">
                                <div className="p-1.5 bg-primary-100 text-primary-600 rounded-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                    </svg>
                                </div>
                                <h3 className="text-sm font-bold text-gray-700">การตั้งค่า (Settings)</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Aspect Ratio Selection */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">
                                        ขนาดภาพผลลัพธ์ (Output Size)
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {aspectRatios.map((ratio) => (
                                            <button
                                                key={ratio.id}
                                                onClick={() => setAspectRatio(ratio.id)}
                                                disabled={isLoading}
                                                className={`px-2 py-3 text-xs rounded-xl transition-all duration-200 border flex items-center justify-center font-medium ${
                                                    aspectRatio === ratio.id
                                                        ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                                                        : 'bg-white text-gray-600 border-gray-200 hover:bg-primary-50 hover:border-primary-200 hover:text-primary-600'
                                                }`}
                                            >
                                                {ratio.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Image Style Selection - BUTTONS GRID */}
                                <div className="lg:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">
                                        เลือกสไตล์ภาพ (Select Style)
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200">
                                        {styles.map((style) => (
                                            <button
                                                key={style.id}
                                                onClick={() => setSelectedStyle(style.id)}
                                                disabled={isLoading}
                                                className={`px-3 py-2 text-xs rounded-lg transition-all duration-200 border text-left truncate ${
                                                    selectedStyle === style.id
                                                        ? 'bg-primary-600 text-white border-primary-600 shadow-sm ring-2 ring-primary-100 ring-offset-1'
                                                        : 'bg-white text-gray-600 border-gray-200 hover:bg-primary-50 hover:border-primary-200 hover:text-primary-700'
                                                }`}
                                                title={style.label}
                                            >
                                                {style.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <PromptSuggestions suggestions={suggestions} onSelect={setPrompt} />
                        
                        <div className="flex flex-col sm:flex-row gap-3 mt-4">
                             <input
                                type="text"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="ป้อนคำสั่งเพื่อแก้ไขภาพ เช่น 'เปลี่ยนท้องฟ้าเป็นกลางคืน'..."
                                className="flex-grow bg-gray-50 border border-gray-300 rounded-xl p-4 focus:ring-2 focus:ring-primary-200 focus:border-primary-500 focus:outline-none transition-all duration-200 text-gray-800 placeholder-gray-400"
                                disabled={isLoading}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSubmit();
                                }}
                            />
                            <button
                                onClick={handleSubmit}
                                disabled={isLoading || !prompt.trim() || !originalFile}
                                className="bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold py-4 px-10 rounded-xl hover:from-primary-700 hover:to-primary-800 disabled:from-gray-300 disabled:to-gray-400 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-primary-500/30 whitespace-nowrap flex items-center justify-center gap-2 transform active:scale-95"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        กำลังสร้าง...
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        Generate
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
             {error && <ErrorDisplay error={error} onRetry={handleSubmit} />}
        </div>
    );
};

export default ImageEditor;