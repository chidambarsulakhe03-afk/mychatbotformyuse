import React, { useRef, useEffect } from 'react';
import { ArrowUp, Square } from 'lucide-react';

export default function ChatInput({
  input,
  setInput,
  onSend,
  onStop,
  isStreaming,
  disabled,
}) {
  const textareaRef = useRef(null);

  // Auto-resize textarea height to match content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && input.trim() && !disabled) {
        onSend();
      }
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4">
      <div className="relative flex items-end rounded-2xl bg-gray-100 dark:bg-[#303030] border border-gray-200 dark:border-gray-700/80 shadow-sm focus-within:border-gray-400 dark:focus-within:border-gray-500 transition-all">
        {/* Multiline auto-expanding textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message ChatAI... (Press Enter to send, Shift+Enter for newline)"
          rows={1}
          disabled={disabled}
          className="w-full max-h-[200px] py-3.5 pl-4 pr-14 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-sm md:text-base focus:outline-none resize-none leading-relaxed"
        />

        {/* Action Button: Send or Stop */}
        <div className="absolute right-2.5 bottom-2.5">
          {isStreaming ? (
            <button
              onClick={onStop}
              className="p-2 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow transition-transform active:scale-95"
              title="Stop generation"
            >
              <Square className="w-4 h-4 fill-white" />
            </button>
          ) : (
            <button
              onClick={onSend}
              disabled={!input.trim() || disabled}
              className={`p-2 rounded-xl transition-all shadow ${
                input.trim() && !disabled
                  ? 'bg-black dark:bg-white text-white dark:text-black hover:opacity-90 active:scale-95 cursor-pointer'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-400 dark:text-gray-400 cursor-not-allowed opacity-50'
              }`}
              title="Send message"
            >
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>

      {/* Footer Disclaimer */}
      <p className="mt-2 text-center text-[11px] text-gray-500 dark:text-gray-400">
        ChatAI can produce mistakes. Verify sensitive facts and code. Powered by Groq AI & Supabase.
      </p>
    </div>
  );
}
