import React, { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ResultCardProps {
    title: string;
    children: React.ReactNode;
    textResult?: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'video';
    contentRef: React.RefObject<HTMLDivElement>;
    onClose?: () => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ title, children, textResult, mediaUrl, mediaType, contentRef, onClose }) => {
    const [copyStatus, setCopyStatus] = useState('คัดลอก Markdown');

    const handleCopy = () => {
        if (!textResult) return;
        navigator.clipboard.writeText(textResult).then(() => {
            setCopyStatus('คัดลอกสำเร็จ!');
            setTimeout(() => setCopyStatus('คัดลอก Markdown'), 2000);
        });
    };
    
    const handleExportPdf = () => {
        if (!contentRef.current) return;
        // Use white background for PDF capture
        html2canvas(contentRef.current, { backgroundColor: '#ffffff' }).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const ratio = canvasWidth / canvasHeight;
            const width = pdfWidth - 20; // with margin
            const height = width / ratio;
            
            if (height > pdfHeight - 20) {
                 // handle long content if needed
            }

            pdf.addImage(imgData, 'PNG', 10, 10, width, height);
            pdf.save(`${title.replace(/\s+/g, '_').toLowerCase()}_result.pdf`);
        });
    };

    const handleDownload = async () => {
        if (!mediaUrl) return;

        try {
            // Fetch blob to get real mime type and data
            const response = await fetch(mediaUrl);
            const blob = await response.blob();
            
            // Determine correct extension
            const mimeType = blob.type;
            let extension = mediaType === 'image' ? 'png' : 'mp4';
            if (mimeType === 'image/jpeg') extension = 'jpg';
            else if (mimeType === 'image/webp') extension = 'webp';
            
            const defaultFileName = `${title.replace(/\s+/g, '_').toLowerCase()}.${extension}`;

            // Try using File System Access API for "Save As" dialog
            if ('showSaveFilePicker' in window) {
                try {
                    const opts = {
                        suggestedName: defaultFileName,
                        types: [{
                            description: mediaType === 'image' ? 'Image File' : 'Video File',
                            accept: { [mimeType]: [`.${extension}`] },
                        }],
                    };
                    const handle = await (window as any).showSaveFilePicker(opts);
                    const writable = await handle.createWritable();
                    await writable.write(blob);
                    await writable.close();
                    return; // Success
                } catch (err: any) {
                    if (err.name === 'AbortError') return; // User cancelled
                    // If other error, fall through to legacy method
                    console.warn("File System Access API failed, falling back", err);
                }
            }

            // Legacy fallback for browsers without showSaveFilePicker
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = defaultFileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error("Download failed:", error);
            // Simple fallback for external URLs if fetch fails
            const link = document.createElement('a');
            link.href = mediaUrl;
            const fileExtension = mediaType === 'image' ? '.jpg' : '.mp4';
            link.download = `${title.replace(/\s+/g, '_').toLowerCase()}${fileExtension}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div className="mt-8 bg-white rounded-2xl border border-gray-200 shadow-lg shadow-gray-200/50 overflow-hidden animate-fade-in">
            <div className="flex flex-wrap justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50 gap-3">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <span className="w-2 h-6 bg-primary-500 rounded-full inline-block"></span>
                    {title}
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                    {textResult && (
                        <>
                            <button onClick={handleCopy} className="flex items-center gap-1 text-xs bg-white border border-gray-200 hover:border-primary-500 hover:text-primary-600 text-gray-600 font-medium px-3 py-1.5 rounded-md transition-all duration-200 shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                {copyStatus}
                            </button>
                            <button onClick={handleExportPdf} className="flex items-center gap-1 text-xs bg-white border border-gray-200 hover:border-primary-500 hover:text-primary-600 text-gray-600 font-medium px-3 py-1.5 rounded-md transition-all duration-200 shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                PDF
                            </button>
                        </>
                    )}
                     {mediaUrl && (
                        <button onClick={handleDownload} className="flex items-center gap-1 text-xs bg-white border border-gray-200 hover:border-primary-500 hover:text-primary-600 text-gray-600 font-medium px-3 py-1.5 rounded-md transition-all duration-200 shadow-sm" title="บันทึกเป็น...">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            บันทึก
                        </button>
                    )}
                    {onClose && (
                        <button onClick={onClose} className="ml-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors" title="ล้างผลลัพธ์">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    )}
                </div>
            </div>
            <div className="p-6 text-gray-700 leading-relaxed" ref={contentRef}>
                {children}
            </div>
        </div>
    );
};

export default ResultCard;