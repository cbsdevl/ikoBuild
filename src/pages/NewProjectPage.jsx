import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, ArrowRight, Wand2, Loader2, CheckCircle,
  Code2, Zap, Database, Globe, ChevronDown
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { useProjectStore } from '@/store/projectStore'
import { createProject, upsertProjectFile } from '@/lib/supabase'
import {
  chatCompletion,
  buildProjectSystemPrompt,
  DEFAULT_MODEL,
  MODELS,
} from '@/lib/openrouter'
import { parseAIJson, generateSlug } from '@/lib/utils'

const FRAMEWORKS = [
  { id: 'React', label: 'React', emoji: '⚛️', desc: 'SPA with Vite + Tailwind' },
  { id: 'Next.js', label: 'Next.js', emoji: '▲', desc: 'Full-stack React framework' },
  { id: 'Vue', label: 'Vue 3', emoji: '💚', desc: 'Progressive JS framework' },
  { id: 'Node.js', label: 'Node.js API', emoji: '🟢', desc: 'REST API with Express' },
  { id: 'Django', label: 'Django', emoji: '🐍', desc: 'Python web framework' },
  { id: 'FastAPI', label: 'FastAPI', emoji: '⚡', desc: 'Fast Python API' },
  { id: 'Laravel', label: 'Laravel', emoji: '🔴', desc: 'PHP web framework' },
  { id: 'Full-Stack', label: 'Full-Stack', emoji: '🚀', desc: 'React + Node.js + DB' },
]

const EXAMPLE_PROMPTS = [
  'Build a school management system with student registration, attendance tracking, exam management, and teacher dashboard.',
  'Create a hospital management system with patient records, doctor scheduling, and appointment booking.',
  'Build an e-commerce platform with product catalog, shopping cart, Stripe payments, and admin dashboard.',
  'Create a SACCO management system with member registration, loan processing, and savings tracking.',
  'Build a CRM with lead tracking, contact management, deal pipeline, and email integration.',
]

