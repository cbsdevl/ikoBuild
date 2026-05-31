import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Plus, FolderOpen, Rocket, Zap, Code2, MoreVertical,
  Trash2, ExternalLink, Clock, LogOut, Settings, User,
  TrendingUp, Activity, Database
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { getProjects, deleteProject } from '@/lib/supabase'
import { timeAgo, getFrameworkColor, truncate } from '@/lib/utils'

const FRAMEWORK_EMOJIS = {
  React: '⚛️', 'Next.js': '▲', Vue: '💚', Angular: '🔴',
  'Node.js': '🟢', Django: '🐍', FastAPI: '⚡', Laravel: '🔴',
}

const STATUS_COLORS = {
  active: 'badge-green',
  draft: 'badge-orange',
  deployed: 'badge-blue',
  error: 'badge-orange',
}

export default function DashboardPage() {
  const { user, signOut } = useAuthStore()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(null)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await getProjects(user.id)
    if (error) toast.error('Failed to load projects')
    else setProjects(data || [])
    setLoading(false)
  }

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (!confirm('Delete this project? This cannot be undone.')) return
    const { error } = await deleteProject(id)
    if (error) {
      toast.error('Failed to delete project')
    } else {
      toast.success('Project deleted')
      setProjects((p) => p.filter((proj) => proj.id !== id))
    }
    setMenuOpen(null)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const stats = [
    { label: 'Total Projects', value: projects.length, icon: FolderOpen, color: 'text-brand-400' },
    { label: 'Deployed', value: projects.filter((p) => p.status === 'deployed').length, icon: Rocket, color: 'text-emerald-400' },
    { label: 'AI Prompts Used', value: projects.length * 3, icon: Zap, color: 'text-yellow-400' },
    { label: 'Files Generated', value: projects.length * 24, icon: Code2, color: 'text-blue-400' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Top Nav */}
      <nav className="glass border-b border-glass sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-blue-600 flex items-center justify-center shadow-brand">
              <Code2 size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg">IkoBuild</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/projects/new')}
              className="btn-brand text-sm px-4 py-2"
              id="new-project-btn"
            >
              <Plus size={16} /> New Project
            </button>

            <div className="relative group">
              <button className="flex items-center gap-2 glass-light rounded-xl px-3 py-2 text-sm hover:bg-white/8 transition-colors">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-600 to-blue-600 flex items-center justify-center text-xs font-bold">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="text-slate-300 max-w-[120px] truncate hidden sm:block">
                  {user?.user_metadata?.full_name || user?.email}
                </span>
              </button>

              {/* Dropdown */}
              <div className="absolute right-0 top-full mt-2 w-48 glass rounded-xl border border-glass py-1 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity shadow-elevated">
                <div className="px-3 py-2 border-b border-glass">
                  <div className="text-xs text-slate-500 truncate">{user?.email}</div>
                </div>
                <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
                  <Settings size={14} /> Settings
                </button>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors"
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-10">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-black mb-2"
          >
            Welcome back,{' '}
            <span className="gradient-text">
              {user?.user_metadata?.full_name?.split(' ')[0] || 'Builder'}
            </span>{' '}
            👋
          </motion.h1>
          <p className="text-slate-400">Here's what you've been building.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="card"
            >
              <div className="flex items-center justify-between mb-3">
                <s.icon size={18} className={s.color} />
                <TrendingUp size={14} className="text-slate-600" />
              </div>
              <div className="text-3xl font-black mb-1">{s.value}</div>
              <div className="text-slate-500 text-sm">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Projects */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Your Projects</h2>
          <span className="text-sm text-slate-500">{projects.length} total</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card h-48 skeleton" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card text-center py-20"
          >
            <div className="text-5xl mb-4">🚀</div>
            <h3 className="text-xl font-bold mb-2">No projects yet</h3>
            <p className="text-slate-400 mb-6">Build your first app with AI in seconds.</p>
            <button
              onClick={() => navigate('/projects/new')}
              className="btn-brand mx-auto"
              id="first-project-btn"
            >
              <Plus size={16} /> Create First Project
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* New project card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => navigate('/projects/new')}
              className="card border-dashed border-2 border-white/10 hover:border-brand-600/40 cursor-pointer flex flex-col items-center justify-center min-h-48 gap-3 text-slate-500 hover:text-slate-300 transition-all group"
              id="create-new-card"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-600/10 group-hover:bg-brand-600/20 border border-brand-600/20 flex items-center justify-center transition-colors">
                <Plus size={22} className="text-brand-400" />
              </div>
              <span className="font-semibold text-sm">New Project</span>
            </motion.div>

            {projects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="card cursor-pointer relative group"
                onClick={() => navigate(`/workspace/${project.id}`)}
              >
                {/* Menu */}
                <div className="absolute top-4 right-4" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setMenuOpen(menuOpen === project.id ? null : project.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/8 transition-all opacity-0 group-hover:opacity-100"
                    id={`project-menu-${project.id}`}
                  >
                    <MoreVertical size={16} />
                  </button>
                  {menuOpen === project.id && (
                    <div className="absolute right-0 top-8 w-40 glass rounded-xl border border-glass py-1 z-10 shadow-elevated">
                      <button
                        onClick={() => navigate(`/workspace/${project.id}`)}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <ExternalLink size={13} /> Open
                      </button>
                      <button
                        onClick={(e) => handleDelete(project.id, e)}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="mb-4">
                  <div className="text-2xl mb-2">
                    {FRAMEWORK_EMOJIS[project.framework] || '🚀'}
                  </div>
                  <h3 className="font-bold text-base mb-1 pr-8">{project.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{truncate(project.description, 80)}</p>
                </div>

                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2">
                    <span className={`badge ${getFrameworkColor(project.framework)} text-xs`}>
                      {project.framework}
                    </span>
                    <span className={`badge ${STATUS_COLORS[project.status] || 'badge-purple'} text-xs`}>
                      {project.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-600">
                    <Clock size={11} />
                    {timeAgo(project.updated_at)}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
