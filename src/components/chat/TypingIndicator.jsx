import React from 'react';

export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-3 py-2 text-gray-400 dark:text-gray-500">
      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]" />
      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.15s]" />
      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
    </div>
  );
}
