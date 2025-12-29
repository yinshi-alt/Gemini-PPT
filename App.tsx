
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Slide, PresentationDeck, ImageSize, GenerationState, Template } from './types';
import { Icons, TEMPLATES } from './constants';
import SlideRenderer from './components/SlideRenderer';
import * as gemini from './services/geminiService';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    // Fixed: All declarations of 'aistudio' must have identical modifiers. Adding readonly to match environment.
    readonly aistudio: AIStudio;
  }
}

const App: React.FC = () => {
  const [deck, setDeck] = useState<PresentationDeck | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [prompt, setPrompt] = useState('');
  const [genState, setGenState] = useState<GenerationState>({ isGenerating: false, status: '', error: null });
  const [selectedImageSize, setSelectedImageSize] = useState<ImageSize>('1K');
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [currentTemplate, setCurrentTemplate] = useState<Template>(TEMPLATES[0]);
  
  // 新增功能状态
  const [useSearch, setUseSearch] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; data: string; mimeType: string } | null>(null);
  const [searchSources, setSearchSources] = useState<any[] | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const activeSlide = deck?.slides[activeSlideIndex] || null;

  useEffect(() => {
    const initApiKey = async () => {
      try {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          await window.aistudio.openSelectKey();
        }
      } catch (e) {
        console.error("Initial API key check failed", e);
      }
    };
    initApiKey();
  }, []);

  const ensureApiKey = async () => {
    try {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
      }
      return true;
    } catch (e) {
      console.error("API 密钥选择失败", e);
      return false;
    }
  };

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setAttachedFile({
        name: file.name,
        data: base64,
        mimeType: file.type || 'application/pdf'
      });
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateDeck = async () => {
    if (!prompt.trim()) return;
    const canProceed = await ensureApiKey();
    if (!canProceed) return;

    setGenState({ isGenerating: true, status: '正在构思深度文稿结构 (使用 AI 联网与文档增强)...', error: null });
    
    try {
      const { slides, sources } = await gemini.generatePresentationOutline({
        topic: prompt,
        useSearch,
        docData: attachedFile ? { data: attachedFile.data, mimeType: attachedFile.mimeType } : undefined
      });
      
      setDeck({
        id: `deck-${Date.now()}`,
        title: prompt,
        templateId: currentTemplate.id,
        slides
      });
      setSearchSources(sources || null);
      setActiveSlideIndex(0);
      setGenState({ isGenerating: false, status: '', error: null });
    } catch (error: any) {
      setGenState({ isGenerating: false, status: '', error: error.message || '生成失败，请重试' });
    }
  };

  const handleGenerateImage = async () => {
    if (!activeSlide) return;
    const canProceed = await ensureApiKey();
    if (!canProceed) return;

    setGenState({ isGenerating: true, status: `正在生成视觉素材...`, error: null });
    
    try {
      const imageUrl = await gemini.generateSlideImage(activeSlide.imagePrompt || activeSlide.title, selectedImageSize);
      setDeck(prev => {
        if (!prev) return null;
        const newSlides = [...prev.slides];
        newSlides[activeSlideIndex] = { ...newSlides[activeSlideIndex], imageUrl };
        return { ...prev, slides: newSlides };
      });
      setGenState({ isGenerating: false, status: '', error: null });
    } catch (error: any) {
      setGenState({ isGenerating: false, status: '', error: error.message || '图片生成失败' });
      if (error.message?.includes("Requested entity was not found")) {
        await window.aistudio.openSelectKey();
      }
    }
  };

  const handleImageAnalysis = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const canProceed = await ensureApiKey();
    if (!canProceed) return;

    setGenState({ isGenerating: true, status: '正在分析图片视觉资产...', error: null });
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        const result = await gemini.analyzePresentationImage(base64);
        setAnalysisResult(result);
        setGenState({ isGenerating: false, status: '', error: null });
      } catch (error: any) {
        setGenState({ isGenerating: false, status: '', error: error.message || '分析失败' });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white text-gray-900 font-sans">
      <header className="bg-white/80 backdrop-blur-md border-b px-6 py-4 flex flex-col md:flex-row items-center justify-between shadow-sm z-20 gap-4">
        <div className="flex items-center gap-3 shrink-0">
          <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-100">
            <Icons.Sparkles />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-gray-900 leading-none">Gemini PPT</h1>
            <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest mt-1">Multi-Modal AI</p>
          </div>
        </div>
        
        <div className="flex-1 max-w-2xl w-full flex flex-col gap-2">
          <div className="relative group">
            <input 
              type="text"
              placeholder="输入主题，例如：'2024年全球可再生能源发展趋势深度报告'..."
              className="w-full pl-5 pr-32 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:bg-white focus:border-indigo-400 transition-all outline-none text-sm placeholder:text-gray-400"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerateDeck()}
            />
            <div className="absolute right-1.5 top-1.5 bottom-1.5 flex gap-2">
               <button 
                onClick={handleGenerateDeck}
                disabled={genState.isGenerating || !prompt}
                className="px-4 bg-indigo-600 text-white rounded-xl shadow-md hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                <Icons.Sparkles />
                <span className="text-xs font-bold whitespace-nowrap">深度生成</span>
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-4 px-2">
             <label className="flex items-center gap-2 cursor-pointer group">
               <div className={`w-8 h-4 rounded-full transition-all relative ${useSearch ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                 <input type="checkbox" className="hidden" checked={useSearch} onChange={(e) => setUseSearch(e.target.checked)} />
                 <div className={`absolute top-0.5 bottom-0.5 w-3 bg-white rounded-full transition-all ${useSearch ? 'left-4.5 shadow-sm' : 'left-0.5'}`}></div>
               </div>
               <span className={`text-[11px] font-bold ${useSearch ? 'text-indigo-600' : 'text-gray-400'}`}>联网搜索增强</span>
             </label>

             <div className="flex items-center gap-2">
               <button 
                onClick={() => docInputRef.current?.click()}
                className={`flex items-center gap-2 px-3 py-1 rounded-lg border text-[11px] font-bold transition-all ${attachedFile ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-gray-200 text-gray-400 hover:border-indigo-300'}`}
               >
                 <Icons.Layers />
                 {attachedFile ? attachedFile.name : '上传参考文档'}
               </button>
               {attachedFile && (
                 <button onClick={() => setAttachedFile(null)} className="text-[10px] text-red-400 font-bold hover:underline">清除</button>
               )}
               <input type="file" className="hidden" ref={docInputRef} accept=".pdf,.doc,.docx,.txt" onChange={handleDocUpload} />
             </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 text-[11px] font-bold text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
          >
            <Icons.Analyze />
            智能识图
          </button>
          <input type="file" className="hidden" ref={fileInputRef} accept="image/*" onChange={handleImageAnalysis} />
          <button className="flex items-center gap-2 px-4 py-2 text-[11px] font-bold text-white bg-gray-900 rounded-xl hover:bg-black shadow-lg">
            <Icons.Download />
            导出 PPTX
          </button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        <aside className="w-72 border-r bg-gray-50/50 flex flex-col z-10 shrink-0">
          <div className="p-5 border-b bg-white flex items-center justify-between">
            <h2 className="font-black text-xs uppercase tracking-widest text-gray-400">幻灯片预览</h2>
            <span className="text-[10px] font-black px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg">
              {deck?.slides.length || 0} P
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
            {!deck ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                  <Icons.Layers />
                </div>
                <p className="text-xs text-gray-400 font-medium px-4">输入主题并开启 AI 深度模式开启您的创作</p>
              </div>
            ) : (
              deck.slides.map((s, idx) => (
                <button 
                  key={s.id}
                  onClick={() => setActiveSlideIndex(idx)}
                  className={`w-full group text-left rounded-xl overflow-hidden transition-all duration-200 border ${
                    activeSlideIndex === idx 
                    ? 'ring-2 ring-indigo-500 border-indigo-500 shadow-lg bg-white translate-x-1' 
                    : 'border-transparent opacity-60 hover:opacity-100 hover:bg-white'
                  }`}
                >
                  <div className="aspect-[16/9] bg-gray-200 flex items-center justify-center overflow-hidden">
                    {s.imageUrl ? (
                      <img src={s.imageUrl} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <span className="text-[9px] text-gray-400 font-black italic">P{idx + 1}</span>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-[10px] font-bold truncate text-gray-900">{s.title || `第 ${idx + 1} 页`}</p>
                  </div>
                </button>
              ))
            )}
          </div>

          {searchSources && (
            <div className="p-4 border-t bg-indigo-50/50">
              <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                <Icons.Sparkles /> 联网参考来源
              </h3>
              <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                {searchSources.map((source, i) => (
                  <a 
                    key={i} 
                    href={source.web?.uri || source.maps?.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block text-[9px] text-indigo-600 hover:underline truncate"
                  >
                    • {source.web?.title || source.maps?.title || '参考链接'}
                  </a>
                ))}
              </div>
            </div>
          )}
        </aside>

        <section className="flex-1 flex flex-col relative bg-gray-100/50">
          {genState.isGenerating && (
            <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-500">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-indigo-600">
                  <Icons.Sparkles />
                </div>
              </div>
              <p className="text-lg font-black text-gray-900 mt-6 tracking-tight">{genState.status}</p>
              <p className="text-xs text-gray-400 mt-2">Gemini 正在根据参考资料构建您的深度故事线...</p>
            </div>
          )}

          <div className="flex-1 flex flex-col p-8 overflow-y-auto custom-scrollbar">
            {activeSlide ? (
              <div className="max-w-5xl mx-auto w-full space-y-8">
                <div className="aspect-[16/9] w-full slide-shadow">
                  <SlideRenderer slide={activeSlide} template={currentTemplate} />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-20">
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Icons.Image /></div>
                      <h3 className="font-black text-xs uppercase tracking-wider">4K 视觉生成</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-2">
                        {(['1K', '2K', '4K'] as ImageSize[]).map((size) => (
                          <button
                            key={size}
                            onClick={() => setSelectedImageSize(size)}
                            className={`py-1.5 text-[9px] font-black rounded-lg border transition-all ${
                              selectedImageSize === size ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 text-gray-400'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                      <button onClick={handleGenerateImage} disabled={genState.isGenerating} className="w-full py-3 bg-gray-900 text-white font-black text-[11px] rounded-xl hover:bg-black transition-all">
                        {activeSlide.imageUrl ? '更换配图' : '生成视觉'}
                      </button>
                      <div className="p-3 bg-gray-50 rounded-lg text-[9px] text-gray-400 leading-relaxed overflow-hidden">
                        <span className="font-black text-gray-500 uppercase mr-1">Hint:</span>
                        {activeSlide.imagePrompt}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Icons.Layers /></div>
                      <h3 className="font-black text-xs uppercase tracking-wider">精简内容</h3>
                    </div>
                    <div className="space-y-3">
                      <input 
                        type="text" 
                        value={activeSlide.title}
                        onChange={(e) => {
                           setDeck(prev => {
                             if (!prev) return null;
                             const slides = [...prev.slides];
                             slides[activeSlideIndex] = { ...slides[activeSlideIndex], title: e.target.value };
                             return { ...prev, slides };
                           });
                        }}
                        className="w-full p-3 border border-gray-100 rounded-lg bg-gray-50 text-xs font-bold focus:outline-indigo-300"
                      />
                      <textarea 
                        rows={4}
                        value={activeSlide.content}
                        onChange={(e) => {
                           setDeck(prev => {
                             if (!prev) return null;
                             const slides = [...prev.slides];
                             slides[activeSlideIndex] = { ...slides[activeSlideIndex], content: e.target.value };
                             return { ...prev, slides };
                           });
                        }}
                        className="w-full p-3 border border-gray-100 rounded-lg bg-gray-50 text-[11px] leading-relaxed font-mono focus:outline-indigo-300"
                      />
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Icons.Palette /></div>
                      <h3 className="font-black text-xs uppercase tracking-wider">风格切换</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {TEMPLATES.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setCurrentTemplate(t)}
                          className={`flex flex-col items-center p-2 rounded-xl border transition-all ${
                            currentTemplate.id === t.id ? 'bg-orange-50 border-orange-200 ring-1 ring-orange-200' : 'bg-white border-gray-100 hover:border-orange-100'
                          }`}
                        >
                          <div className={`w-full aspect-video rounded border ${t.bgClass} mb-1 shadow-sm`}></div>
                          <span className="text-[9px] font-black text-gray-500 uppercase">{t.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-24 h-24 bg-indigo-50 text-indigo-200 rounded-full flex items-center justify-center mb-8">
                  <Icons.Sparkles />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">AI 增强深度 PPT 创作</h2>
                <p className="text-gray-400 max-w-sm text-sm font-medium">
                  支持上传 PDF/Word 资料，结合联网搜索功能，生成 20+ 页图文并茂的专业演示文稿。
                </p>
                <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-sm">
                   <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                      <div className="text-indigo-600 mb-2"><Icons.Layers /></div>
                      <p className="text-[10px] font-black uppercase text-gray-400 mb-1">文档参考</p>
                      <p className="text-[11px] text-gray-600">上传您的文档作为 AI 创作背景</p>
                   </div>
                   <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                      <div className="text-indigo-600 mb-2"><Icons.Sparkles /></div>
                      <p className="text-[10px] font-black uppercase text-gray-400 mb-1">实时搜索</p>
                      <p className="text-[11px] text-gray-600">接入 Google Search 获取最新数据</p>
                   </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {analysisResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-gray-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[32px] shadow-2xl max-w-2xl w-full flex flex-col max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <Icons.Analyze /> 视觉分析报告
              </h3>
              <button onClick={() => setAnalysisResult(null)} className="font-bold p-2 hover:bg-gray-200 rounded-full transition-all">✕</button>
            </div>
            <div className="p-8 overflow-y-auto custom-scrollbar prose prose-sm max-w-none">
               {analysisResult.split('\n').map((line, i) => {
                 if (line.startsWith('###')) return <h4 key={i} className="text-indigo-600 font-black mt-4 mb-2 border-l-4 border-indigo-600 pl-4">{line.replace('###', '')}</h4>;
                 if (line.trim().startsWith('-') || line.trim().startsWith('*')) return <li key={i} className="ml-4 text-gray-600 font-medium mb-1">{line.replace(/^[-\*\s]+/, '')}</li>;
                 return <p key={i} className="mb-2 text-gray-600 leading-relaxed">{line}</p>;
               })}
            </div>
            <div className="p-6 border-t flex justify-end">
              <button onClick={() => setAnalysisResult(null)} className="px-10 py-3 bg-gray-900 text-white font-black rounded-xl hover:bg-black transition-all shadow-lg">确定</button>
            </div>
          </div>
        </div>
      )}

      {genState.error && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60] bg-red-600 text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <p className="font-bold text-xs">{genState.error}</p>
          <button onClick={() => setGenState(s => ({ ...s, error: null }))} className="p-1 hover:opacity-50">✕</button>
        </div>
      )}
    </div>
  );
};

export default App;
