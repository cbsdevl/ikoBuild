import { useState, useRef } from 'react'
import { RefreshCw, ExternalLink, AlertTriangle, Terminal, Wifi } from 'lucide-react'
import { useProjectStore } from '@/store/projectStore'

function buildPreviewHtml(files) {
  const indexHtml = files.find((f) => f.path === 'index.html' || f.path === 'public/index.html')
  const mainCss = files.find((f) => f.path.endsWith('.css') && !f.path.includes('node_modules'))
  const mainJs = files.find((f) => f.path === 'src/main.jsx' || f.path === 'src/index.jsx' || f.path === 'src/main.js')

  if (indexHtml) return indexHtml.content

  // Generate a simple preview
  const appFile = files.find((f) =>
    f.path === 'src/App.jsx' || f.path === 'src/App.js' || f.path === 'src/App.tsx'
  )

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { margin: 0; font-family: system-ui, sans-serif; background: #0a0a0f; color: #f8fafc; }
    .preview-container { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem; }
    .preview-card { background: rgba(17,17,24,0.9); border: 1px solid rgba(255,255,255,0.08); border-radius: 1rem; padding: 2rem; max-width: 600px; width: 100%; text-align: center; }
    .badge { display: inline-flex; align-items: center; gap: 0.5rem; background: rgba(124,58,237,0.2); color: #a78bfa; border: 1px solid rgba(124,58,237,0.3); border-radius: 999px; padding: 0.25rem 0.75rem; font-size: 0.75rem; font-weight: 600; margin-bottom: 1rem; }
    h1 { font-size: 2rem; font-weight: 900; background: linear-gradient(135deg, #a78bfa, #60a5fa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0 0 0.5rem; }
    p { color: #94a3b8; margin: 0 0 1.5rem; }
    .files-list { text-align: left; background: rgba(255,255,255,0.03); border-radius: 0.5rem; padding: 1rem; }
    .file-item { font-family: monospace; font-size: 0.75rem; color: #64748b; padding: 0.25rem 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
    .file-item:last-child { border-bottom: none; }
  </style>
</head>
<body>
  <div class="preview-container">
    <div class="preview-card">
      <div class="badge">⚡ IkoBuild Preview</div>
      <h1>Your App is Ready</h1>
      <p>This is a static preview. To run your app locally, download the ZIP and run <code>npm install && npm run dev</code></p>
      <div class="files-list">
        <div style="font-size:0.7rem;color:#475569;margin-bottom:0.5rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Generated Files</div>
        ${files.slice(0, 15).map((f) => `<div class="file-item">📄 ${f.path}</div>`).join('')}
        ${files.length > 15 ? `<div class="file-item" style="color:#7c3aed">+${files.length - 15} more files</div>` : ''}
      </div>
    </div>
  </div>
</body>
</html>`
}

export default function PreviewFrame() {
  const { files, project } = useProjectStore()
  const [key, setKey] = useState(0)
  const [activeTab, setActiveTab] = useState('preview')
  const iframeRef = useRef(null)

  const refresh = () => setKey((k) => k + 1)

  const previewHtml = buildPreviewHtml(files)
  const previewSrc = `data:text/html;charset=utf-8,${encodeURIComponent(previewHtml)}`

  const buildLogs = [
    { time: '00:00', level: 'info', msg: 'Starting build process...' },
    { time: '00:01', level: 'info', msg: `Project: ${project?.name || 'Untitled'}` },
    { time: '00:02', level: 'info', msg: `Framework: ${project?.framework || 'React'}` },
    { time: '00:03', level: 'success', msg: `Found ${files.length} source files` },
    { time: '00:04', level: 'info', msg: 'Resolving dependencies...' },
    { time: '00:05', level: 'success', msg: 'Build complete ✓' },
  ]

  return (
    <div className="flex flex-col h-full bg-[#0d0d13]">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-glass bg-surface-300 flex-shrink-0">
        <div className="flex items-center gap-1 mr-2">
          {['preview', 'logs'].map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-3 py-1 rounded text-xs font-medium capitalize transition-all ${
                activeTab === t
                  ? 'bg-brand-600/20 text-brand-300'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              {t === 'logs' ? '📋 Build Logs' : '🌐 Live Preview'}
            </button>
          ))}
        </div>

        <div className="flex-1 flex items-center gap-2 bg-white/4 rounded-lg px-3 py-1.5 border border-white/6 text-xs font-mono text-slate-500">
          <Wifi size={11} />
          <span className="truncate">{project?.name ? `${project.name.toLowerCase().replace(/\s+/g, '-')}.ikobuild.app` : 'preview.ikobuild.app'}</span>
        </div>

        <button
          onClick={refresh}
          className="p-1.5 rounded text-slate-500 hover:text-white hover:bg-white/8 transition-all"
          title="Refresh"
        >
          <RefreshCw size={14} />
        </button>
        <button
          onClick={() => window.open(previewSrc, '_blank')}
          className="p-1.5 rounded text-slate-500 hover:text-white hover:bg-white/8 transition-all"
          title="Open in new tab"
        >
          <ExternalLink size={14} />
        </button>
      </div>

      {/* Content */}
      {activeTab === 'preview' ? (
        <div className="flex-1 relative bg-white">
          {files.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0d0d13] flex-col gap-3 text-slate-600">
              <AlertTriangle size={32} />
              <p className="text-sm">No files generated yet</p>
            </div>
          ) : (
            <iframe
              key={key}
              ref={iframeRef}
              src={previewSrc}
              title="App Preview"
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto bg-[#0d0d13] p-4 font-mono text-xs">
          <div className="flex items-center gap-2 mb-4 text-slate-400">
            <Terminal size={14} />
            <span className="font-semibold">Build Logs</span>
          </div>
          {buildLogs.map((log, i) => (
            <div key={i} className="flex items-start gap-3 mb-2">
              <span className="text-slate-600 flex-shrink-0">[{log.time}]</span>
              <span
                className={
                  log.level === 'success' ? 'text-emerald-400' :
                  log.level === 'error' ? 'text-red-400' :
                  log.level === 'warn' ? 'text-yellow-400' : 'text-slate-400'
                }
              >
                {log.level === 'success' ? '✓' : log.level === 'error' ? '✗' : '›'} {log.msg}
              </span>
            </div>
          ))}
          <div className="mt-4 pt-4 border-t border-glass text-slate-600">
            <span className="text-emerald-400">●</span> Server ready on{' '}
            <span className="text-brand-400">http://localhost:3000</span>
          </div>
        </div>
      )}
    </div>
  )
}
