import React, { useRef, useEffect, useState } from 'react';
import { AlertCircle, ArrowUp, FileText, Image, Paperclip, Square, X } from 'lucide-react';

export default function ChatInput({
  input,
  setInput,
  onSend,
  onStop,
  attachments,
  onAddFiles,
  onRemoveAttachment,
  isStreaming,
  disabled,
}) {
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const [uploadError, setUploadError] = useState('');
  const [isAddingFiles, setIsAddingFiles] = useState(false);

  // Auto-resize textarea height to match content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleFilesSelected = async (files) => {
    if (!files.length || isAddingFiles) return;
    setUploadError('');
    setIsAddingFiles(true);
    try {
      const error = await onAddFiles(files);
      if (error) setUploadError(error);
    } catch (error) {
      setUploadError(error.message || 'Could not add the selected files.');
    } finally {
      setIsAddingFiles(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    if (!isStreaming && !disabled) {
      handleFilesSelected(Array.from(event.dataTransfer.files));
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && (input.trim() || attachments.length) && !disabled) {
        onSend();
      }
    }
  };

  return (
    <div
      className="w-full max-w-3xl mx-auto px-4 pb-4"
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      <div className="relative flex items-end rounded-2xl bg-gray-100 dark:bg-[#303030] border border-gray-200 dark:border-gray-700/80 shadow-sm focus-within:border-gray-400 dark:focus-within:border-gray-500 transition-all">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,.txt,.md,.csv,.json,.js,.jsx,.ts,.tsx,.py,.java,.c,.cpp,.h,.cs,.go,.rs,.php,.rb,.html,.css,.scss,.sql,.sh,.yaml,.yml,.xml,.toml,.ini,.env,.log,.vue,.svelte"
          className="hidden"
          onChange={(event) => handleFilesSelected(Array.from(event.target.files || []))}
          disabled={disabled || isStreaming || isAddingFiles}
        />
        {attachments.length > 0 && (
          <div className="absolute bottom-full left-0 right-0 mb-2 flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex max-w-full items-center gap-2 rounded-xl border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 shadow-sm dark:border-gray-700 dark:bg-[#282828] dark:text-gray-200"
              >
                {attachment.type.startsWith('image/') && attachment.preview ? (
                  <img
                    src={attachment.preview}
                    alt=""
                    className="h-8 w-8 rounded object-cover"
                  />
                ) : attachment.type.startsWith('image/') ? (
                  <Image className="h-4 w-4 shrink-0" />
                ) : (
                  <FileText className="h-4 w-4 shrink-0" />
                )}
                <span className="max-w-[180px] truncate">{attachment.name}</span>
                <button
                  type="button"
                  onClick={() => onRemoveAttachment(attachment.id)}
                  disabled={isStreaming}
                  className="rounded p-0.5 hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-700"
                  aria-label={`Remove ${attachment.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        {/* Multiline auto-expanding textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message ChatAI... (Enter to send, Shift+Enter for newline)"
          rows={1}
          disabled={disabled || isAddingFiles}
          className="w-full max-h-[200px] py-3.5 pl-4 pr-24 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-sm md:text-base focus:outline-none resize-none leading-relaxed"
        />

        {/* Action Button: Send or Stop */}
        <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1">
          {!isStreaming && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isAddingFiles}
              className="p-2 rounded-xl text-gray-500 hover:bg-gray-200 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-700"
              title="Attach images or code/text files"
              aria-label="Attach images or code/text files"
            >
              <Paperclip className="w-4 h-4" />
            </button>
          )}
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
              disabled={(!input.trim() && attachments.length === 0) || disabled || isAddingFiles}
              className={`p-2 rounded-xl transition-all shadow ${
                (input.trim() || attachments.length > 0) && !disabled && !isAddingFiles
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

      {uploadError && (
        <p role="alert" className="mt-2 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {uploadError}
        </p>
      )}

      {/* Footer Disclaimer */}
      <p className="mt-2 text-center text-[11px] text-gray-500 dark:text-gray-400">
        ChatAI can produce mistakes. Verify sensitive facts and code. Powered by Groq AI & Supabase.
      </p>
    </div>
  );
}
