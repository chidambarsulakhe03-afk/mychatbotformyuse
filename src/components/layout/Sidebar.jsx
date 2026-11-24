import React, { useState } from 'react';
import {
  Plus,
  MessageSquare,
  Trash2,
  Edit2,
  Check,
  X,
  LogOut,
  Moon,
  Sun,
  Bot,
  PanelLeftClose,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { groupConversationsByDate } from '../../utils/formatters';

export default function Sidebar({
  conversations,
  currentId,
  onSelectConversation,
  onNewChat,
  onRenameConversation,
  onDeleteConversation,
  isOpen,
  onClose,
}) {
  const { user, profile } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const grouped = groupConversationsByDate(conversations);

  const startEditing = (conv, e) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveRename = async (id, e) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      await onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelRename = (e) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const confirmDelete = async (id, e) => {
    e.stopPropagation();
    await onDeleteConversation(id);
    setDeletingId(null);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 md:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col w-72 bg-[#f9f9f9] dark:bg-[#171717] border-r border-gray-200 dark:border-gray-800 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Header / New Chat */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-800/80">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
              <span className="text-base tracking-tight">ChatAI</span>
            </div>

            {/* Close button on mobile */}
            <button
              onClick={onClose}
              className="md:hidden p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800"
            >
              <PanelLeftClose className="w-5 h-5" />
            </button>
          </div>

          {/* New Chat Button */}
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-white dark:bg-[#212121] border border-gray-200 dark:border-gray-700/80 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] text-gray-900 dark:text-gray-100 font-medium text-sm shadow-sm transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>New chat</span>
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">Ctrl+K</span>
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 scrollbar-thin">
          {conversations.length === 0 ? (
            <div className="px-3 py-8 text-center text-xs text-gray-400 dark:text-gray-500">
              No conversations yet. Start a new chat!
            </div>
          ) : (
            grouped.map(([groupTitle, items]) => (
              <div key={groupTitle} className="space-y-1">
                <div className="px-3 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  {groupTitle}
                </div>
                {items.map((conv) => {
                  const isActive = conv.id === currentId;
                  const isEditing = editingId === conv.id;
                  const isDeleting = deletingId === conv.id;

                  return (
                    <div
                      key={conv.id}
                      onClick={() => {
                        onSelectConversation(conv.id);
                        if (window.innerWidth < 768) onClose();
                      }}
                      className={`group relative flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-gray-200 dark:bg-[#282828] text-gray-900 dark:text-white font-medium'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#212121]'
                      }`}
                    >
                      {/* Title or Edit Input */}
                      {isEditing ? (
                        <div
                          className="flex items-center gap-1.5 w-full"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(conv.id, e);
                              if (e.key === 'Escape') handleCancelRename(e);
                            }}
                            autoFocus
                            className="w-full px-2 py-0.5 text-xs bg-white dark:bg-[#1a1a1a] border border-emerald-500 rounded text-gray-900 dark:text-white focus:outline-none"
                          />
                          <button
                            onClick={(e) => handleSaveRename(conv.id, e)}
                            className="p-1 hover:text-emerald-500"
                            title="Save"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={handleCancelRename}
                            className="p-1 hover:text-red-500"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : isDeleting ? (
                        <div
                          className="flex items-center justify-between w-full text-xs text-red-500"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span>Delete chat?</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => confirmDelete(conv.id, e)}
                              className="px-1.5 py-0.5 rounded bg-red-600 text-white font-medium hover:bg-red-700"
                            >
                              Yes
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingId(null);
                              }}
                              className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                            >
                              No
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <MessageSquare className="w-4 h-4 flex-shrink-0 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200" />
                            <span className="truncate text-xs md:text-sm">
                              {conv.title || 'Untitled Chat'}
                            </span>
                          </div>

                          {/* Action Buttons (Rename / Delete) */}
                          <div
                            className={`flex items-center gap-1 ${
                              isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                            } transition-opacity`}
                          >
                            <button
                              onClick={(e) => startEditing(conv, e)}
                              className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700"
                              title="Rename"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingId(conv.id);
                              }}
                              className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-gray-300 dark:hover:bg-gray-700"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* User Profile & Settings Section */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-800/80 bg-gray-50/50 dark:bg-[#121212]/50">
          <div className="flex items-center justify-between">
            {/* User Info */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold shadow-sm flex-shrink-0">
                {profile?.username ? profile.username.slice(0, 2).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-900 dark:text-gray-200 truncate">
                  {profile?.username || user?.email || 'User'}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
                  {user?.email || 'Active Session'}
                </p>
              </div>
            </div>

            {/* Action: Theme Toggle */}
            <div className="flex items-center gap-1">
              <button
                onClick={toggleTheme}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-700" />
                )}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
