import React from 'react';
import { Sparkles, Compass, Code, Lightbulb, PenTool } from 'lucide-react';
import { SUGGESTED_PROMPTS } from '../../utils/constants';

const categoryIcons = {
  Learning: Compass,
  Coding: Code,
  Ideation: Lightbulb,
  Writing: PenTool,
};

export default function WelcomeScreen({ onSelectPrompt }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-3xl mx-auto text-center">
      {/* Hero Badge */}
      <div className="w-16 h-16 mb-6 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white">
        <Sparkles className="w-8 h-8" />
      </div>

      <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
        What can I help with today?
      </h1>
      <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 max-w-md mb-8">
        Ask anything, generate code, explore ideas, or analyze text with high-speed Groq AI inference.
      </p>

      {/* Suggested Prompts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full text-left">
        {SUGGESTED_PROMPTS.map((item, idx) => {
          const Icon = categoryIcons[item.category] || Sparkles;
          return (
            <button
              key={idx}
              onClick={() => onSelectPrompt(item.prompt)}
              className="group p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-[#282828]/50 hover:bg-gray-100 dark:hover:bg-[#303030] hover:border-gray-300 dark:hover:border-gray-700 transition-all text-left shadow-sm hover:shadow"
            >
              <div className="flex items-center gap-2 mb-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <Icon className="w-3.5 h-3.5" />
                <span>{item.title}</span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">
                {item.prompt}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
