const OPENROUTER_BASE = 'https://openrouter.ai/api/v1'

export const MODELS = [
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', tier: 'pro', provider: 'Anthropic' },
  { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', tier: 'free', provider: 'Anthropic' },
  { id: 'openai/gpt-4o', name: 'GPT-4o', tier: 'pro', provider: 'OpenAI' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', tier: 'free', provider: 'OpenAI' },
  { id: 'google/gemini-pro-1.5', name: 'Gemini 1.5 Pro', tier: 'pro', provider: 'Google' },
  { id: 'google/gemini-flash-1.5', name: 'Gemini 1.5 Flash', tier: 'free', provider: 'Google' },
  { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', tier: 'free', provider: 'Meta' },
  { id: 'deepseek/deepseek-coder', name: 'DeepSeek Coder', tier: 'free', provider: 'DeepSeek' },
]

export const DEFAULT_MODEL = MODELS[3].id // GPT-4o Mini for free tier

/**
 * Send a non-streaming chat request to OpenRouter
 */
export const chatCompletion = async ({ messages, model = DEFAULT_MODEL, apiKey }) => {
  const key = apiKey || import.meta.env.VITE_OPENROUTER_API_KEY
  if (!key) throw new Error('OpenRouter API key not configured')

  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'IkoBuild',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 8192,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `OpenRouter error: ${res.status}`)
  }

  const data = await res.json()
  return data.choices[0]?.message?.content || ''
}

/**
 * Streaming chat request — calls onChunk(text) with each streamed token
 */
export const streamingChatCompletion = async ({ messages, model = DEFAULT_MODEL, apiKey, onChunk, onDone }) => {
  const key = apiKey || import.meta.env.VITE_OPENROUTER_API_KEY
  if (!key) throw new Error('OpenRouter API key not configured')

  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'IkoBuild',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 8192,
      stream: true,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `OpenRouter error: ${res.status}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let fullText = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    const lines = chunk.split('\n').filter((l) => l.startsWith('data: '))

    for (const line of lines) {
      const json = line.slice(6).trim()
      if (json === '[DONE]') continue
      try {
        const parsed = JSON.parse(json)
        const delta = parsed.choices?.[0]?.delta?.content
        if (delta) {
          fullText += delta
          onChunk?.(delta, fullText)
        }
      } catch (_) {
        // ignore parse errors
      }
    }
  }

  onDone?.(fullText)
  return fullText
}

/**
 * Build the system prompt for project generation
 */
export const buildProjectSystemPrompt = (framework) => `
You are IkoBuild's expert AI software architect. Generate a complete, production-ready application.

FRAMEWORK: ${framework}

Respond with a VALID JSON object with this EXACT structure:
{
  "requirements": ["list of requirements"],
  "features": ["list of features"],
  "folderStructure": "ASCII tree of folders and files",
  "databaseSchema": "SQL CREATE TABLE statements",
  "files": [
    {
      "path": "relative/file/path.ext",
      "content": "full file content here",
      "type": "jsx|js|ts|css|json|sql|md"
    }
  ],
  "summary": "brief project description"
}

RULES:
- Generate REAL, working code — not placeholder comments
- Include ALL necessary files (components, routes, utils, styles, package.json, README)
- Use modern best practices and patterns
- Include proper error handling
- Make the UI beautiful with Tailwind CSS
- Return ONLY the JSON object, no markdown wrapper
`

/**
 * Build chat prompt for modifying a project
 */
export const buildEditSystemPrompt = (project, files) => `
You are IkoBuild's AI coding assistant. You are helping the user modify their project.

PROJECT: ${project.name}
FRAMEWORK: ${project.framework}
DESCRIPTION: ${project.description}

CURRENT FILES:
${files.slice(0, 20).map((f) => `- ${f.path}`).join('\n')}

When the user asks you to make changes:
1. Explain what you'll do briefly
2. Return a JSON block with updated/new files like:
\`\`\`json
{
  "files": [
    { "path": "src/components/NewComponent.jsx", "content": "...", "type": "jsx" }
  ],
  "message": "Brief description of changes made"
}
\`\`\`

Always write complete, working file contents. Never use placeholders.
`
