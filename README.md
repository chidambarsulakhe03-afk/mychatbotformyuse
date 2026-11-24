# ChatAI – Production Full-Stack AI Chatbot

A modern, high-performance, ChatGPT-inspired AI conversational application built with **React**, **Vite**, **Tailwind CSS**, **Supabase (Auth, PostgreSQL, Row Level Security, Edge Functions)**, and the **Groq API** for ultra-low latency AI inference.

---

## 🌟 Features

- **Real-Time AI Conversations**: High-speed, context-aware responses powered by Groq's LPU inference engine.
- **Streaming Responses**: Live Server-Sent Events (SSE) streaming with animated typing cursor.
- **Context-Aware Memory**: Previous conversation history is dynamically supplied to the model.
- **Markdown & Code Syntax Highlighting**: GitHub-flavored markdown with multi-language code highlighting (`Prism.js`), language badges, and one-click copy buttons.
- **Message Action Bar**: Copy message content, regenerate responses, and abort/stop generation mid-stream.
- **Chat History Management**: Create new chats, rename conversation titles inline, delete chats with confirmation, and clear messages.
- **Conversation Organization**: Chats are automatically grouped by date (*Today*, *Yesterday*, *Previous 7 Days*, *Previous 30 Days*, *Older*).
- **Model Selector**: Switch seamlessly between Groq chat models:
  - `Llama 3.3 70B Versatile` (Default, 128k context)
  - `Llama 3.1 8B Instant` (Ultra-fast)
  - `Mixtral 8x7B 32k` (High-quality MoE)
- **ChatGPT-Inspired UI/UX**:
  - Auto-expanding multiline input (`Enter` to send, `Shift+Enter` for newline).
  - Welcome hero with 4 prompt recommendation cards.
  - Mobile-friendly collapsible sidebar with backdrop blur.
  - Dark and Light theme toggle (persisted in `localStorage`).
  - Keyboard shortcut (`Ctrl+K` / `Cmd+K` for New Chat).
- **Authentication & Security**:
  - Supabase Auth: Email/Password registration, Login, Password Reset, and Google OAuth.
  - Row Level Security (RLS) on all tables (`profiles`, `conversations`, `messages`).
  - **Zero Groq API Key Exposure**: The Groq API key is stored strictly inside Supabase Edge Function secrets.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | React 18, Vite 6 | Fast SPA build with chunk splitting |
| **Styling** | Tailwind CSS 3 | Dark/Light themes, responsive typography |
| **Icons** | Lucide React | Modern, lightweight SVG iconography |
| **Markdown & Code** | React-Markdown, Remark-GFM, Prism.js | Full syntax highlighting & code copying |
| **Database** | Supabase PostgreSQL | Tables: `profiles`, `conversations`, `messages` |
| **Security** | Supabase Row Level Security (RLS) | Isolated per-user data access |
| **Authentication** | Supabase Auth | Persistent JWT sessions & OAuth |
| **Serverless Logic** | Supabase Edge Functions (Deno) | Secure Groq streaming proxy |
| **AI Inference** | Groq API | Official OpenAI-compatible streaming API |
| **Deployment** | Vercel | Single-Page Application with `vercel.json` |

---

## 📁 Project Structure

