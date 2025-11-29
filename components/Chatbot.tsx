import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { getChatResponseStream, resetChat } from '../services/geminiService';
import Loader from './common/Loader';
import MarkdownRenderer from './common/MarkdownRenderer';
import CopyButton from './common/CopyButton';
import FilePreview from './common/FilePreview';
import ErrorDisplay from './common/ErrorDisplay';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Types for Web Speech API
interface SpeechRecognitionAlternative {
    transcript: string;
}

interface SpeechRecognitionResult {
    [index: number]: SpeechRecognitionAlternative;
    length: number;
}

interface SpeechRecognitionResultList {
    [index: number]: SpeechRecognitionResult;
    length: number;
}

interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    lang: string;
    interimResults: boolean;
    start(): void;
    stop(): void;
    onresult: (event: SpeechRecognitionEvent) => void;
    onerror: (event: SpeechRecognitionErrorEvent) => void;
    onend: () => void;
}

// @ts-ignore
const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

const CHAT_HISTORY_KEY = 'gemini-teacher-ai-chat-history';
const SAVED_CHATS_KEY = 'gemini-teacher-saved-chats-list';

interface SavedChat {
    id: string;
    name: string;
    date: string;
    messages: ChatMessage[];
}

const Chatbot: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeechSupported, setIsSpeechSupported] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [exportStatus, setExportStatus] = useState('');
    const [pdfGenerating, setPdfGenerating] = useState(false);
    const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
    const [savedChats, setSavedChats] = useState<SavedChat[]>([]);
    
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (SpeechRecognitionAPI) {
            setIsSpeechSupported(true);
            const recognition: SpeechRecognition = new SpeechRecognitionAPI();
            recognition.continuous = false;
            recognition.lang = 'th-TH';
            recognition.interimResults = false;

            recognition.onresult = (event: SpeechRecognitionEvent) => {
                const transcript = event.results[event.results.length - 1][0].transcript;
                setInput(prev => prev ? `${prev} ${transcript}` : transcript);
            };

            recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
                console.error('Speech recognition error:', event.error);
                if (isListening) setIsListening(false);
            };

            recognition.onend = () => {
                if (isListening) setIsListening(false);
            };

            recognitionRef.current = recognition;
        }
    }, [isListening]);

    useEffect(() => {
        try {
            const savedHistory = localStorage.getItem(CHAT_HISTORY_KEY);
            if (savedHistory) {
                setMessages(JSON.parse(savedHistory));
            }
            const savedChatsList = localStorage.getItem(SAVED_CHATS_KEY);
            if (savedChatsList) {
                setSavedChats(JSON.parse(savedChatsList));
            }
        } catch (error) {
            console.error("Failed to load chat history from localStorage", error);
        }
    }, []);

    useEffect(() => {
        try {
            if (messages.length === 0 && localStorage.getItem(CHAT_HISTORY_KEY)) {
                localStorage.removeItem(CHAT_HISTORY_KEY);
            } else if (messages.length > 0) {
                localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
            }
        } catch (error) {
            console.error("Failed to update chat history in localStorage", error);
        }
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages, isLoading, error]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setError(null);
        }
        e.target.value = '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!input.trim() && !file) || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        
        const currentInput = input;
        const currentFile = file;

        setInput('');
        setFile(null);
        setError(null);
        setIsLoading(true);

        try {
            const placeholder: ChatMessage = { role: 'model', text: '' };
            setMessages(prev => [...prev, placeholder]);

            const stream = getChatResponseStream(currentInput, currentFile);

            for await (const chunk of stream) {
                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage.role === 'model') {
                        lastMessage.text += chunk;
                    }
                    return newMessages;
                });
            }
        } catch (err: any) {
            console.error("Chat Error:", err);
            setMessages(prev => prev.slice(0, -1));
            
            // Robust error message extraction
            let errorMessage = "เกิดข้อผิดพลาดในการเชื่อมต่อ";
            if (err instanceof Error) {
                errorMessage = err.message;
            } else if (typeof err === 'string') {
                errorMessage = err;
            } else if (err && typeof err === 'object') {
                // Try to find a message property, otherwise stringify
                errorMessage = err.message || err.statusText || JSON.stringify(err);
                if (errorMessage === '{}') errorMessage = "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
            }
            
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearHistory = () => {
        if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการล้างประวัติการสนทนาทั้งหมด?')) {
            setMessages([]);
            setError(null);
            resetChat();
        }
    };

    // Save/Load Logic
    const handleSaveChat = () => {
        if (messages.length === 0) return;
        const name = prompt("ตั้งชื่อการสนทนานี้:", `Chat ${new Date().toLocaleDateString()}`);
        if (!name) return;

        const newSavedChat: SavedChat = {
            id: Date.now().toString(),
            name,
            date: new Date().toLocaleString(),
            messages: [...messages]
        };

        const updatedSavedChats = [newSavedChat, ...savedChats];
        setSavedChats(updatedSavedChats);
        localStorage.setItem(SAVED_CHATS_KEY, JSON.stringify(updatedSavedChats));
    };

    const handleLoadChat = (chat: SavedChat) => {
        if (messages.length > 0) {
            if (!window.confirm("โหลดการสนทนาเก่าจะแทนที่การสนทนาปัจจุบัน คุณแน่ใจหรือไม่?")) return;
        }
        setMessages(chat.messages);
        setError(null);
        resetChat(); // Reset the gemini chat instance context for fresh start or need to rebuild context manually if API allowed (it doesn't directly, so new chat starts from saved history context usually implies re-sending or just viewing)
        // Note: Restoring actual API context from history isn't fully supported by simple chat restoration in UI unless we re-send history to API. 
        // For now, we load UI history. The next message will start a new session context or we could try to preload history if the API supported it easily. 
        // The simple standard is treating it as visual history for now, or new context.
        setIsLoadModalOpen(false);
    };

    const handleDeleteSavedChat = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบการสนทนานี้?")) {
            const updatedChats = savedChats.filter(c => c.id !== id);
            setSavedChats(updatedChats);
            localStorage.setItem(SAVED_CHATS_KEY, JSON.stringify(updatedChats));
        }
    };

    const handleExportMarkdown = () => {
        const markdownContent = messages.map(msg => {
            const roleName = msg.role === 'user' ? '## User' : '## AI Model';
            return `${roleName}\n${msg.text}\n`;
        }).join('\n---\n\n');

        navigator.clipboard.writeText(markdownContent).then(() => {
            setExportStatus('คัดลอกแล้ว!');
            setTimeout(() => setExportStatus(''), 2000);
        });
    };

    const handleExportPDF = () => {
        if (!chatContainerRef.current || messages.length === 0) return;
        setPdfGenerating(true);

        setTimeout(() => {
            html2canvas(chatContainerRef.current as HTMLElement, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true,
                windowHeight: chatContainerRef.current?.scrollHeight
            }).then((canvas) => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const canvasWidth = canvas.width;
                const canvasHeight = canvas.height;
                const ratio = canvasWidth / canvasHeight;
                const height = pdfWidth / ratio;
                
                let heightLeft = height;
                let position = 0;
                const pageHeight = pdfHeight;

                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, height);
                heightLeft -= pageHeight;

                while (heightLeft >= 0) {
                    position = heightLeft - height;
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, height);
                    heightLeft -= pageHeight;
                }

                pdf.save('chat_history.pdf');
                setPdfGenerating(false);
            }).catch(err => {
                console.error("PDF Generation Error:", err);
                setError("ไม่สามารถสร้าง PDF ได้");
                setPdfGenerating(false);
            });
        }, 500);
    };
    
    const handleToggleListening = () => {
        if (!recognitionRef.current || isLoading) return;

        if (isListening) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] max-w-5xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-xl shadow-gray-100 overflow-hidden relative">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/80 flex justify-between items-center backdrop-blur-sm z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-100 text-primary-600 rounded-lg">
                        <span className="text-xl">💬</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 hidden sm:block">ผู้ช่วยสนทนา</h3>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                     <button
                        onClick={handleSaveChat}
                        disabled={messages.length === 0}
                        className="flex items-center gap-1 text-xs bg-white border border-gray-200 hover:border-green-500 hover:text-green-600 text-gray-600 px-3 py-1.5 rounded-md transition-all duration-200 shadow-sm whitespace-nowrap disabled:opacity-50"
                        title="บันทึกการสนทนา"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                        Save
                    </button>
                    <button
                        onClick={() => setIsLoadModalOpen(true)}
                        className="flex items-center gap-1 text-xs bg-white border border-gray-200 hover:border-blue-500 hover:text-blue-600 text-gray-600 px-3 py-1.5 rounded-md transition-all duration-200 shadow-sm whitespace-nowrap"
                        title="โหลดการสนทนา"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        Load
                    </button>
                    <div className="h-6 w-px bg-gray-300 mx-1"></div>
                    {messages.length > 0 && (
                        <>
                             <button
                                onClick={handleExportMarkdown}
                                className="hidden sm:flex items-center gap-1 text-xs bg-white border border-gray-200 hover:border-primary-500 hover:text-primary-600 text-gray-600 px-3 py-1.5 rounded-md transition-all duration-200 shadow-sm whitespace-nowrap"
                                title="คัดลอกบทสนทนาเป็น Markdown"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 01-2-2V5a2 2 0 012-2h4.586" /></svg>
                                {exportStatus || 'MD'}
                            </button>
                            <button
                                onClick={handleExportPDF}
                                disabled={pdfGenerating}
                                className="hidden sm:flex items-center gap-1 text-xs bg-white border border-gray-200 hover:border-red-500 hover:text-red-600 text-gray-600 px-3 py-1.5 rounded-md transition-all duration-200 shadow-sm whitespace-nowrap"
                                title="บันทึกเป็น PDF"
                            >
                                {pdfGenerating ? (
                                    <span className="animate-spin h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full"></span>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                )}
                                PDF
                            </button>
                            <button
                                onClick={handleClearHistory}
                                className="flex items-center gap-1 text-xs bg-white border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-gray-500 px-3 py-1.5 rounded-md transition-all duration-200 disabled:opacity-50 shadow-sm whitespace-nowrap"
                                disabled={isLoading}
                                title="ล้างประวัติการสนทนา"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                Clear
                            </button>
                        </>
                    )}
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-white scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent" ref={chatContainerRef}>
                
                {messages.length === 0 && !isLoading && !error && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
                        <span className="text-6xl mb-4 grayscale">👋</span>
                        <p className="text-lg">เริ่มต้นการสนทนาได้เลย</p>
                    </div>
                )}

                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 group ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                         {msg.role === 'model' && (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white shadow-md flex-shrink-0 mt-1">
                                AI
                            </div>
                         )}
                        <div className={`relative px-5 py-3.5 rounded-2xl max-w-[85%] sm:max-w-[75%] shadow-sm text-sm sm:text-base leading-relaxed animate-fade-in
                            ${msg.role === 'user' 
                                ? 'bg-gray-800 text-white rounded-tr-none' 
                                : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none shadow-gray-100'}`}
                        >
                            {msg.role === 'model' ? (
                                <div className="markdown-chat">
                                    <MarkdownRenderer content={msg.text} />
                                </div>
                            ) : (
                                <p className="whitespace-pre-wrap">{msg.text}</p>
                            )}
                            {msg.role === 'model' && msg.text && <CopyButton textToCopy={msg.text} />}
                        </div>
                    </div>
                ))}
                
                {isLoading && messages.length > 0 && messages[messages.length-1].role === 'user' && (
                     <div className="flex justify-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white shadow-md flex-shrink-0 mt-1">AI</div>
                        <div className="bg-white border border-gray-100 px-6 py-4 rounded-2xl rounded-tl-none shadow-sm">
                             <div className="flex space-x-2">
                                <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                        </div>
                    </div>
                )}

                {error && <ErrorDisplay error={error} onRetry={() => { setError(null); handleSubmit({ preventDefault: () => {} } as any); }} />}
                
                <div ref={messagesEndRef} />
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 border-t border-gray-100 bg-gray-50/50">
                {file && (
                    <div className="mb-3">
                        <FilePreview file={file} onRemove={() => setFile(null)} />
                    </div>
                )}
                <div className="flex items-end gap-2 bg-white p-2 rounded-xl border border-gray-200 shadow-sm focus-within:border-primary-400 focus-within:ring-4 focus-within:ring-primary-50 transition-all duration-200">
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        className="hidden" 
                        accept="image/*,application/pdf" 
                    />
                     <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        title="แนบไฟล์"
                        disabled={isLoading}
                        className="p-3 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors disabled:opacity-50"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                    </button>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                        placeholder={isListening ? "กำลังฟัง..." : "พิมพ์ข้อความ..."}
                        className="flex-1 bg-transparent border-none focus:ring-0 p-3 max-h-32 overflow-y-auto resize-none text-gray-800 placeholder-gray-400"
                        disabled={isLoading}
                        autoComplete="off"
                    />
                     {isSpeechSupported && (
                        <button
                            type="button"
                            onClick={handleToggleListening}
                            title={isListening ? "หยุดฟัง" : "พูดเพื่อป้อนข้อความ"}
                            disabled={isLoading}
                            className={`p-3 rounded-lg transition-all duration-200 disabled:opacity-50
                                ${isListening ? 'bg-red-50 text-red-600 animate-pulse' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-14 0m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        </button>
                    )}
                    <button 
                        type="submit" 
                        className={`p-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center
                            ${(!input.trim() && !file) || isLoading 
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                : 'bg-primary-600 text-white hover:bg-primary-700 shadow-md hover:shadow-lg'}`}
                        disabled={isLoading || (!input.trim() && !file)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </div>
                <p className="text-xs text-center text-gray-400 mt-2">AI อาจแสดงข้อมูลที่ไม่ถูกต้อง โปรดตรวจสอบความถูกต้องเสมอ</p>
            </form>

            {/* Load Chat Modal */}
            {isLoadModalOpen && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsLoadModalOpen(false)}></div>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80%] flex flex-col z-10 animate-fade-in border border-gray-200">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                            <h3 className="font-bold text-gray-800">โหลดการสนทนา</h3>
                            <button onClick={() => setIsLoadModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-200">
                            {savedChats.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    ยังไม่มีการสนทนาที่บันทึกไว้
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {savedChats.map(chat => (
                                        <div key={chat.id} 
                                            onClick={() => handleLoadChat(chat)}
                                            className="p-3 rounded-xl hover:bg-primary-50 border border-transparent hover:border-primary-100 cursor-pointer group transition-all"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="font-semibold text-gray-800 group-hover:text-primary-700">{chat.name}</div>
                                                    <div className="text-xs text-gray-400 mt-1">{chat.date} • {chat.messages.length} ข้อความ</div>
                                                </div>
                                                <button 
                                                    onClick={(e) => handleDeleteSavedChat(chat.id, e)}
                                                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="ลบ"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chatbot;