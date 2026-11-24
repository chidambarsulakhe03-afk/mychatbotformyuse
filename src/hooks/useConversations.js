import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper to get local stored conversations
  const getLocalConversations = useCallback(() => {
    try {
      const key = `chatai_convs_${user?.id || 'default'}`;
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, [user]);

  // Save to local storage
  const saveLocalConversations = useCallback((list) => {
    try {
      const key = `chatai_convs_${user?.id || 'default'}`;
      localStorage.setItem(key, JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  // Load conversations
  const fetchConversations = useCallback(async () => {
    if (!user) {
      setConversations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (isSupabaseConfigured) {
        const { data, error: fetchErr } = await supabase
          .from('conversations')
          .select('*')
          .order('updated_at', { ascending: false });

        if (!fetchErr && data) {
          setConversations(data);
          if (data.length > 0 && !currentId) {
            setCurrentId(data[0].id);
          }
          setLoading(false);
          return;
        }
      }

      // Fallback to local storage
      const local = getLocalConversations();
      setConversations(local);
      if (local.length > 0 && !currentId) {
        setCurrentId(local[0].id);
      }
    } catch (err) {
      const local = getLocalConversations();
      setConversations(local);
      if (local.length > 0 && !currentId) {
        setCurrentId(local[0].id);
      }
    } finally {
      setLoading(false);
    }
  }, [user, currentId, getLocalConversations]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Create new conversation
  const createConversation = async (title = 'New Chat') => {
    const localId = 'conv-' + Date.now();
    const fallbackConv = {
      id: localId,
      user_id: user?.id || 'local-user',
      title,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error: insertErr } = await supabase
          .from('conversations')
          .insert({
            title,
            ...(user?.id && !user.id.startsWith('user_') ? { user_id: user.id } : {}),
          })
          .select()
          .single();

        if (!insertErr && data) {
          setConversations((prev) => [data, ...prev]);
          setCurrentId(data.id);
          return data;
        }
      } catch (e) {
        console.warn('Supabase conversation insert failed, falling back to local:', e);
      }
    }

    // Local fallback
    setConversations((prev) => {
      const updated = [fallbackConv, ...prev];
      saveLocalConversations(updated);
      return updated;
    });
    setCurrentId(fallbackConv.id);
    return fallbackConv;
  };

  // Rename conversation
  const renameConversation = async (id, newTitle) => {
    if (!newTitle.trim()) return;

    setConversations((prev) => {
      const updated = prev.map((c) =>
        c.id === id ? { ...c, title: newTitle.trim(), updated_at: new Date().toISOString() } : c
      );
      saveLocalConversations(updated);
      return updated;
    });

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('conversations')
          .update({ title: newTitle.trim(), updated_at: new Date().toISOString() })
          .eq('id', id);
      } catch {}
    }
  };

  // Delete conversation
  const deleteConversation = async (id) => {
    setConversations((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      saveLocalConversations(updated);
      if (currentId === id) {
        setCurrentId(updated[0]?.id || null);
      }
      return updated;
    });

    if (isSupabaseConfigured) {
      try {
        await supabase.from('conversations').delete().eq('id', id);
      } catch {}
    }
  };

  return {
    conversations,
    currentId,
    setCurrentId,
    loading,
    error,
    createConversation,
    renameConversation,
    deleteConversation,
    refreshConversations: fetchConversations,
  };
}
