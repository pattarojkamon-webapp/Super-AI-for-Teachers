import React, { useState, useCallback, useEffect } from 'react';
import { TOOLS, ToolID, THEME_COLORS } from './constants';
import ImageGenerator from './components/ImageGenerator';
import ThinkingAssistant from './components/ThinkingAssistant';
import VideoGenerator from './components/VideoGenerator';
import InfoSearch from './components/InfoSearch';
import ImageEditor from './components/ImageEditor';
import TextToSpeech from './components/TextToSpeech';
import Chatbot from './components/Chatbot';
import ImageAnalyzer from './components/ImageAnalyzer';
import MapSearch from './components/MapSearch';

type ThemeKey = keyof typeof THEME_COLORS;

const App: React.FC = () => {
    const [activeTool, setActiveTool] = useState<ToolID | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [currentTheme, setCurrentTheme] = useState<ThemeKey>('purple');
    const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

    useEffect(() => {
        const theme = THEME_COLORS[currentTheme];
        const root = document.documentElement;
        Object.keys(theme).forEach((key) => {
            root.style.setProperty(`--color-primary-${key}`, theme[Number(key)]);
        });
    }, [currentTheme]);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    
    const handleToolSelect = (id: ToolID) => {
        setActiveTool(id);
        setIsSidebarOpen(false); // Close sidebar on mobile after selection
    };

    const themes: { key: ThemeKey; name: string; color: string }[] = [
        { key: 'purple', name: 'Purple', color: 'bg-purple-600' },
        { key: 'blue', name: 'Blue', color: 'bg-blue-600' },
        { key: 'emerald', name: 'Emerald', color: 'bg-emerald-600' },
        { key: 'rose', name: 'Rose', color: 'bg-rose-600' },
        { key: 'amber', name: 'Amber', color: 'bg-amber-500' },
    ];

    const renderDashboard = () => (
        <div className="max-w-6xl mx-auto p-4 pb-12 animate-fade-in">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-3xl p-8 md:p-12 text-white shadow-xl mb-10 relative overflow-hidden transition-colors duration-500">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-400 opacity-10 rounded-full -ml-10 -mb-10 blur-2xl"></div>
                
                <div className="relative z-10">
                    <div className="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-sm font-medium mb-6 border border-white/20">
                        ✨ AI Assistant for Education
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                        สวัสดีคุณครู! <br/>
                        <span className="text-primary-200">วันนี้เราจะสร้างสรรค์อะไรกันดี?</span>
                    </h1>
                    <p className="text-lg text-primary-100 max-w-2xl mb-8 leading-relaxed">
                        ผู้ช่วยอัจฉริยะที่รวบรวมเครื่องมือ AI ที่จำเป็นสำหรับการสอนไว้ในที่เดียว 
                        ช่วยลดภาระงานและเพิ่มความคิดสร้างสรรค์ให้กับห้องเรียนของคุณ
                    </p>
                    <button 
                        onClick={() => handleToolSelect('chatbot')}
                        className="bg-white text-primary-700 px-8 py-3.5 rounded-xl font-bold shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all transform hover:-translate-y-1 flex items-center gap-2"
                    >
                        <span>💬</span> เริ่มต้นสนทนากับ AI
                    </button>
                </div>
            </div>

            {/* Quick Access Grid */}
            <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <span className="w-1.5 h-8 bg-primary-600 rounded-full"></span>
                    เครื่องมือยอดนิยม
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    <div 
                        onClick={() => handleToolSelect('thinking-assistant')}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-200 transition-all cursor-pointer group"
                    >
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                            🧠
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-primary-700">ช่วยคิดวิเคราะห์</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">ออกแบบแผนการสอน สร้างใบงาน และวิเคราะห์หัวข้อที่ซับซ้อน</p>
                    </div>

                    <div 
                        onClick={() => handleToolSelect('image-generator')}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-200 transition-all cursor-pointer group"
                    >
                        <div className="w-12 h-12 bg-pink-50 text-pink-600 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                            🎨
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-primary-700">สร้างสื่อการสอน (รูปภาพ)</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">เนรมิตภาพประกอบสื่อการสอนได้ดั่งใจนึกจากข้อความ</p>
                    </div>

                    <div 
                        onClick={() => handleToolSelect('info-search')}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-200 transition-all cursor-pointer group"
                    >
                        <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                            🌐
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-primary-700">ค้นหาข้อมูลล่าสุด</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">เข้าถึงข้อมูล Real-time ที่แม่นยำจาก Google Search</p>
                    </div>
                </div>
            </div>

            {/* Tips Section */}
             <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <span className="w-1.5 h-8 bg-yellow-500 rounded-full"></span>
                    เคล็ดลับสำหรับคุณครู
                </h2>
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-100 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex gap-3">
                            <div className="w-8 h-8 bg-white text-yellow-600 rounded-full flex items-center justify-center shadow-sm font-bold text-sm border border-yellow-100">1</div>
                            <div>
                                <h4 className="font-bold text-gray-800 mb-1">Prompt ที่ชัดเจน</h4>
                                <p className="text-sm text-gray-600">ระบุระดับชั้นเรียน และวัตถุประสงค์ให้ชัดเจน เพื่อให้ AI ตอบได้ตรงใจ เช่น "สำหรับเด็ก ป.4"</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                             <div className="w-8 h-8 bg-white text-yellow-600 rounded-full flex items-center justify-center shadow-sm font-bold text-sm border border-yellow-100">2</div>
                            <div>
                                <h4 className="font-bold text-gray-800 mb-1">ใช้รูปภาพช่วย</h4>
                                <p className="text-sm text-gray-600">ถ่ายรูปใบงานเก่า แล้วให้ AI ช่วยปรับปรุง หรือสร้างโจทย์ใหม่ที่คล้ายกัน</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                             <div className="w-8 h-8 bg-white text-yellow-600 rounded-full flex items-center justify-center shadow-sm font-bold text-sm border border-yellow-100">3</div>
                            <div>
                                <h4 className="font-bold text-gray-800 mb-1">ตรวจทานเสมอ</h4>
                                <p className="text-sm text-gray-600">AI เป็นเพียงผู้ช่วย ข้อมูลอาจมีความคลาดเคลื่อน ควรตรวจสอบความถูกต้องก่อนนำไปใช้จริง</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* All Tools Categories */}
            <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <span className="w-1.5 h-8 bg-indigo-600 rounded-full"></span>
                    หมวดหมู่การใช้งาน
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Media Tools */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <span className="text-xl">🎬</span> สื่อมัลติมีเดีย
                        </h3>
                        <div className="space-y-3">
                             <button onClick={() => handleToolSelect('video-generator')} className="w-full flex items-center p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all text-left group">
                                <div className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center mr-3 text-sm">🎥</div>
                                <div>
                                    <div className="font-medium text-gray-800 group-hover:text-primary-700">สร้างวิดีโอ (Veo)</div>
                                    <div className="text-xs text-gray-500">ภาพเคลื่อนไหวสั้นๆ ประกอบการสอน</div>
                                </div>
                            </button>
                            <button onClick={() => handleToolSelect('text-to-speech')} className="w-full flex items-center p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all text-left group">
                                <div className="w-8 h-8 bg-yellow-100 text-yellow-600 rounded-lg flex items-center justify-center mr-3 text-sm">🗣️</div>
                                <div>
                                    <div className="font-medium text-gray-800 group-hover:text-primary-700">แปลงข้อความเป็นเสียง</div>
                                    <div className="text-xs text-gray-500">สร้างไฟล์เสียงบรรยายธรรมชาติ</div>
                                </div>
                            </button>
                             <button onClick={() => handleToolSelect('image-editor')} className="w-full flex items-center p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all text-left group">
                                <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center mr-3 text-sm">✂️</div>
                                <div>
                                    <div className="font-medium text-gray-800 group-hover:text-primary-700">แก้ไขรูปภาพ</div>
                                    <div className="text-xs text-gray-500">ปรับแต่งรูปภาพด้วย AI</div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Analysis & Utility */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                         <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <span className="text-xl">📊</span> วิเคราะห์และข้อมูล
                        </h3>
                        <div className="space-y-3">
                            <button onClick={() => handleToolSelect('image-analyzer')} className="w-full flex items-center p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all text-left group">
                                <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center mr-3 text-sm">👁️</div>
                                <div>
                                    <div className="font-medium text-gray-800 group-hover:text-primary-700">วิเคราะห์รูปภาพ</div>
                                    <div className="text-xs text-gray-500">ให้ AI อธิบายหรือดึงข้อมูลจากภาพ</div>
                                </div>
                            </button>
                             <button onClick={() => handleToolSelect('map-search')} className="w-full flex items-center p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all text-left group">
                                <div className="w-8 h-8 bg-teal-100 text-teal-600 rounded-lg flex items-center justify-center mr-3 text-sm">🗺️</div>
                                <div>
                                    <div className="font-medium text-gray-800 group-hover:text-primary-700">ค้นหาสถานที่</div>
                                    <div className="text-xs text-gray-500">ข้อมูลพิกัดและรีวิวจาก Maps</div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderActiveTool = useCallback(() => {
        switch (activeTool) {
            case 'image-generator': return <ImageGenerator />;
            case 'thinking-assistant': return <ThinkingAssistant />;
            case 'video-generator': return <VideoGenerator />;
            case 'info-search': return <InfoSearch />;
            case 'image-editor': return <ImageEditor />;
            case 'text-to-speech': return <TextToSpeech />;
            case 'chatbot': return <Chatbot />;
            case 'image-analyzer': return <ImageAnalyzer />;
            case 'map-search': return <MapSearch />;
            default: return renderDashboard();
        }
    }, [activeTool]);

    return (
        <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 flex flex-col shadow-xl lg:shadow-none transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                     <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTool(null)}>
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-800 rounded-lg flex items-center justify-center text-white font-bold text-lg transition-colors duration-500">AI</div>
                        <h1 className="text-xl font-bold text-gray-800 tracking-tight">
                            Super Teacher
                        </h1>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <nav className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-200">
                    <div className="mb-2 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Menu</div>
                    <ul className="space-y-1.5">
                         <li>
                            <button
                                onClick={() => setActiveTool(null)}
                                className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center group border ${
                                    activeTool === null
                                        ? 'bg-primary-50 border-primary-100 text-primary-700 font-semibold shadow-sm'
                                        : 'bg-transparent border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                            >
                                <span className="mr-3 text-xl">🏠</span>
                                <span className="text-sm font-medium">หน้าหลัก (Dashboard)</span>
                            </button>
                        </li>
                        {TOOLS.map((tool) => (
                            <li key={tool.id}>
                                <button
                                    onClick={() => handleToolSelect(tool.id)}
                                    title={tool.description}
                                    className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center group border ${
                                        activeTool === tool.id
                                            ? 'bg-primary-50 border-primary-100 text-primary-700 font-semibold shadow-sm'
                                            : 'bg-transparent border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                                >
                                    <span className={`mr-3 text-xl transition-transform duration-200 ${activeTool === tool.id ? 'scale-110' : 'group-hover:scale-110'}`}>{tool.icon}</span>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">{tool.name}</span>
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>
                <div className="p-4 border-t border-gray-100">
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl border border-primary-100 text-center">
                        <p className="text-xs font-medium text-primary-800 mb-1">Powered by Google Gemini</p>
                        <p className="text-[10px] text-gray-500 mb-2">Supercharge your classroom</p>
                         <p className="text-[10px] text-primary-700 font-bold border-t border-primary-200/50 pt-2">
                            พัฒนาโดย ดร.พัทธโรจน์ กมลโรจน์สิริ
                        </p>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Header */}
                <header className="bg-white/90 backdrop-blur-md px-6 py-4 border-b border-gray-200 z-10 flex items-center justify-between sticky top-0">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={toggleSidebar}
                            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">
                                {activeTool ? TOOLS.find(t => t.id === activeTool)?.name : 'Dashboard'}
                            </h2>
                            {activeTool && (
                                <p className="text-xs text-gray-500 hidden sm:block animate-fade-in">
                                    {TOOLS.find(t => t.id === activeTool)?.description}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Theme Switcher */}
                        <div className="relative">
                            <button 
                                onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors border border-gray-200 flex items-center justify-center"
                                title="เปลี่ยนธีมสี"
                            >
                                <span className="text-lg">🎨</span>
                            </button>
                            {isThemeMenuOpen && (
                                <>
                                    <div 
                                        className="fixed inset-0 z-20"
                                        onClick={() => setIsThemeMenuOpen(false)}
                                    />
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-30 p-2 animate-fade-in">
                                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2">Theme Color</div>
                                        {themes.map((theme) => (
                                            <button
                                                key={theme.key}
                                                onClick={() => {
                                                    setCurrentTheme(theme.key);
                                                    setIsThemeMenuOpen(false);
                                                }}
                                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                                                    currentTheme === theme.key 
                                                        ? 'bg-primary-50 text-primary-700 font-medium' 
                                                        : 'text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                <span className={`w-4 h-4 rounded-full ${theme.color}`}></span>
                                                {theme.name}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-200">
                           <span className="text-sm">👤</span>
                        </div>
                    </div>
                </header>

                {/* Tool Content */}
                <div className="flex-1 overflow-y-auto bg-gray-50 scrollbar-thin scrollbar-thumb-gray-300 flex flex-col">
                    <div className="flex-1">
                        {renderActiveTool()}
                    </div>
                    <footer className="py-4 text-center text-xs text-gray-500 border-t border-gray-100 mx-auto w-full bg-gray-50/50 backdrop-blur-sm">
                        พัฒนาโดย <span className="font-semibold text-primary-600">ดร.พัทธโรจน์ กมลโรจน์สิริ</span>
                    </footer>
                </div>
            </main>
        </div>
    );
};

export default App;