export default function NewProjectPage() {
  const { user } = useAuthStore()
  const { setProject, setFiles, setMessages } = useProjectStore()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    name: '',
    prompt: '',
    framework: 'React',
    model: DEFAULT_MODEL,
    apiKey: '',
  })
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState('')
  const [generatedData, setGeneratedData] = useState(null)

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleGenerate = async () => {
    if (!form.name.trim()) return toast.error('Enter a project name')
    if (!form.prompt.trim()) return toast.error('Describe your project')

    setGenerating(true)
    setStep(2)

    try {
      const steps = [
        'Analyzing your requirements...',
        'Designing architecture...',
        'Generating database schema...',
        'Building frontend components...',
        'Creating backend services...',
        'Configuring project structure...',
        'Finalizing code...',
      ]

      for (const s of steps) {
        setProgress(s)
        await new Promise((r) => setTimeout(r, 400))
      }

      setProgress('Calling AI model...')

      const apiKey = form.apiKey || import.meta.env.VITE_OPENROUTER_API_KEY
      if (!apiKey) {
        // Demo mode — use sample data
        const demo = buildDemoProject(form)
        setGeneratedData(demo)
        setProgress('Complete! Saving project...')
        await saveProject(demo)
        return
      }

      const systemPrompt = buildProjectSystemPrompt(form.framework)
      const response = await chatCompletion({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Project: ${form.name}\n\n${form.prompt}` },
        ],
        model: form.model,
        apiKey,
      })

      setProgress('Parsing generated files...')
      const data = parseAIJson(response)
      setGeneratedData(data)
      setProgress('Saving project to database...')
      await saveProject(data)
    } catch (err) {
      console.error(err)
      // Fallback to demo on API error
      const demo = buildDemoProject(form)
      setGeneratedData(demo)
      setProgress('Using demo mode — saving project...')
      await saveProject(demo)
    }
  }

  const saveProject = async (data) => {
    const slug = generateSlug(form.name)
    const projectData = {
      user_id: user.id,
      name: form.name,
      description: data.summary || form.prompt.slice(0, 200),
      framework: form.framework,
      prompt: form.prompt,
      status: 'active',
      slug,
    }

    const { data: project, error } = await createProject(projectData)
    if (error) {
      toast.error('Failed to save project: ' + error.message)
      setGenerating(false)
      setStep(1)
      return
    }

    // Save generated files
    const files = data.files || []
    for (const file of files.slice(0, 50)) {
      await upsertProjectFile({
        project_id: project.id,
        path: file.path,
        content: file.content,
        type: file.type || 'text',
      })
    }

    setProject(project)
    setFiles(
      files.map((f) => ({ ...f, project_id: project.id }))
    )
    setMessages([{
      id: Date.now(),
      role: 'assistant',
      content: `✅ I've generated your **${form.name}** project!\n\nHere's what was created:\n${(data.features || []).slice(0, 5).map((f) => `- ${f}`).join('\n')}\n\nYou can now edit files, ask me to add features, or preview your app.`,
    }])

    setProgress('Done!')
    toast.success('Project generated successfully!')

    setTimeout(() => {
      navigate(`/workspace/${project.id}`)
    }, 600)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      {/* Nav */}
      <nav className="glass border-b border-glass h-16 flex items-center px-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft size={16} /> Dashboard
        </button>
        <div className="mx-auto flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-600 to-blue-600 flex items-center justify-center">
            <Code2 size={14} className="text-white" />
          </div>
          <span className="font-bold">IkoBuild</span>
        </div>
        <div className="w-20" />
      </nav>

      <div className="flex-1 flex items-start justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="text-center mb-10">
                  <div className="section-label mb-4 inline-flex"><Wand2 size={12} /> AI Project Builder</div>
                  <h1 className="text-4xl font-black mb-3">What are you building?</h1>
                  <p className="text-slate-400">Describe your app in plain English and AI will generate the complete codebase.</p>
                </div>

                <div className="space-y-6">
                  {/* Project Name */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Project Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => update('name', e.target.value)}
                      placeholder="e.g. SchoolMaster Pro"
                      className="input-field text-lg"
                      id="project-name"
                    />
                  </div>

                  {/* Prompt */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Project Description <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      value={form.prompt}
                      onChange={(e) => update('prompt', e.target.value)}
                      placeholder="Describe what you want to build in detail. Include features, user roles, and any specific requirements..."
                      className="input-field resize-none text-sm"
                      rows={5}
                      id="project-prompt"
                    />
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <span className="text-xs text-slate-500">Examples:</span>
                      {EXAMPLE_PROMPTS.slice(0, 2).map((p, i) => (
                        <button
                          key={i}
                          onClick={() => update('prompt', p)}
                          className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
                        >
                          Use example {i + 1}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Framework */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">Framework</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {FRAMEWORKS.map((fw) => (
                        <button
                          key={fw.id}
                          onClick={() => update('framework', fw.id)}
                          className={`p-3 rounded-xl text-left border transition-all ${
                            form.framework === fw.id
                              ? 'border-brand-600 bg-brand-600/15 shadow-brand'
                              : 'border-white/8 bg-white/3 hover:border-white/20 hover:bg-white/6'
                          }`}
                          id={`framework-${fw.id}`}
                        >
                          <div className="text-xl mb-1">{fw.emoji}</div>
                          <div className="text-sm font-semibold">{fw.label}</div>
                          <div className="text-xs text-slate-500">{fw.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* AI Model */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">AI Model</label>
                    <div className="relative">
                      <select
                        value={form.model}
                        onChange={(e) => update('model', e.target.value)}
                        className="input-field appearance-none pr-10"
                        id="ai-model"
                      >
                        {MODELS.map((m) => (
                          <option key={m.id} value={m.id} style={{ background: '#1a1a26' }}>
                            {m.name} ({m.provider}) — {m.tier === 'pro' ? '⭐ Pro' : '✓ Free'}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    </div>
                  </div>

                  {/* Optional API Key */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      OpenRouter API Key <span className="text-slate-500 font-normal">(optional — uses demo mode if empty)</span>
                    </label>
                    <input
                      type="password"
                      value={form.apiKey}
                      onChange={(e) => update('apiKey', e.target.value)}
                      placeholder="sk-or-..."
                      className="input-field font-mono text-sm"
                      id="api-key"
                    />
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={!form.name || !form.prompt}
                    className="btn-brand w-full justify-center py-4 text-base disabled:opacity-40 disabled:cursor-not-allowed"
                    id="generate-btn"
                  >
                    <Wand2 size={18} /> Generate Project
                    <ArrowRight size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <div className="mb-8">
                  {generatedData ? (
                    <CheckCircle size={64} className="text-emerald-400 mx-auto mb-4" />
                  ) : (
                    <div className="relative mx-auto w-20 h-20 mb-4">
                      <div className="w-20 h-20 rounded-full border-4 border-brand-600/20 animate-pulse" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Wand2 size={32} className="text-brand-400 animate-bounce" />
                      </div>
                    </div>
                  )}

                  <h2 className="text-3xl font-black mb-2">
                    {generatedData ? 'Project Ready!' : 'Generating your project...'}
                  </h2>
                  <p className="text-slate-400">{progress}</p>
                </div>

                {/* Progress steps */}
                <div className="space-y-3 max-w-sm mx-auto mb-8">
                  {[
                    { icon: Zap, label: 'Analyzing requirements' },
                    { icon: Code2, label: 'Generating files' },
                    { icon: Database, label: 'Creating schema' },
                    { icon: Globe, label: 'Building components' },
                  ].map((step, i) => (
                    <motion.div
                      key={step.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.15 }}
                      className="flex items-center gap-3 glass-light rounded-xl px-4 py-3"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        generatedData ? 'bg-emerald-500/20' : 'bg-brand-600/20'
                      }`}>
                        {generatedData
                          ? <CheckCircle size={16} className="text-emerald-400" />
                          : <step.icon size={16} className="text-brand-400" />
                        }
                      </div>
                      <span className="text-sm text-slate-300">{step.label}</span>
                      {!generatedData && (
                        <Loader2 size={14} className="ml-auto text-slate-500 animate-spin" />
                      )}
                    </motion.div>
                  ))}
                </div>

                {generatedData && (
                  <div className="glass rounded-2xl p-6 text-left">
                    <h3 className="font-bold mb-3">Generated {generatedData.files?.length || 0} files</h3>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                      {(generatedData.files || []).slice(0, 8).map((f) => (
                        <div key={f.path} className="flex items-center gap-1.5 truncate">
                          <span>📄</span> {f.path}
                        </div>
                      ))}
                      {(generatedData.files || []).length > 8 && (
                        <div className="text-brand-400">+{generatedData.files.length - 8} more</div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

// Demo project for when no API key is configured
function buildDemoProject(form) {
  const isSchool = form.prompt.toLowerCase().includes('school')
  const prefix = isSchool ? 'school' : 'app'

  return {
    summary: `A complete ${form.framework} application: ${form.name}`,
    requirements: ['User authentication', 'Dashboard', 'Data management', 'Responsive UI', 'API integration'],
    features: ['Authentication with JWT', 'Role-based access control', 'Data CRUD operations', 'Modern responsive design', 'Real-time updates'],
    folderStructure: `${form.name}/\n├── src/\n│   ├── components/\n│   ├── pages/\n│   ├── services/\n│   └── utils/\n├── backend/\n│   ├── routes/\n│   ├── models/\n│   └── middleware/\n└── package.json`,
    databaseSchema: `CREATE TABLE users (id UUID PRIMARY KEY, email TEXT, name TEXT, role TEXT, created_at TIMESTAMPTZ DEFAULT NOW());\nCREATE TABLE records (id UUID PRIMARY KEY, user_id UUID REFERENCES users(id), title TEXT, data JSONB, created_at TIMESTAMPTZ DEFAULT NOW());`,
    files: [
      { path: 'package.json', type: 'json', content: JSON.stringify({ name: form.name.toLowerCase().replace(/\s+/g, '-'), version: '1.0.0', dependencies: { react: '^18.2.0', 'react-dom': '^18.2.0', 'react-router-dom': '^6.22.0' } }, null, 2) },
      { path: 'README.md', type: 'md', content: `# ${form.name}\n\n${form.prompt}\n\n## Getting Started\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\nGenerated by [IkoBuild](https://ikobuild.app)` },
      { path: 'src/App.jsx', type: 'jsx', content: `import React from 'react';\nimport { BrowserRouter, Routes, Route } from 'react-router-dom';\nimport Dashboard from './pages/Dashboard';\nimport Login from './pages/Login';\n\nexport default function App() {\n  return (\n    <BrowserRouter>\n      <Routes>\n        <Route path="/" element={<Dashboard />} />\n        <Route path="/login" element={<Login />} />\n      </Routes>\n    </BrowserRouter>\n  );\n}` },
      { path: 'src/pages/Dashboard.jsx', type: 'jsx', content: `import React from 'react';\n\nexport default function Dashboard() {\n  return (\n    <div className="min-h-screen bg-gray-50">\n      <header className="bg-white shadow">\n        <div className="max-w-7xl mx-auto px-4 py-6">\n          <h1 className="text-3xl font-bold text-gray-900">${form.name}</h1>\n        </div>\n      </header>\n      <main className="max-w-7xl mx-auto px-4 py-8">\n        <p>Welcome to ${form.name}. Your AI-generated app is ready!</p>\n      </main>\n    </div>\n  );\n}` },
      { path: 'src/pages/Login.jsx', type: 'jsx', content: `import React, { useState } from 'react';\n\nexport default function Login() {\n  const [email, setEmail] = useState('');\n  const [password, setPassword] = useState('');\n\n  return (\n    <div className="min-h-screen flex items-center justify-center bg-gray-50">\n      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow">\n        <h2 className="text-3xl font-bold text-center">Sign In</h2>\n        <form className="space-y-4">\n          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full px-4 py-3 border rounded-lg" />\n          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full px-4 py-3 border rounded-lg" />\n          <button className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold">Sign In</button>\n        </form>\n      </div>\n    </div>\n  );\n}` },
      { path: 'src/components/Navbar.jsx', type: 'jsx', content: `import React from 'react';\n\nexport default function Navbar({ title }) {\n  return (\n    <nav className="bg-white border-b px-6 py-4 flex items-center justify-between">\n      <span className="font-bold text-xl">{title}</span>\n      <button className="text-sm text-gray-500 hover:text-gray-800">Logout</button>\n    </nav>\n  );\n}` },
      { path: 'src/services/api.js', type: 'js', content: `const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';\n\nexport const api = {\n  get: (path) => fetch(\`\${BASE_URL}\${path}\`).then(r => r.json()),\n  post: (path, data) => fetch(\`\${BASE_URL}\${path}\`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),\n  put: (path, data) => fetch(\`\${BASE_URL}\${path}\`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),\n  delete: (path) => fetch(\`\${BASE_URL}\${path}\`, { method: 'DELETE' }).then(r => r.json()),\n};` },
      { path: 'src/index.css', type: 'css', content: `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\nbody { font-family: 'Inter', sans-serif; }` },
      { path: '.env.example', type: 'txt', content: `VITE_API_URL=http://localhost:3001\nVITE_SUPABASE_URL=your-supabase-url\nVITE_SUPABASE_ANON_KEY=your-anon-key` },
      { path: 'backend/server.js', type: 'js', content: `const express = require('express');\nconst cors = require('cors');\nconst app = express();\n\napp.use(cors());\napp.use(express.json());\n\napp.get('/health', (req, res) => res.json({ status: 'ok', app: '${form.name}' }));\n\napp.get('/api/records', (req, res) => {\n  res.json({ data: [], total: 0 });\n});\n\napp.listen(3001, () => console.log('Server running on port 3001'));` },
      { path: 'backend/package.json', type: 'json', content: JSON.stringify({ name: `${form.name.toLowerCase().replace(/\s+/g, '-')}-backend`, version: '1.0.0', main: 'server.js', scripts: { start: 'node server.js', dev: 'nodemon server.js' }, dependencies: { express: '^4.18.2', cors: '^2.8.5', dotenv: '^16.3.1' } }, null, 2) },
      { path: 'database/schema.sql', type: 'sql', content: `-- ${form.name} Database Schema\n-- Generated by IkoBuild\n\nCREATE TABLE IF NOT EXISTS users (\n  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\n  email TEXT UNIQUE NOT NULL,\n  name TEXT NOT NULL,\n  role TEXT DEFAULT 'user',\n  created_at TIMESTAMPTZ DEFAULT NOW(),\n  updated_at TIMESTAMPTZ DEFAULT NOW()\n);\n\nCREATE TABLE IF NOT EXISTS records (\n  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\n  user_id UUID REFERENCES users(id) ON DELETE CASCADE,\n  title TEXT NOT NULL,\n  data JSONB DEFAULT '{}',\n  status TEXT DEFAULT 'active',\n  created_at TIMESTAMPTZ DEFAULT NOW(),\n  updated_at TIMESTAMPTZ DEFAULT NOW()\n);\n\nCREATE INDEX idx_records_user_id ON records(user_id);\nCREATE INDEX idx_records_status ON records(status);` },
    ],
  }
}
