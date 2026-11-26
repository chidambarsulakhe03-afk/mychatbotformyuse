import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Chat Service
 * Handles streaming communication with Groq AI API.
 * Supports Supabase Edge Functions in production and direct Groq streaming in dev/standalone mode.
 */
export async function streamChatCompletion({
  conversationId,
  content,
  model = import.meta.env.VITE_DEFAULT_MODEL || 'qwen/qwen3.8-27b',
  systemPrompt,
  onChunk,
  signal,
  attachments = [],
}) {
  // Sanitize model name to prevent old/unsupported model errors
  const activeModel =
    !model || model === 'llama-3.3-70b-versatile'
      ? 'qwen/qwen3.8-27b'
      : model;

  const session = (await supabase.auth.getSession()).data.session;
  const token = session?.access_token;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const edgeFunctionUrl = `${supabaseUrl}/functions/v1/chat`;
  const devGroqKey = import.meta.env.VITE_GROQ_API_KEY;

  // Path 1: Supabase Edge Function (if user deployed function and has active session)
  if (isSupabaseConfigured && token && !devGroqKey) {
    try {
      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          conversationId,
          content,
          model: activeModel,
          systemPrompt,
          attachments: attachments
            .filter((attachment) => attachment.type?.startsWith('image/'))
            .map(({ name, type, data }) => ({ name, type, data })),
        }),
        signal,
      });

      if (!response.ok) {
        let errorMsg = `Server error (${response.status})`;
        try {
          const errData = await response.json();
          errorMsg = errData.error || errorMsg;
        } catch {
          const text = await response.text();
          if (text) errorMsg = text;
        }
        throw new Error(errorMsg);
      }

      // Stream the response via Server-Sent Events (SSE)
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;

          const dataStr = trimmed.replace(/^data:\s*/, '');
          if (dataStr === '[DONE]') return;

          try {
            const parsed = JSON.parse(dataStr);
            const delta = parsed.delta || parsed.choices?.[0]?.delta?.content || '';
            if (delta) onChunk(delta);
          } catch {}
        }
      }
      return;
    } catch (err) {
      if (err.name === 'AbortError') throw err;
      console.warn('Edge Function chat request failed, falling back to direct Groq:', err.message);
    }
  }

  // Path 2: Direct Groq API streaming (Immediate, no login required)
  if (devGroqKey) {
    // Attempt to persist user message to Supabase if configured
    if (isSupabaseConfigured && content) {
      try {
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          role: 'user',
          content,
        });
      } catch {}
    }

    // Retrieve previous messages for context
    let history = [];
    if (isSupabaseConfigured && token) {
      try {
        const { data } = await supabase
          .from('messages')
          .select('role, content')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true })
          .limit(20);
        if (data && data.length > 0) history = data;
      } catch {}
    }

    // If history is still empty, load from localStorage
    if (history.length === 0) {
      try {
        const local = localStorage.getItem(`chatai_msgs_${conversationId}`);
        if (local) {
          const parsed = JSON.parse(local);
          history = parsed
            .filter((m) => m.content && !m.isStreaming)
            .map((m) => ({ role: m.role, content: m.contextContent || m.content }))
            .slice(-20);
        }
      } catch {}
    }

    // Include the new prompt if not already in history
    if (content && (!history.length || history[history.length - 1].content !== content)) {
      history.push({ role: 'user', content });
    }

    const messages = [
      {
        role: 'system',
        content:
          systemPrompt ||
          'You are a helpful, brilliant, concise, and modern AI assistant. Format responses with clean GitHub-flavored Markdown, including proper language tags for code snippets.',
      },
      ...history,
    ];

    const imageAttachments = attachments.filter(
      (attachment) => attachment.type?.startsWith('image/') && attachment.data
    );
    if (imageAttachments.length > 0) {
      let lastUserIndex = -1;
      for (let index = messages.length - 1; index >= 0; index -= 1) {
        if (messages[index].role === 'user') {
          lastUserIndex = index;
          break;
        }
      }
      if (lastUserIndex >= 0) {
        messages[lastUserIndex] = {
          ...messages[lastUserIndex],
          content: [
            { type: 'text', text: messages[lastUserIndex].content || 'Please analyze the attached image(s).' },
            ...imageAttachments.map((attachment) => ({
              type: 'image_url',
              image_url: { url: attachment.data },
            })),
          ],
        };
      }
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${devGroqKey}`,
      },
      body: JSON.stringify({
        model: activeModel,
        messages,
        stream: true,
        temperature: 0.7,
      }),
      signal,
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Groq API error (${response.status}): ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let accumulated = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const dataStr = trimmed.replace(/^data:\s*/, '');
        if (dataStr === '[DONE]') break;

        try {
          const parsed = JSON.parse(dataStr);
          const delta = parsed.choices?.[0]?.delta?.content || '';
          if (delta) {
            accumulated += delta;
            onChunk(delta);
          }
        } catch {}
      }
    }

    // Save assistant message to Supabase if configured
    if (isSupabaseConfigured && accumulated) {
      try {
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: accumulated,
        });
      } catch {}
    }
    return;
  }

  throw new Error('Please configure VITE_GROQ_API_KEY in your .env file to enable AI streaming.');
}
