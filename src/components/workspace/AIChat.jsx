import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import {
  Send, Bot, User, X, Loader2, Sparkles, ChevronDown, Zap
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useProjectStore } from '@/store/projectStore'
import { useAuthStore } from '@/store/authStore'
import { streamingChatCompletion, buildEditSystemPrompt, DEFAULT_MODEL, MODELS } from '@/lib/openrouter'
import { parseAIJson, cn } from '@/lib/utils'
import { upsertProjectFile } from '@/lib/supabase'

const QUICK_PROMPTS = [
  'Add user authentication',
  'Create a dashboard',
  'Add a data table',
  'Generate API endpoints',
  'Add dark mode',
  'Fix all TypeScript errors',
]

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex gap-2.5 mb-4', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      {/* Avatar */}
      <div className={cn(
        'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
        isUser
          ? 'bg-brand-600/30 border border-brand-600/40'
          : 'bg-gradient-to-br from-brand-600 to-blue-600'
      )}>
        {isUser ? <User size={13} className="text-brand-300" /> : <Bot size={13} className="text-white" />}
      </div>

      {/* Content */}
      <div className={cn(
        'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm',
        isUser
          ? 'bg-brand-600/20 text-slate-200 rounded-tr-sm border border-brand-600/30'
          : 'glass-light text-slate-300 rounded-tl-sm border border-white/6'
      )}>
        {msg.streaming ? (
          <span>{msg.content}<span className="inline-block w-1.5 h-3.5 bg-brand-400 ml-0.5 animate-pulse" /></span>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '')
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={match[1]}
                    PreTag="div"
                    customStyle={{ borderRadius: '8px', fontSize: '11px', margin: '8px 0' }}
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className="bg-white/10 rounded px-1 py-0.5 font-mono text-xs" {...props}>
                    {children}
                  </code>
                )
              },
              p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
              ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-0.5">{children}</ul>,
              li: ({ children }) => <li className="text-slate-300">{children}</li>,
              strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
            }}
          >
            {msg.content}
          </ReactMarkdown>
        )}

        {/* File updates notification */}
        {msg.filesUpdated && msg.filesUpdated.length > 0 && (
          <div className="mt-2 pt-2 border-t border-white/8">
            <div className="text-xs text-brand-300 font-medium mb-1">Files updated:</div>
            {msg.filesUpdated.map((f) => (
              <div key={f.path} className="text-xs text-slate-500 font-mono truncate">
                📄 {f.path}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function AIChat({ onToggle }) {
  const { project, files, messages, addMessage, isGenerating, setGenerating, applyFileUpdates } = useProjectStore()
  const { user } = useAuthStore()
  const [input, setInput] = useState('')
  const [model, setModel] = useState(DEFAULT_MODEL)
  const [apiKey] = useState(import.meta.env.VITE_OPENROUTER_API_KEY || '')
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || isGenerating) return

    setInput('')
    addMessage({ role: 'user', content: text })

    if (!apiKey) {
      // Demo response
      setTimeout(() => {
        addMessage({
          role: 'assistant',
          content: `I'd love to help you with: **"${text}"**\n\nTo enable AI assistance, please add your **OpenRouter API key** in the project settings or as \`VITE_OPENROUTER_API_KEY\` in your \`.env\` file.\n\nGet a free key at [openrouter.ai](https://openrouter.ai) 🚀`,
        })
      }, 500)
      return
    }

    setGenerating(true)
    const msgId = Date.now()

    // Add streaming placeholder
    addMessage({ id: msgId, role: 'assistant', content: '', streaming: true })

    try {
      const systemPrompt = buildEditSystemPrompt(project, files)
      let fullResponse = ''

      await streamingChatCompletion({
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
          { role: 'user', content: text },
        ],
        model,
        apiKey,
        onChunk: (_, total) => {
          fullResponse = total
          // Update streaming message
          useProjectStore.setState((state) => ({
            messages: state.messages.map((m) =>
              m.id === msgId ? { ...m, content: total } : m
            ),
          }))
        },
      })

      // Try to extract file updates from response
      let filesUpdated = []
      try {
        const jsonMatch = fullResponse.match(/```json\s*([\s\S]*?)```/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[1])
          if (parsed.files?.length > 0) {
            filesUpdated = parsed.files
            // Apply file updates
            applyFileUpdates(parsed.files)
            for (const f of parsed.files) {
              if (project?.id) {
                await upsertProjectFile({ ...f, project_id: project.id })
              }
            }
          }
        }
      } catch (_) {}

      // Mark streaming done
      useProjectStore.setState((state) => ({
        messages: state.messages.map((m) =>
          m.id === msgId ? { ...m, streaming: false, filesUpdated } : m
        ),
      }))

      if (filesUpdated.length > 0) {
        toast.success(`Updated ${filesUpdated.length} file(s)`)
      }
    } catch (err) {
      toast.error('AI error: ' + err.message)
      useProjectStore.setState((state) => ({
        messages: state.messages.map((m) =>
          m.id === msgId ? { ...m, content: `Error: ${err.message}`, streaming: false } : m
        ),
      }))
    } finally {
      setGenerating(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-glass flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-brand-600 to-blue-600 flex items-center justify-center">
            <Sparkles size={12} className="text-white" />
          </div>
          <span className="text-sm font-semibold">AI Assistant</span>
          <span className="dot-live" />
        </div>
        <button
          onClick={onToggle}
          className="p-1 rounded text-slate-500 hover:text-white hover:bg-white/8 transition-all"
        >
          <X size={15} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-600 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-brand">
              <Bot size={22} className="text-white" />
            </div>
            <p className="text-sm font-semibold text-slate-300 mb-1">AI Project Assistant</p>
            <p className="text-xs text-slate-500">Ask me to add features, fix bugs, or generate code.</p>
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      {messages.length < 2 && (
        <div className="px-3 pb-2 flex gap-1.5 flex-wrap">
          {QUICK_PROMPTS.slice(0, 4).map((p) => (
            <button
              key={p}
              onClick={() => { setInput(p); textareaRef.current?.focus() }}
              className="text-xs px-2.5 py-1 rounded-full bg-brand-600/10 border border-brand-600/20 text-brand-300 hover:bg-brand-600/20 transition-colors"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-3 pb-3 border-t border-glass pt-3 flex-shrink-0">
        <div className="glass-light rounded-xl border border-white/8 focus-within:border-brand-600/40 transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask AI to modify your project..."
            rows={2}
            className="w-full bg-transparent px-3 pt-2.5 pb-1 text-sm text-slate-200 placeholder-slate-600 outline-none resize-none"
            id="ai-chat-input"
          />
          <div className="flex items-center justify-between px-3 pb-2">
            <span className="text-xs text-slate-600">Enter to send · Shift+Enter for newline</span>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isGenerating}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                input.trim() && !isGenerating
                  ? 'bg-brand-600 hover:bg-brand-500 text-white'
                  : 'bg-white/5 text-slate-600 cursor-not-allowed'
              )}
              id="chat-send-btn"
            >
              {isGenerating
                ? <Loader2 size={12} className="animate-spin" />
                : <Send size={12} />
              }
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
