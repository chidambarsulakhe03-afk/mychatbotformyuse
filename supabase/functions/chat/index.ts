// Supabase Edge Function: chat
// Handles authentication, message persistence, context retrieval, and streaming Groq AI inference.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DEFAULT_MODEL = "llama-3.3-70b-versatile";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase Client with User Auth context
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? supabaseAnonKey;
    const groqApiKey = Deno.env.get("GROQ_API_KEY");

    if (!groqApiKey) {
      return new Response(
        JSON.stringify({ error: "GROQ_API_KEY is not configured in Supabase Edge Function secrets" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Authenticate user via JWT
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const {
      conversationId,
      content,
      model,
      systemPrompt,
      attachments = [],
    } = await req.json();

    if (!conversationId) {
      return new Response(
        JSON.stringify({ error: "conversationId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!Array.isArray(attachments) || attachments.length > 5) {
      return new Response(
        JSON.stringify({ error: "A maximum of 5 image attachments is allowed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const imageAttachments = attachments.filter((attachment: any) => {
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      const maxDataUrlLength = Math.ceil(4 * 1024 * 1024 * 4 / 3) + 128;
      return attachment &&
        allowedTypes.includes(attachment.type) &&
        typeof attachment.data === "string" &&
        attachment.data.startsWith(`data:${attachment.type};base64,`) &&
        attachment.data.length <= maxDataUrlLength;
    });
    if (imageAttachments.length !== attachments.length) {
      return new Response(
        JSON.stringify({ error: "One or more image attachments are invalid or too large" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify conversation ownership
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("id, user_id, title")
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .single();

    if (convError || !conversation) {
      return new Response(
        JSON.stringify({ error: "Conversation not found or access denied" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If new user content is sent, save user message
    if (content && typeof content === "string" && content.trim().length > 0) {
      const { error: insertUserMsgError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          role: "user",
          content: content.trim(),
        });

      if (insertUserMsgError) {
        return new Response(
          JSON.stringify({ error: "Failed to persist user message: " + insertUserMsgError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // If conversation title is default 'New Chat', generate a concise title
      if (conversation.title === "New Chat") {
        const cleanTitle = content.trim().slice(0, 35) + (content.length > 35 ? "..." : "");
        await supabase
          .from("conversations")
          .update({ title: cleanTitle })
          .eq("id", conversationId);
      }
    }

    // Fetch conversation history for context (last 20 messages)
    const { data: historyMessages, error: historyError } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(20);

    if (historyError) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch conversation history: " + historyError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format messages for Groq API
    const systemInstruction = systemPrompt || 
      "You are a helpful, brilliant, concise, and modern AI assistant. " +
      "Provide clear, well-structured answers using GitHub-flavored Markdown. " +
      "Format code snippets with appropriate language tags for syntax highlighting.";

    const groqMessages: Array<{
      role: string;
      content: string | Array<Record<string, unknown>>;
    }> = [
      { role: "system", content: systemInstruction },
      ...(historyMessages || []).map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    ];
    if (imageAttachments.length > 0) {
      for (let index = groqMessages.length - 1; index >= 1; index -= 1) {
        if (groqMessages[index].role === "user") {
          groqMessages[index].content = [
            { type: "text", text: groqMessages[index].content || "Please analyze the attached image(s)." },
            ...imageAttachments.map((attachment: any) => ({
              type: "image_url",
              image_url: { url: attachment.data },
            })),
          ];
          break;
        }
      }
    }

    const selectedModel = model || Deno.env.get("GROQ_MODEL") || DEFAULT_MODEL;

    // Call Groq API with streaming
    const groqResponse = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: groqMessages,
        stream: true,
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      return new Response(
        JSON.stringify({ error: `Groq API Error (${groqResponse.status}): ${errText}` }),
        { status: groqResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Transform stream: send SSE chunks to client and accumulate full assistant response
    let accumulatedContent = "";
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const text = decoder.decode(chunk, { stream: true });
        const lines = text.split("\n");

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data:")) continue;

          const dataStr = trimmed.replace(/^data:\s*/, "");
          if (dataStr === "[DONE]") {
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            continue;
          }

          try {
            const parsed = JSON.parse(dataStr);
            const delta = parsed.choices?.[0]?.delta?.content || "";
            if (delta) {
              accumulatedContent += delta;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ delta, model: selectedModel })}\n\n`)
              );
            }
          } catch (_e) {
            // Forward raw chunk if not JSON
            controller.enqueue(encoder.encode(`${line}\n`));
          }
        }
      },
      async flush() {
        // Save the complete assistant message to Supabase
        if (accumulatedContent.trim()) {
          try {
            await supabase.from("messages").insert({
              conversation_id: conversationId,
              role: "assistant",
              content: accumulatedContent,
            });
          } catch (err) {
            console.error("Error persisting assistant message:", err);
          }
        }
      },
    });

    const readable = groqResponse.body?.pipeThrough(transformStream);

    return new Response(readable, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
