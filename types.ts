
export type SlideLayout = 'title' | 'content' | 'two-column' | 'image-left' | 'image-right' | 'quote';

export interface Template {
  id: string;
  name: string;
  bgClass: string;
  textClass: string;
  accentClass: string;
  fontFamily: string;
  borderClass: string;
}

export interface Slide {
  id: string;
  title: string;
  content: string; // Markdown formatted bullet points
  description?: string; // Detailed speaker notes/description
  secondaryContent?: string;
  layout: SlideLayout;
  imageUrl?: string;
  imagePrompt?: string;
}

export interface PresentationDeck {
  id: string;
  title: string;
  templateId: string;
  slides: Slide[];
}

export type ImageSize = '1K' | '2K' | '4K';

export interface GenerationState {
  isGenerating: boolean;
  status: string;
  error: string | null;
}
