-- ============================================================
-- Supabase SQL Migration: AI Chatbot Schema
-- Supports direct guest chats (no login required) + authenticated users
-- ============================================================

-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Create CONVERSATIONS table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New Chat',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Create MESSAGES table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_conversations_updated 
    ON public.conversations(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
    ON public.messages(conversation_id, created_at ASC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies: Allow Read / Insert / Update / Delete for conversations
DROP POLICY IF EXISTS "Public access conversations select" ON public.conversations;
CREATE POLICY "Public access conversations select" 
    ON public.conversations FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Public access conversations insert" ON public.conversations;
CREATE POLICY "Public access conversations insert" 
    ON public.conversations FOR INSERT 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Public access conversations update" ON public.conversations;
CREATE POLICY "Public access conversations update" 
    ON public.conversations FOR UPDATE 
    USING (true);

DROP POLICY IF EXISTS "Public access conversations delete" ON public.conversations;
CREATE POLICY "Public access conversations delete" 
    ON public.conversations FOR DELETE 
    USING (true);

-- 6. RLS Policies: Allow Read / Insert / Delete for messages
DROP POLICY IF EXISTS "Public access messages select" ON public.messages;
CREATE POLICY "Public access messages select" 
    ON public.messages FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Public access messages insert" ON public.messages;
CREATE POLICY "Public access messages insert" 
    ON public.messages FOR INSERT 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Public access messages delete" ON public.messages;
CREATE POLICY "Public access messages delete" 
    ON public.messages FOR DELETE 
    USING (true);

-- 7. Auto-update Conversation updated_at timestamp trigger
CREATE OR REPLACE FUNCTION public.handle_message_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations
    SET updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_message_created ON public.messages;
CREATE TRIGGER on_message_created
    AFTER INSERT ON public.messages
    FOR EACH ROW EXECUTE FUNCTION public.handle_message_timestamp();
