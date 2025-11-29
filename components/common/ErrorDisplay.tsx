import React from 'react';

interface ErrorDisplayProps {
    error: string;
    onRetry?: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onRetry }) => {
    let title = "เกิดข้อผิดพลาด";
    let suggestion = "โปรดลองใหม่อีกครั้ง";
    let icon = (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );

    // Analyze error message content to provide specific feedback
    const lowerError = error.toLowerCase();
    
    if (lowerError.includes("safety") || lowerError.includes("blocked")) {
        title = "เนื้อหาถูกระงับเพื่อความปลอดภัย";
        suggestion = "AI ตรวจพบเนื้อหาที่อาจไม่เหมาะสมหรือละเมิดนโยบายความปลอดภัย ลองปรับเปลี่ยนคำสั่งให้สุภาพหรือชัดเจนขึ้น";
        icon = (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        );
    } else if (lowerError.includes("quota") || lowerError.includes("429")) {
        title = "ใช้งานเกินขีดจำกัด (Quota Exceeded)";
        suggestion = "ระบบมีการใช้งานหนาแน่น โปรดรอสักครู่ (ประมาณ 1-2 นาที) แล้วลองใหม่อีกครั้ง";
    } else if (lowerError.includes("network") || lowerError.includes("fetch")) {
        title = "ปัญหาการเชื่อมต่อ";
        suggestion = "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ โปรดตรวจสอบอินเทอร์เน็ตของคุณ";
        icon = (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
            </svg>
        );
    } else if (lowerError.includes("key") || lowerError.includes("permission")) {
        title = "ปัญหาการเข้าถึง (API Key)";
        suggestion = "API Key อาจไม่ถูกต้องหรือไม่มีสิทธิ์เข้าถึงฟีเจอร์นี้ (เช่น Veo Video)";
    }

    return (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md my-4 shadow-sm animate-fade-in">
            <div className="flex items-start">
                <div className="flex-shrink-0">
                    {icon}
                </div>
                <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-red-800">{title}</h3>
                    <div className="mt-2 text-sm text-red-700">
                        <p>{error}</p>
                    </div>
                    <div className="mt-2 text-sm text-gray-600 bg-white/50 p-2 rounded border border-red-100">
                        <strong>คำแนะนำ:</strong> {suggestion}
                    </div>
                    {onRetry && (
                        <div className="mt-4">
                            <button
                                onClick={onRetry}
                                className="text-sm font-medium text-red-600 hover:text-red-500 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded transition-colors"
                            >
                                ลองใหม่อีกครั้ง
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ErrorDisplay;