```
d:\Mychatbot\
├── public/
│   └── vite.svg                      # App favicon
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   └── ProtectedRoute.jsx    # Guard for authenticated routes
│   │   ├── chat/
│   │   │   ├── ChatInput.jsx         # Auto-resizing textarea with send/stop buttons
│   │   │   ├── ChatMessage.jsx       # Markdown, code rendering & actions
│   │   │   ├── CodeBlock.jsx         # Prism.js highlighted code block with copy button
│   │   │   ├── TypingIndicator.jsx   # 3-dot animated bouncing indicator
│   │   │   └── WelcomeScreen.jsx     # Suggested prompt cards
│   │   └── layout/
│   │       ├── Header.jsx            # Top navbar, model picker, theme switch
│   │       └── Sidebar.jsx           # Conversation history, rename/delete, profile
│   ├── contexts/
│   │   ├── AuthContext.jsx           # Supabase Auth provider
│   │   └── ThemeContext.jsx          # Dark / Light mode provider
│   ├── hooks/
│   │   ├── useAuth.js                # Auth hook re-export
│   │   ├── useChat.js                # Chat streaming & message management hook
│   │   ├── useConversations.js       # Conversation CRUD & grouping hook
│   │   └── useTheme.js               # Theme hook re-export
│   ├── layouts/
│   │   ├── AuthLayout.jsx            # Layout wrapper for auth views
│   │   └── RootLayout.jsx            # Main app layout wrapper
│   ├── pages/
│   │   ├── ChatPage.jsx              # Core ChatGPT conversation view
│   │   ├── LoginPage.jsx             # Sign-in page with demo mode support
│   │   ├── RegisterPage.jsx          # Sign-up page with email validation
│   │   └── ResetPasswordPage.jsx     # Password reset flow
│   ├── services/
│   │   ├── chatService.js            # Edge function SSE streaming reader
│   │   └── supabase.js               # Supabase client initialization
│   ├── utils/
│   │   ├── cn.js                     # Tailwind class merging utility
│   │   ├── constants.js              # Models, suggested prompts, configs
│   │   └── formatters.js             # Date grouping & string helpers
│   ├── App.jsx                       # React Router configuration
│   ├── index.css                     # Tailwind directives & Prism CSS theme
│   └── main.jsx                      # App root entry point
├── supabase/
│   ├── config.toml                   # Supabase CLI project config
│   ├── functions/
│   │   └── chat/
│   │       └── index.ts              # Supabase Edge Function for Groq streaming
│   └── migrations/
│       └── 20240101000000_init_schema.sql # Database schema, RLS policies, triggers
├── .env.example                      # Environment variables template
├── package.json                      # Project dependencies & scripts
├── postcss.config.js                 # PostCSS config for Tailwind
├── tailwind.config.js                # Tailwind CSS custom themes & dark mode
├── vercel.json                       # Vercel SPA rewrite rules
├── vite.config.js                    # Vite bundler configuration & code splitting
└── README.md                         # Complete documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites

- **Node.js**: v18 or higher (v20+ recommended)
- **Supabase Account**: [https://supabase.com](https://supabase.com)
- **Groq Cloud API Key**: [https://console.groq.com](https://console.groq.com)

---

### 2. Database Setup in Supabase

1. Open your Supabase Dashboard and go to the **SQL Editor**.
2. Open the file `supabase/migrations/20240101000000_init_schema.sql` located in this repository.
3. Paste the contents into the SQL Editor and click **Run**.

This migration script will:
- Create the `profiles`, `conversations`, and `messages` tables.
- Create foreign keys with `ON DELETE CASCADE`.
- Enable **Row Level Security (RLS)** and create policies ensuring users can only read, write, update, and delete their own conversations and messages.
- Add triggers to automatically create a user profile on signup and update conversation timestamps on new messages.
- Create performance indexes on `conversations(user_id, updated_at DESC)` and `messages(conversation_id, created_at ASC)`.

---

### 3. Deploy the Supabase Edge Function

The `chat` Edge Function securely relays streaming responses from Groq without exposing your `GROQ_API_KEY` to the client:

1. Install the Supabase CLI (if not already installed):
   ```bash
   npm install -g supabase
   ```
2. Login to your Supabase account:
   ```bash
   supabase login
   ```
3. Link your Supabase project:
   ```bash
   supabase link --project-ref your-project-id
   ```
4. Set the Groq API key secret inside Supabase:
   ```bash
   supabase secrets set GROQ_API_KEY=gsk_your_groq_api_key_here
   ```
5. Deploy the `chat` Edge Function:
   ```bash
   supabase functions deploy chat --no-verify-jwt
   ```

---

### 4. Configure Frontend Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Update the environment variables in `.env`:
   ```env
   # Your Supabase Project URL & Anon Key (from Supabase Dashboard -> Project Settings -> API)
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

   # Optional: Default Groq Model
   VITE_DEFAULT_MODEL=llama-3.3-70b-versatile

   # Optional (Local Dev Fallback only):
   # VITE_GROQ_API_KEY=gsk_your_groq_api_key_here
   ```

---

### 5. Install Dependencies and Run Locally

```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

> **Tip (Demo Mode)**: If you open the application before connecting your Supabase project, the app will run in **Demo Mode**, allowing you to test the chat interface and guest mode immediately!

---

## 🔒 Security Best Practices

1. **No Frontend API Keys**: The Groq API key is strictly maintained in Supabase Edge Function secrets. It is never shipped with client bundles.
2. **Row Level Security (RLS)**: PostgreSQL Row Level Security enforces that users can only query, modify, or delete their own data.
3. **JWT Authentication**: The Edge Function verifies the Supabase session token (`Authorization: Bearer <token>`) with `supabase.auth.getUser()` before processing any chat completion.
4. **Conversation Ownership Verification**: Even if a malicious request attempts to send messages to another conversation ID, the Edge Function validates ownership against `auth.uid() = user_id`.

---

## 🚢 Deployment to Vercel

1. Push your repository to GitHub, GitLab, or Bitbucket.
2. Go to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Import your repository.
4. Configure the build settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add the Environment Variables under **Settings -> Environment Variables**:
   - `VITE_SUPABASE_URL`: `https://your-project-id.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `your-supabase-anon-key`
   - `VITE_DEFAULT_MODEL`: `llama-3.3-70b-versatile`
6. Click **Deploy**. Vercel will build the SPA using the provided `vercel.json` rewrite configuration.

---

## 🧪 Testing Checklist

- [x] **Authentication**: Sign up with email/password, sign in, sign out, password reset.
- [x] **New Chat**: Starts clean conversation with suggested prompt cards.
- [x] **Streaming**: Real-time token streaming from Groq API via Edge Function.
- [x] **Context Awareness**: Consecutive prompts retain previous conversation context.
- [x] **Stop Generating**: Abort button immediately stops the stream.
- [x] **Regenerate**: Re-runs the last user prompt and refreshes the response.
- [x] **Markdown & Code**: Renders headers, lists, tables, and highlighted code snippets with copy button.
- [x] **Conversation Management**: Rename chat inline, delete chat, clear conversation.
- [x] **Responsive & Dark Mode**: Seamless toggle between dark and light themes with smooth transitions.

---

## 📄 License

MIT License. Built for modern AI conversational applications.
