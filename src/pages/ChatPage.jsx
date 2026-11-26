import React, { useState, useRef, useEffect } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import ChatMessage from '../components/chat/ChatMessage';
import ChatInput from '../components/chat/ChatInput';
import WelcomeScreen from '../components/chat/WelcomeScreen';
import { useConversations } from '../hooks/useConversations';
import { useChat } from '../hooks/useChat';
import { AVAILABLE_MODELS, VISION_MODEL_ID } from '../utils/constants';

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const TEXT_FILE_EXTENSIONS = new Set([
  '.txt', '.md', '.csv', '.json', '.js', '.jsx', '.ts', '.tsx', '.py',
  '.java', '.c', '.cpp', '.h', '.cs', '.go', '.rs', '.php', '.rb',
  '.html', '.css', '.scss', '.sql', '.sh', '.yaml', '.yml', '.xml',
  '.toml', '.ini', '.env', '.log', '.vue', '.svelte',
]);
const MAX_FILES = 5;
const MAX_IMAGE_SIZE = 4 * 1024 * 1024;
const MAX_TOTAL_IMAGE_SIZE = 8 * 1024 * 1024;
const MAX_TEXT_FILE_SIZE = 512 * 1024;
const MAX_TOTAL_TEXT_CHARACTERS = 100_000;

const readImage = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.readAsDataURL(file);
  });

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].id);
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState([]);

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
    setAttachments([]);
  };

  const handleAddFiles = async (files) => {
    if (attachments.length + files.length > MAX_FILES) {
      return `You can attach up to ${MAX_FILES} files per message.`;
    }

    const nextAttachments = [];
    let totalImageSize = attachments.reduce(
      (total, file) => total + (file.type.startsWith('image/') ? file.size : 0),
      0
    );
    let totalTextCharacters = attachments.reduce(
      (total, file) => total + (file.textContent?.length || 0),
      0
    );

    for (const file of files) {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      if (IMAGE_TYPES.has(file.type)) {
        totalImageSize += file.size;
        if (totalImageSize > MAX_TOTAL_IMAGE_SIZE) {
          return 'Attached images cannot exceed 8 MB in total.';
        }
        if (file.size > MAX_IMAGE_SIZE) {
          return `${file.name} is too large. Images must be 4 MB or smaller.`;
        }
        try {
          const data = await readImage(file);
          nextAttachments.push({
            id, name: file.name, type: file.type, size: file.size,
            data, preview: data,
          });
        } catch (error) {
          return error.message;
        }
        continue;
      }

      const extension = file.name.includes('.')
        ? `.${file.name.split('.').pop().toLowerCase()}`
        : '';
      const isTextFile = file.type.startsWith('text/') || TEXT_FILE_EXTENSIONS.has(extension);
      if (!isTextFile) {
        return `${file.name} is not supported. Attach an image or a code/text file.`;
      }
      if (file.size > MAX_TEXT_FILE_SIZE) {
        return `${file.name} is too large. Code/text files must be 512 KB or smaller.`;
      }

      try {
        const textContent = await file.text();
        if (totalTextCharacters + textContent.length > MAX_TOTAL_TEXT_CHARACTERS) {
          return 'Attached code/text files cannot exceed 100,000 characters in total.';
        }
        totalTextCharacters += textContent.length;
        nextAttachments.push({
          id, name: file.name, type: file.type || 'text/plain',
          size: file.size, textContent,
        });
      } catch {
        return `Could not read ${file.name}.`;
      }
    }

    setAttachments((current) => [...current, ...nextAttachments]);
    return '';
  };

  const handleSend = () => {
    if ((!input.trim() && attachments.length === 0) || isStreaming) return;
    const displayContent = input.trim();
    const attachedText = attachments
      .filter((file) => file.textContent)
      .map((file) => `### ${file.name}\n${file.textContent}`);
    const imageNames = attachments
      .filter((file) => file.type.startsWith('image/'))
      .map((file) => file.name);
    const requestContent = [
      displayContent || 'Please review the attached file(s) and help me with them.',
      attachedText.length > 0
        ? `\n\nAttached file contents:\n\n${attachedText.join('\n\n')}`
        : '',
      imageNames.length > 0
        ? `\n\nAttached image(s): ${imageNames.join(', ')}`
        : '',
    ].join('');
    const sentAttachments = attachments;
    setInput('');
    setAttachments([]);
    sendMessage(requestContent, {
      attachments: sentAttachments,
      displayContent: displayContent || 'Please review the attached file(s).',
      model: imageNames.length > 0 ? VISION_MODEL_ID : selectedModel,
    });
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
          attachments={attachments}
          onAddFiles={handleAddFiles}
          onRemoveAttachment={(id) =>
            setAttachments((current) => current.filter((file) => file.id !== id))
          }
          isStreaming={isStreaming}
          disabled={messagesLoading}
        />
      </div>
    </div>
  );
}
