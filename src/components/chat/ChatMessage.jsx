import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from './CodeBlock';
import { Copy, Check, RotateCw, Bot, User, AlertCircle, FileText, Image } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function ChatMessage({
  message,
  onRegenerate,
  isLastAssistant,
  isStreaming,
}) {
  const { user, profile } = useAuth();
  const [copied, setCopied] = useState(false);

  const isUser = message.role === 'user';
  const isError = message.isError;

  const handleCopyMessage = async () => {
    if (!message.content) return;
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  return (
    <div
      className={`group w-full py-6 px-4 md:px-6 transition-colors ${
        isUser
          ? 'bg-transparent'
          : 'bg-gray-50/70 dark:bg-[#1a1a1a]/40 border-y border-gray-100/60 dark:border-gray-800/40'
      }`}
    >
      <div className="max-w-3xl mx-auto flex gap-4 md:gap-6 items-start">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm font-medium text-xs">
              {profile?.username ? (
                profile.username.slice(0, 2).toUpperCase()
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>
          ) : (
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm ${
                isError
                  ? 'bg-red-500'
                  : 'bg-emerald-600 dark:bg-emerald-500'
              }`}
            >
              {isError ? (
                <AlertCircle className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>
          )}
        </div>

        {/* Message Body */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header Role and Time */}
          <div className="flex items-center justify-between">
            <span className="font-semibold text-xs tracking-wide text-gray-900 dark:text-gray-200">
              {isUser ? profile?.username || 'You' : 'ChatAI'}
            </span>
          </div>

          {/* Content */}
          <div className="prose dark:prose-invert max-w-none text-sm md:text-base leading-relaxed text-gray-800 dark:text-gray-100 break-words">
            {isUser ? (
              <>
                {message.content && <p className="whitespace-pre-wrap">{message.content}</p>}
                {message.attachments?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.attachments.map((attachment, index) => (
                      <div
                        key={`${attachment.name}-${index}`}
                        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2 text-xs dark:border-gray-700 dark:bg-gray-800/70"
                      >
                        {attachment.preview ? (
                          <img
                            src={attachment.preview}
                            alt={attachment.name}
                            className="h-12 w-12 rounded object-cover"
                          />
                        ) : attachment.type?.startsWith('image/') ? (
                          <Image className="h-4 w-4" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                        <span className="max-w-[200px] truncate">{attachment.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      const codeContent = String(children).replace(/\n$/, '');

                      if (!inline && match) {
                        return (
                          <CodeBlock
                            language={match[1]}
                            value={codeContent}
                          />
                        );
                      } else if (!inline && codeContent.includes('\n')) {
                        return (
                          <CodeBlock
                            language="text"
                            value={codeContent}
                          />
                        );
                      }

                      return (
                        <code
                          className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-pink-600 dark:text-pink-400 font-mono text-sm"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                    table({ children }) {
                      return (
                        <div className="overflow-x-auto my-4 rounded-lg border border-gray-200 dark:border-gray-700">
                          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                            {children}
                          </table>
                        </div>
                      );
                    },
                    th({ children }) {
                      return (
                        <th className="px-3 py-2 bg-gray-100 dark:bg-gray-800 font-semibold text-left">
                          {children}
                        </th>
                      );
                    },
                    td({ children }) {
                      return (
                        <td className="px-3 py-2 border-t border-gray-100 dark:border-gray-800">
                          {children}
                        </td>
                      );
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>

                {/* Animated cursor while streaming */}
                {message.isStreaming && (
                  <span className="inline-block w-2 h-4 ml-1 align-middle bg-emerald-500 animate-pulse-fast rounded-sm" />
                )}
              </div>
            )}
          </div>

          {/* Action Toolbar (Copy, Regenerate) */}
          {!isUser && !message.isStreaming && (
            <div className="pt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-gray-500 dark:text-gray-400 text-xs">
              {/* Copy Message */}
              <button
                onClick={handleCopyMessage}
                className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                title="Copy response"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-500">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              {/* Regenerate Button (available on last assistant message) */}
              {isLastAssistant && (
                <button
                  onClick={() => onRegenerate(message.id)}
                  disabled={isStreaming}
                  className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                  title="Regenerate response"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Regenerate</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
