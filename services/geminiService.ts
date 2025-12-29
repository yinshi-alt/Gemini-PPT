
import { GoogleGenAI, Type } from "@google/genai";
import { Slide, SlideLayout } from "../types";

const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export interface OutlineParams {
  topic: string;
  useSearch: boolean;
  docData?: { data: string; mimeType: string };
}

export const generatePresentationOutline = async (params: OutlineParams): Promise<{ slides: Slide[]; sources?: any[] }> => {
  const ai = getAiClient();
  const { topic, useSearch, docData } = params;

  const prompt = `请围绕主题 "${topic}" 生成一份深度且极具视觉冲击力的中文演示文稿大纲，总页数必须在 20 到 25 页之间。
    
    ${docData ? "请参考上传的文档内容进行生成，确保内容的准确性与深度。" : ""}
    ${useSearch ? "请使用联网搜索获取最新的行业动态、数据和事实来增强内容。" : ""}

    设计原则：
    1. **图多文字少**：每页文字必须极度精简，适合大屏展示，避免大段文字。
    2. **高度结构化**：从宏观到微观，分章节进行深度探讨。
    3. **视觉优先**：为每一页提供精准的英文绘画提示词（imagePrompt）。

    每页对象结构：
    1. title: 页面标题
    2. content: Markdown 格式的精简要点（严禁超过 4 个要点，每个要点不超过 15 字）
    3. description: 详细的演讲备注或深度背景
    4. layout: 布局（'title', 'content', 'two-column', 'image-left', 'image-right', 'quote'）
    5. imagePrompt: 针对该页主题的高质量英文视觉描述词。`;

  const parts: any[] = [{ text: prompt }];
  if (docData) {
    parts.push({
      inlineData: {
        data: docData.data,
        mimeType: docData.mimeType
      }
    });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: { parts },
    config: {
      // Added thinkingBudget for complex reasoning over 20+ slides
      thinkingConfig: { thinkingBudget: 32768 },
      tools: useSearch ? [{ googleSearch: {} }] : undefined,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            content: { type: Type.STRING },
            description: { type: Type.STRING },
            layout: { 
              type: Type.STRING, 
              enum: ['title', 'content', 'two-column', 'image-left', 'image-right', 'quote'] 
            },
            imagePrompt: { type: Type.STRING }
          },
          required: ["title", "content", "layout", "imagePrompt", "description"]
        }
      }
    }
  });

  try {
    const raw = response.text;
    if (!raw) throw new Error("AI 未返回内容");
    const slides = JSON.parse(raw).map((s: any, idx: number) => ({
      ...s,
      id: `slide-${Date.now()}-${idx}`
    }));
    
    // 提取搜索来源 - Always extract URLs from groundingChunks if Search is used
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

    return { slides, sources };
  } catch (e) {
    console.error("解析大纲失败", e);
    throw new Error("生成多页大纲时出错，请尝试缩短主题或检查文档格式");
  }
};

export const generateSlideImage = async (prompt: string, size: '1K' | '2K' | '4K'): Promise<string> => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [{ text: `High-end professional slide background, cinematic, minimalistic, professional aesthetics, 4k, ultra-detailed: ${prompt}` }]
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9",
        imageSize: size
      }
    }
  });

  // Extracting image part: iterate through all parts to find the image part
  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  }
  throw new Error("图片生成失败");
};

export const analyzePresentationImage = async (base64Data: string): Promise<string> => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType: 'image/jpeg' } },
        { text: "请用中文详细分析这张图片。请分以下几个板块回复：### 1. 图片内容概述\n### 2. 在演示文稿中的适用场景\n### 3. 设计优化建议\n### 4. 推荐配文（标题与要点）" }
      ]
    },
    config: {
      // Added thinkingBudget for visual analysis tasks
      thinkingConfig: { thinkingBudget: 32768 }
    }
  });
  return response.text || "未能生成分析结果。";
};
