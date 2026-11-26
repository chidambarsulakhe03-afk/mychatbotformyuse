import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { streamChatCompletion } from '../services/chatService';
import { useAuth } from '../contexts/AuthContext';

export function useChat({ conversationId, onConversationCreated, selectedModel }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);

  const abortControllerRef = useRef(null);

  // Helper for local messages storage
  const getLocalMessages = useCallback((convId) => {
    try {
      const stored = localStorage.getItem(`chatai_msgs_${convId}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, []);

  const saveLocalMessages = useCallback((convId, msgs) => {
    try {
      const safeMessages = msgs.map((message) => ({
        ...message,
        attachments: message.attachments?.map(({ id, name, type, size }) => ({
          id, name, type, size,
        })),
      }));
      localStorage.setItem(`chatai_msgs_${convId}`, JSON.stringify(safeMessages));
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Fetch messages when conversationId changes
  const fetchMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (isSupabaseConfigured) {
        const { data, error: msgError } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (!msgError && data && data.length > 0) {
          setMessages(data);
          setLoading(false);
          return;
        }
      }

      // Local fallback
      setMessages(getLocalMessages(conversationId));
    } catch (err) {
      setMessages(getLocalMessages(conversationId));
    } finally {
      setLoading(false);
    }
  }, [conversationId, getLocalMessages]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Send message
  const sendMessage = async (content, options = {}) => {
    if (!content.trim() || isStreaming) return;
    const {
      attachments = [],
      displayContent = content,
      model = selectedModel,
    } = options;

    let targetConvId = conversationId;

    // If no active conversation, create one first
    if (!targetConvId) {
      if (onConversationCreated) {
        const titleText = (options.displayContent || content).trim();
        const title = titleText.slice(0, 30) + (titleText.length > 30 ? '...' : '');
        const newConv = await onConversationCreated(title);
        if (!newConv) return;
        targetConvId = newConv.id;
      } else {
        return;
      }
    }

    const userMessageId = 'usr-' + Date.now();
    const assistantMessageId = 'ast-' + Date.now();

    const userMsg = {
      id: userMessageId,
      conversation_id: targetConvId,
      role: 'user',
      content: displayContent.trim(),
      contextContent: content.trim(),
      attachments: attachments.map(({ id, name, type, size, preview, data }) => ({
        id, name, type, size, preview,
        data,
      })),
      created_at: new Date().toISOString(),
    };

    const initialAssistantMsg = {
      id: assistantMessageId,
      conversation_id: targetConvId,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
      isStreaming: true,
    };

    // Optimistically update UI
    setMessages((prev) => [...prev, userMsg, initialAssistantMsg]);
    setIsStreaming(true);
    setError(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    let accumulatedContent = '';

    try {
      await streamChatCompletion({
        conversationId: targetConvId,
        content: content.trim(),
        model: model || 'qwen/qwen3.8-27b',
        attachments,
        signal: controller.signal,
        onChunk: (delta) => {
          accumulatedContent += delta;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: accumulatedContent }
                : msg
            )
          );
        },
      });

      // Stream successfully finished
      setMessages((prev) => {
        const updated = prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: accumulatedContent, isStreaming: false }
            : msg
        );
        saveLocalMessages(targetConvId, updated);
        return updated;
      });

    } catch (err) {
      if (err.name === 'AbortError') {
        setMessages((prev) => {
          const updated = prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: accumulatedContent + ' *(Generation stopped)*', isStreaming: false }
              : msg
          );
          saveLocalMessages(targetConvId, updated);
          return updated;
        });
      } else {
        console.error('Error generating response:', err);
        setError(err.message || 'Failed to generate response');
        setMessages((prev) => {
          const updated = prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content:
                    accumulatedContent ||
                    `⚠️ **Error:** ${err.message || 'Unable to connect to AI model.'}`,
                  isStreaming: false,
                  isError: true,
                }
              : msg
          );
          saveLocalMessages(targetConvId, updated);
          return updated;
        });
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  // Stop generating
  const stopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  };

  // Regenerate assistant response
  const regenerateMessage = async (assistantMessageId) => {
    if (isStreaming) return;

    const messageIndex = messages.findIndex((m) => m.id === assistantMessageId);
    if (messageIndex === -1) return;

    let userMsg = null;
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        userMsg = messages[i];
        break;
      }
    }

    if (!userMsg) return;

    const sliced = messages.slice(0, messageIndex);
    const newAssistantMsg = {
      id: 'ast-' + Date.now(),
      conversation_id: conversationId,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
      isStreaming: true,
    };

    setMessages([...sliced, newAssistantMsg]);
    setIsStreaming(true);
    setError(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    let accumulatedContent = '';

    try {
      await streamChatCompletion({
        conversationId,
        content: '',
        model: selectedModel || 'llama-3.3-70b-versatile',
        attachments: userMsg.attachments || [],
        signal: controller.signal,
        onChunk: (delta) => {
          accumulatedContent += delta;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === newAssistantMsg.id
                ? { ...msg, content: accumulatedContent }
                : msg
            )
          );
        },
      });

      setMessages((prev) => {
        const updated = prev.map((msg) =>
          msg.id === newAssistantMsg.id
            ? { ...msg, content: accumulatedContent, isStreaming: false }
            : msg
        );
        saveLocalMessages(conversationId, updated);
        return updated;
      });
    } catch (err) {
      if (err.name === 'AbortError') {
        setMessages((prev) => {
          const updated = prev.map((msg) =>
            msg.id === newAssistantMsg.id
              ? { ...msg, content: accumulatedContent + ' *(Generation stopped)*', isStreaming: false }
              : msg
          );
          saveLocalMessages(conversationId, updated);
          return updated;
        });
      } else {
        setError(err.message);
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  // Clear conversation
  const clearConversation = async () => {
    if (!conversationId) return;
    setMessages([]);
    localStorage.removeItem(`chatai_msgs_${conversationId}`);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('messages').delete().eq('conversation_id', conversationId);
      } catch {}
    }
  };

  return {
    messages,
    loading,
    isStreaming,
    error,
    sendMessage,
    stopGenerating,
    regenerateMessage,
    clearConversation,
    refreshMessages: fetchMessages,
  };
}
