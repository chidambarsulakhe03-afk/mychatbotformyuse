import React, { useState } from 'react';
import { PanelLeft, ChevronDown, Check, Sun, Moon, Trash2 } from 'lucide-react';
import { AVAILABLE_MODELS } from '../../utils/constants';
import { useTheme } from '../../contexts/ThemeContext';

export default function Header({
  onToggleSidebar,
  currentChatTitle,
  selectedModel,
  onSelectModel,
  onClearChat,
  hasMessages,
}) {
  const { theme, toggleTheme } = useTheme();
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);

  const activeModelObj =
    AVAILABLE_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_MODELS[0];

  return (
    <header className="h-14 border-b border-gray-200 dark:border-gray-800/80 bg-white/80 dark:bg-[#212121]/80 backdrop-blur sticky top-0 z-30 flex items-center justify-between px-4">
      {/* Left side: Hamburger button + Current Chat Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Toggle Sidebar"
        >
          <PanelLeft className="w-5 h-5" />
        </button>

        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[200px] md:max-w-md">
          {currentChatTitle || 'New Chat'}
        </h2>
      </div>

      {/* Right side: Model Selector, Theme Toggle, Clear Chat */}
      <div className="flex items-center gap-2">
        {/* Model Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setModelDropdownOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-gray-100 dark:bg-[#2a2a2a] hover:bg-gray-200 dark:hover:bg-[#333333] text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{activeModelObj.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {modelDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setModelDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-64 p-1.5 rounded-xl bg-white dark:bg-[#282828] border border-gray-200 dark:border-gray-700 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase text-gray-400 tracking-wider">
                  Select AI Model (Groq)
                </div>
                {AVAILABLE_MODELS.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      onSelectModel(model.id);
                      setModelDropdownOpen(false);
                    }}
                    className={`w-full flex items-start gap-2.5 p-2 rounded-lg text-left text-xs transition-colors ${
                      selectedModel === model.id
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                        : 'hover:bg-gray-100 dark:hover:bg-[#323232] text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 font-medium">
                        <span>{model.name}</span>
                        {model.isDefault && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">
                        {model.description}
                      </p>
                    </div>
                    {selectedModel === model.id && (
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Clear Chat Button */}
        {hasMessages && (
          <button
            onClick={onClearChat}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Clear conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>
      </div>
    </header>
  );
}
