export const VISION_MODEL_ID = 'meta-llama/llama-4-scout-17b-16e-instruct';

export const AVAILABLE_MODELS = [
  {
    id: 'qwen/qwen3.8-27b',
    name: 'Qwen 3.8 27B (Groq)',
    provider: 'Groq',
    description: 'Blazing-fast, ultra-responsive chat on Groq LPUs',
    isDefault: true,
  },
  {
    id: 'openai/gpt-oss-120b',
    name: 'GPT-OSS 120B (Groq)',
    provider: 'Groq',
    description: 'Flagship deep reasoning model on Groq',
    isDefault: false,
  },
  {
    id: 'openai/gpt-oss-20b',
    name: 'GPT-OSS 20B (Groq)',
    provider: 'Groq',
    description: 'Lightweight fast assistant',
    isDefault: false,
  },
  {
    id: VISION_MODEL_ID,
    name: 'Llama 4 Scout (Vision)',
    provider: 'Groq',
    description: 'Analyze images and visual input',
    isDefault: false,
  },
];

export const SUGGESTED_PROMPTS = [
  {
    title: 'Explain a technical concept',
    prompt: 'Explain quantum computing in simple terms for a beginner, with an intuitive analogy.',
    category: 'Learning',
  },
  {
    title: 'Write code & scripts',
    prompt: 'Write a Python FastAPI script that handles file uploads and generates image thumbnails.',
    category: 'Coding',
  },
  {
    title: 'Brainstorm business ideas',
    prompt: 'Brainstorm 5 innovative B2B SaaS startup ideas that leverage AI for workflow automation.',
    category: 'Ideation',
  },
  {
    title: 'Draft email or document',
    prompt: 'Draft a polite and professional follow-up email after a job interview for a Software Engineer position.',
    category: 'Writing',
  },
];

export const APP_CONFIG = {
  name: 'ChatAI',
  version: '1.0.0',
  description: 'Enterprise-grade AI Assistant powered by React, Supabase & Groq',
};
