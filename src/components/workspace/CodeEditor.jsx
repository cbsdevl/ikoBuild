import { useEffect, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import { X, Circle } from 'lucide-react'
import { useProjectStore } from '@/store/projectStore'
import { getLanguage, getFileIcon, cn } from '@/lib/utils'

export default function CodeEditor() {
  const { files, activeFile, setActiveFile, updateFileContent, unsavedFiles } = useProjectStore()
  const [openTabs, setOpenTabs] = useState([])
  const editorRef = useRef(null)

  // Add tab when active file changes
  useEffect(() => {
    if (!activeFile) return
    setOpenTabs((prev) => {
      const exists = prev.find((t) => t.path === activeFile.path)
      if (exists) return prev
      return [...prev, activeFile]
    })
  }, [activeFile])

  const closeTab = (path, e) => {
    e.stopPropagation()
    setOpenTabs((prev) => {
      const next = prev.filter((t) => t.path !== path)
      if (activeFile?.path === path && next.length > 0) {
        setActiveFile(next[next.length - 1])
      } else if (next.length === 0) {
        setActiveFile(null)
      }
      return next
    })
  }

  const activeContent = files.find((f) => f.path === activeFile?.path)?.content || activeFile?.content || ''

  return (
    <div className="flex flex-col h-full bg-[#0d0d13]">
      {/* Tabs */}
      <div className="flex items-center overflow-x-auto scrollbar-none bg-surface-300 border-b border-glass flex-shrink-0">
        {openTabs.map((tab) => {
          const isActive = activeFile?.path === tab.path
          const isUnsaved = unsavedFiles.has(tab.path)
          const fileName = tab.path.split('/').pop()

          return (
            <div
              key={tab.path}
              onClick={() => setActiveFile(tab)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 border-r border-glass cursor-pointer flex-shrink-0 text-xs font-mono group transition-all',
                isActive
                  ? 'bg-[#0d0d13] text-slate-200 border-t border-t-brand-500'
                  : 'bg-surface-300 text-slate-500 hover:text-slate-300 hover:bg-surface-200'
              )}
              id={`tab-file-${tab.path.replace(/[/\.]/g, '-')}`}
            >
              <span>{getFileIcon(fileName)}</span>
              <span>{fileName}</span>
              {isUnsaved && (
                <Circle size={6} className="fill-orange-400 text-orange-400 flex-shrink-0" />
              )}
              <button
                onClick={(e) => closeTab(tab.path, e)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-white ml-0.5"
              >
                <X size={12} />
              </button>
            </div>
          )
        })}
      </div>

      {/* Editor */}
      {activeFile ? (
        <div className="flex-1 relative">
          {/* File path breadcrumb */}
          <div className="px-4 py-1.5 text-xs text-slate-600 font-mono border-b border-glass bg-surface-300 flex items-center gap-1">
            {activeFile.path.split('/').map((part, i, arr) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-slate-700">/</span>}
                <span className={i === arr.length - 1 ? 'text-slate-400' : 'text-slate-600'}>{part}</span>
              </span>
            ))}
          </div>

          <Editor
            key={activeFile.path}
            height="calc(100% - 28px)"
            language={getLanguage(activeFile.path)}
            value={activeContent}
            onChange={(value) => updateFileContent(activeFile.path, value || '')}
            onMount={(editor) => { editorRef.current = editor }}
            theme="vs-dark"
            options={{
              fontSize: 13,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              fontLigatures: true,
              lineHeight: 22,
              minimap: { enabled: true, maxColumn: 80 },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              automaticLayout: true,
              tabSize: 2,
              insertSpaces: true,
              formatOnPaste: true,
              formatOnType: true,
              suggestOnTriggerCharacters: true,
              quickSuggestions: true,
              bracketPairColorization: { enabled: true },
              guides: { bracketPairs: true, indentation: true },
              renderLineHighlight: 'line',
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              smoothScrolling: true,
              padding: { top: 12, bottom: 12 },
              lineNumbers: 'on',
              glyphMargin: false,
              folding: true,
              renderWhitespace: 'selection',
            }}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-600 select-none">
          <div className="text-5xl mb-4">📝</div>
          <p className="text-sm font-medium">No file open</p>
          <p className="text-xs mt-1">Select a file from the explorer</p>
        </div>
      )}
    </div>
  )
}
