import React, { useState, useRef, useEffect } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import ChatMessage from '../components/chat/ChatMessage';
import ChatInput from '../components/chat/ChatInput';
import WelcomeScreen from '../components/chat/WelcomeScreen';
import { useConversations } from '../hooks/useConversations';
import { useChat } from '../hooks/useChat';
import { AVAILABLE_MODELS } from '../utils/constants';

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].id);
  const [input, setInput] = useState('');

  // Auto-correct outdated model if it's no longer in AVAILABLE_MODELS
  useEffect(() => {
    if (!AVAILABLE_MODELS.some((m) => m.id === selectedModel)) {
      setSelectedModel(AVAILABLE_MODELS[0].id);
    }
  }, [selectedModel]);

  const {
    conversations,
    currentId,
    setCurrentId,
    createConversation,
    renameConversation,
    deleteConversation,
  } = useConversations();

  const handleConversationCreated = async (title) => {
    return await createConversation(title);
  };

  const {
    messages,
    loading: messagesLoading,
    isStreaming,
    error: chatError,
    sendMessage,
    stopGenerating,
    regenerateMessage,
    clearConversation,
  } = useChat({
    conversationId: currentId,
    onConversationCreated: handleConversationCreated,
    selectedModel,
  });

  const messagesEndRef = useRef(null);

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  // Keyboard shortcut Ctrl+K / Cmd+K for new chat
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        handleNewChat();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNewChat = () => {
    setCurrentId(null);
    setInput('');
  };

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    const msg = input;
    setInput('');
    sendMessage(msg);
  };

  const handleSelectPrompt = (promptText) => {
    sendMessage(promptText);
  };

  const currentChat = conversations.find((c) => c.id === currentId);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-[#212121] text-gray-900 dark:text-gray-100 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        conversations={conversations}
        currentId={currentId}
        onSelectConversation={(id) => setCurrentId(id)}
        onNewChat={handleNewChat}
        onRenameConversation={renameConversation}
        onDeleteConversation={deleteConversation}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Chat Workspace */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative">
        {/* Top Header */}
        <Header
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          currentChatTitle={currentChat?.title}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
          onClearChat={clearConversation}
          hasMessages={messages.length > 0}
        />

        {/* Chat Messages or Welcome Screen */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col">
          {messages.length === 0 ? (
            <WelcomeScreen onSelectPrompt={handleSelectPrompt} />
          ) : (
            <div className="flex-1 pb-4">
              {messages.map((message, index) => {
                const isLastAssistant =
                  message.role === 'assistant' &&
                  index === messages.length - 1;

                return (
                  <ChatMessage
                    key={message.id || index}
                    message={message}
                    onRegenerate={regenerateMessage}
                    isLastAssistant={isLastAssistant}
                    isStreaming={isStreaming && isLastAssistant}
                  />
                );
              })}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>

        {/* Bottom Input Area */}
        <ChatInput
          input={input}
          setInput={setInput}
          onSend={handleSend}
          onStop={stopGenerating}
          isStreaming={isStreaming}
          disabled={messagesLoading}
        />
      </div>
    </div>
  );
}
