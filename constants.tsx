
import React from 'react';
import { Template } from './types';

export const Icons = {
  Sparkles: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
  ),
  Image: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
  ),
  Download: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
  ),
  Layers: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
  ),
  Analyze: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
  ),
  Palette: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.607-.677 1.607-1.607 0-.442-.178-.866-.502-1.19-.324-.324-.502-.748-.502-1.19 0-.93.753-1.683 1.683-1.683h2.527C19.414 16.33 22 13.744 22 10.5 22 5.81 17.5 2 12 2Z"/></svg>
  )
};

export const TEMPLATES: Template[] = [
  {
    id: 'modern',
    name: '简约现代',
    bgClass: 'bg-white',
    textClass: 'text-slate-900',
    accentClass: 'bg-indigo-600',
    borderClass: 'border-slate-100',
    fontFamily: 'sans-serif'
  },
  {
    id: 'business',
    name: '商务经典',
    bgClass: 'bg-slate-50',
    textClass: 'text-blue-950',
    accentClass: 'bg-blue-800',
    borderClass: 'border-blue-200',
    fontFamily: 'serif'
  },
  {
    id: 'tech',
    name: '科技未来',
    bgClass: 'bg-gray-950',
    textClass: 'text-cyan-50',
    accentClass: 'bg-cyan-500',
    borderClass: 'border-cyan-900',
    fontFamily: 'monospace'
  },
  {
    id: 'vibrant',
    name: '创意多姿',
    bgClass: 'bg-orange-50',
    textClass: 'text-orange-950',
    accentClass: 'bg-orange-500',
    borderClass: 'border-orange-200',
    fontFamily: 'sans-serif'
  }
];
