# IkoBuild — AI Software Builder Platform

> **Build complete software applications with AI.**

IkoBuild is a production-ready SaaS platform that lets you generate full-stack applications from natural language prompts.

---

## ✨ Features

- 🤖 **AI Generation** — Describe your app, get a full codebase
- 📝 **Monaco Editor** — VS Code-quality editor with multi-tab support
- 🌐 **Live Preview** — See your app running in real time
- 🗄️ **Database Designer** — Visual schema editor with SQL export
- 🚀 **One-Click Deploy** — IkoBuild hosting or ZIP download
- 💬 **AI Chat** — Persistent AI assistant for each project
- 🔒 **Auth** — Supabase Auth with Google OAuth

---

## 🚀 Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in your values:

| Variable | Where to get |
|----------|-------------|
| `VITE_SUPABASE_URL` | [supabase.com](https://supabase.com) → Project Settings → API |
| `VITE_SUPABASE_ANON_KEY` | [supabase.com](https://supabase.com) → Project Settings → API |
| `VITE_OPENROUTER_API_KEY` | [openrouter.ai/keys](https://openrouter.ai/keys) |

### 3. Set up database

Run `supabase/schema.sql` in your Supabase SQL editor.

### 4. Start development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🏗️ Project Structure

```
src/
├── components/
│   ├── workspace/      # FileExplorer, CodeEditor, AIChat
│   ├── preview/        # PreviewFrame, build logs
│   ├── database/       # SchemaDesigner
│   └── deploy/         # DeployModal
├── pages/
│   ├── LandingPage.jsx
│   ├── AuthPage.jsx
│   ├── DashboardPage.jsx
│   ├── NewProjectPage.jsx
│   └── WorkspacePage.jsx
├── lib/
│   ├── supabase.js     # Supabase client + helpers
│   ├── openrouter.js   # AI API client
│   └── utils.js        # Utilities
├── store/
│   ├── authStore.js    # Auth state (Zustand)
│   └── projectStore.js # Project/workspace state
└── index.css           # Design system
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS 3 |
| Editor | Monaco Editor |
| Animation | Framer Motion |
| State | Zustand |
| Auth + DB | Supabase |
| AI | OpenRouter |
| ZIP | JSZip |

---

## 🗄️ Database Schema

See `supabase/schema.sql` for the complete schema including:

- `projects` — user projects
- `project_files` — generated files with content
- `project_prompts` — AI chat history
- `deployments` — deployment records
- `project_versions` — version snapshots
- `templates` — built-in templates
- `subscriptions` — user plans
- `usage_logs` — AI usage tracking

---

## 🤖 AI Models Supported

| Model | Provider | Tier |
|-------|----------|------|
| Claude 3.5 Sonnet | Anthropic | Pro |
| GPT-4o | OpenAI | Pro |
| Gemini 1.5 Pro | Google | Pro |
| Claude 3 Haiku | Anthropic | Free |
| GPT-4o Mini | OpenAI | Free |
| Llama 3.1 70B | Meta | Free |
| DeepSeek Coder | DeepSeek | Free |

---

## 📦 Deployment

### Vercel (Frontend)

```bash
npm run build
vercel --prod
```

### Environment on Vercel

Add all `VITE_*` variables in Vercel project settings.

---

## 📋 Subscription Plans

| Feature | Free | Pro | Business |
|---------|------|-----|----------|
| Projects | 3/mo | Unlimited | Unlimited |
| AI Models | Basic | Advanced | Advanced |
| Deployments | — | ✓ | ✓ |
| Custom Domains | — | ✓ | ✓ |
| Team Members | — | — | ✓ |

---

Generated with ❤️ by IkoBuild · [ikobuild.app](https://ikobuild.app)
