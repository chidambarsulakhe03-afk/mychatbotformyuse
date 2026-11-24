import React, { useState, useEffect } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-yaml';
import { Check, Copy } from 'lucide-react';

export default function CodeBlock({ language = 'text', value = '' }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Prism.highlightAll();
  }, [value, language]);

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const validLang = Prism.languages[language] ? language : 'text';

  return (
    <div className="relative my-4 rounded-xl overflow-hidden border border-gray-700/60 bg-[#1e1e1e] text-gray-100 shadow-md">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] text-xs font-sans text-gray-300 border-b border-gray-700/50">
        <span className="font-mono uppercase tracking-wider text-gray-400">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-gray-300 hover:text-white hover:bg-gray-700/60 transition-colors"
          title="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>

      {/* Syntax Highlighted Code Content */}
      <div className="p-4 overflow-x-auto text-sm font-mono leading-relaxed">
        <pre className={`language-${validLang} !m-0 !p-0 !bg-transparent`}>
          <code className={`language-${validLang}`}>{value}</code>
        </pre>
      </div>
    </div>
  );
}
