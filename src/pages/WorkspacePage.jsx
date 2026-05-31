import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Save, Play, Download, Rocket, Settings, ArrowLeft,
  Code2, Eye, Database, Cloud, Loader2, RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useProjectStore } from '@/store/projectStore'
import { useAuthStore } from '@/store/authStore'
import { getProjectFiles, upsertProjectFile } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import { generateZip, downloadBlob } from '@/lib/utils'
import FileExplorer from '@/components/workspace/FileExplorer'
import CodeEditor from '@/components/workspace/CodeEditor'
import AIChat from '@/components/workspace/AIChat'
import PreviewFrame from '@/components/preview/PreviewFrame'
import SchemaDesigner from '@/components/database/SchemaDesigner'
import DeployModal from '@/components/deploy/DeployModal'

const TABS = [
  { id: 'editor', label: 'Editor', icon: Code2 },
  { id: 'preview', label: 'Preview', icon: Eye },
  { id: 'database', label: 'Database', icon: Database },
  { id: 'deploy', label: 'Deploy', icon: Cloud },
]

export default function WorkspacePage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const {
    project, setProject, files, setFiles, activeFile,
    activeTab, setActiveTab, unsavedFiles, clearUnsaved,
  } = useProjectStore()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showDeploy, setShowDeploy] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(240)
  const [chatWidth, setChatWidth] = useState(340)
  const [chatOpen, setChatOpen] = useState(true)

  useEffect(() => {
    loadProject()
  }, [projectId])

  const loadProject = async () => {
    setLoading(true)
    try {
      // Load project metadata
      const { data: proj, error: projErr } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      if (projErr) throw projErr
      setProject(proj)

      // Load files
      const { data: fileData, error: fileErr } = await getProjectFiles(projectId)
      if (fileErr) throw fileErr
      setFiles(fileData || [])
    } catch (err) {
      // If Supabase not configured, use demo data from store
      if (!project) {
        toast.error('Could not load project — using demo mode')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSave = useCallback(async () => {
    if (unsavedFiles.size === 0) {
      toast('All files saved', { icon: '✓' })
      return
    }
    setSaving(true)
    const unsaved = files.filter((f) => unsavedFiles.has(f.path))
    for (const file of unsaved) {
      await upsertProjectFile({
        ...file,
        project_id: projectId,
      })
    }
    clearUnsaved()
    setSaving(false)
    toast.success(`Saved ${unsaved.length} file(s)`)
  }, [files, unsavedFiles, projectId, clearUnsaved])

  // Ctrl+S shortcut
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleSave])

  const handleDownload = async () => {
    if (!project || files.length === 0) return toast.error('No files to download')
    const blob = await generateZip(project, files)
    downloadBlob(blob, `${project.name || 'project'}.zip`)
    toast.success('ZIP downloaded!')
  }

  if (loading) {
    return (
      <div className="h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="text-brand-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-[#0a0a0f] flex flex-col overflow-hidden">
      {/* Top Toolbar */}
      <header className="glass border-b border-glass flex items-center px-4 h-12 gap-2 flex-shrink-0 z-30">
        {/* Left */}
        <button
          onClick={() => navigate('/dashboard')}
          className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/8 transition-all"
        >
          <ArrowLeft size={16} />
        </button>

        <div className="flex items-center gap-2 mr-2 border-r border-white/8 pr-3">
          <div className="w-5 h-5 rounded bg-gradient-to-br from-brand-600 to-blue-600 flex items-center justify-center">
            <Code2 size={11} className="text-white" />
          </div>
          <span className="text-sm font-semibold truncate max-w-[160px]">
            {project?.name || 'Untitled Project'}
          </span>
          {unsavedFiles.size > 0 && (
            <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" title="Unsaved changes" />
          )}
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-brand-600/20 text-brand-300 border border-brand-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              id={`tab-${tab.id}`}
            >
              <tab.icon size={13} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right actions */}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/8 transition-all border border-white/8"
            id="save-btn"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            Save
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/8 transition-all border border-white/8"
            id="download-btn"
          >
            <Download size={13} /> Download
          </button>

          <button
            onClick={() => setShowDeploy(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)', boxShadow: '0 0 12px rgba(124,58,237,0.3)' }}
            id="deploy-btn"
          >
            <Rocket size={13} /> Deploy
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — file explorer */}
        <aside
          style={{ width: sidebarWidth, minWidth: 180, maxWidth: 360 }}
          className="flex-shrink-0 border-r border-glass bg-surface-100 flex flex-col overflow-hidden"
        >
          <FileExplorer />
        </aside>

        {/* Center — main panel */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          <AnimatePresence mode="wait">
            {activeTab === 'editor' && (
              <motion.div key="editor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 overflow-hidden">
                <CodeEditor />
              </motion.div>
            )}
            {activeTab === 'preview' && (
              <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 overflow-hidden">
                <PreviewFrame />
              </motion.div>
            )}
            {activeTab === 'database' && (
              <motion.div key="database" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 overflow-hidden">
                <SchemaDesigner />
              </motion.div>
            )}
            {activeTab === 'deploy' && (
              <motion.div key="deploy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 overflow-hidden p-6">
                <DeployModal inline onClose={() => setActiveTab('editor')} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Right — AI Chat */}
        <AnimatePresence>
          {chatOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: chatWidth, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ minWidth: chatOpen ? 280 : 0, maxWidth: 420 }}
              className="flex-shrink-0 border-l border-glass bg-surface-100 overflow-hidden"
            >
              <AIChat onToggle={() => setChatOpen(false)} />
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Toggle chat button when closed */}
        {!chatOpen && (
          <button
            onClick={() => setChatOpen(true)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 flex items-center gap-1 px-2 py-4 rounded-l-lg bg-brand-600/80 text-white text-xs font-medium border border-brand-600/50"
            style={{ writingMode: 'vertical-rl' }}
          >
            AI Chat
          </button>
        )}
      </div>

      {/* Deploy modal */}
      <AnimatePresence>
        {showDeploy && (
          <DeployModal onClose={() => setShowDeploy(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
