
import React from 'react';
import { Slide, Template } from '../types';

interface SlideRendererProps {
  slide: Slide;
  template: Template;
}

const SlideRenderer: React.FC<SlideRendererProps> = ({ slide, template }) => {
  const renderLayout = () => {
    const commonPadding = "p-10 md:p-14";
    const titleStyle = `text-4xl md:text-5xl font-bold mb-8 ${template.textClass}`;
    const textStyle = `text-lg md:text-xl leading-relaxed whitespace-pre-wrap ${template.textClass} opacity-90`;

    switch (slide.layout) {
      case 'title':
        return (
          <div className={`flex flex-col items-center justify-center h-full text-center ${commonPadding} ${template.bgClass}`}>
            <h1 className={`${titleStyle} mb-6 tracking-tight`}>{slide.title}</h1>
            <div className={`w-24 h-1.5 ${template.accentClass} mb-8 rounded-full`}></div>
            <div className={textStyle}>
              {slide.content.replace(/^[#\-\*\s]+/, '')}
            </div>
          </div>
        );
      case 'content':
        return (
          <div className={`flex flex-col h-full ${commonPadding} ${template.bgClass}`}>
            <h2 className={`${titleStyle} border-b ${template.borderClass} pb-6 mb-8`}>{slide.title}</h2>
            <div className={`flex-1 overflow-auto ${textStyle}`}>
              {slide.content}
            </div>
          </div>
        );
      case 'two-column':
        return (
          <div className={`flex flex-col h-full ${commonPadding} ${template.bgClass}`}>
            <h2 className={`${titleStyle} border-b ${template.borderClass} pb-6 mb-8`}>{slide.title}</h2>
            <div className="flex-1 grid grid-cols-2 gap-12 overflow-hidden">
              <div className={textStyle}>{slide.content}</div>
              <div className={`${textStyle} p-6 rounded-xl border ${template.borderClass} bg-black/5`}>
                {slide.secondaryContent || slide.description || "补充详细数据与分析..."}
              </div>
            </div>
          </div>
        );
      case 'image-left':
      case 'image-right':
        const isLeft = slide.layout === 'image-left';
        return (
          <div className={`flex h-full ${template.bgClass} overflow-hidden ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}>
            <div className={`w-1/2 relative bg-black/5 flex items-center justify-center`}>
              {slide.imageUrl ? (
                <img src={slide.imageUrl} alt={slide.title} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className={`p-8 text-center text-sm italic opacity-40 ${template.textClass}`}>
                   正在等待 AI 生成视觉素材...
                </div>
              )}
            </div>
            <div className={`w-1/2 ${commonPadding} flex flex-col`}>
              <h2 className={titleStyle}>{slide.title}</h2>
              <div className={`flex-1 overflow-auto ${textStyle}`}>
                {slide.content}
              </div>
            </div>
          </div>
        );
      case 'quote':
        return (
          <div className={`flex flex-col items-center justify-center h-full ${commonPadding} ${template.accentClass} text-white`}>
            <div className="text-7xl mb-6 opacity-40 font-serif">"</div>
            <blockquote className="text-3xl font-medium italic text-center leading-relaxed mb-8 max-w-3xl">
              {slide.content.replace(/^["'“”]|["'“”]$/g, '')}
            </blockquote>
            <div className="w-16 h-1 bg-white/40 mb-4"></div>
            <cite className="text-xl font-bold">— {slide.title}</cite>
          </div>
        );
      default:
        return <div>布局不支持</div>;
    }
  };

  return (
    <div className={`w-full h-full transition-all duration-500 rounded-2xl shadow-2xl border ${template.borderClass} overflow-hidden`}>
      {renderLayout()}
    </div>
  );
};

export default SlideRenderer;
