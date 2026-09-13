import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Code2, Users, FolderOpen, Rocket, Zap, Shield, LogOut,
  Search, ChevronDown, BarChart3, Activity, ArrowLeft,
  Crown, UserX, RefreshCw, AlertCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import {
  adminGetStats,
  adminGetAllUsers,
  adminGetAllProjects,
  adminGetRecentUsage,
  adminUpdateUserPlan,
  adminToggleAdmin,
} from '@/lib/supabase'
import { timeAgo, truncate } from '@/lib/utils'

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'users',    label: 'Users',    icon: Users },
  { id: 'projects', label: 'Projects', icon: FolderOpen },
  { id: 'usage',    label: 'Usage',    icon: Activity },
]

const PLAN_COLORS = {
  free: 'badge-purple',
  pro: 'badge-blue',
  business: 'badge-green',
}

const STATUS_COLORS = {
  active: 'badge-green',
  draft: 'badge-orange',
  deployed: 'badge-blue',
  error: 'badge-orange',
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="card"
    >
      <div className="flex items-center justify-between mb-3">
        <Icon size={18} className={color} />
        <Shield size={12} className="text-slate-700" />
      </div>
      <div className="text-3xl font-black mb-1">{value?.toLocaleString()}</div>
      <div className="text-slate-500 text-sm">{label}</div>
    </motion.div>
  )
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ stats, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="card h-32 skeleton" />)}
      </div>
    )
  }

  const cards = [
    { label: 'Total Users',    value: stats.users,       icon: Users,      color: 'text-brand-400' },
    { label: 'Total Projects', value: stats.projects,    icon: FolderOpen, color: 'text-blue-400' },
    { label: 'Deployments',    value: stats.deployments, icon: Rocket,     color: 'text-emerald-400' },
    { label: 'Total Tokens',   value: stats.totalTokens, icon: Zap,        color: 'text-yellow-400' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c, i) => <StatCard key={c.label} {...c} delay={i * 0.07} />)}
    </div>
  )
}

// ─── Users Tab ────────────────────────────────────────────────────────────────
function UsersTab({ users, loading, onPlanChange, onToggleAdmin }) {
  const [search, setSearch] = useState('')
  const { user: self } = useAuthStore()

  const filtered = users.filter((u) =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => <div key={i} className="card h-14 skeleton" />)}
      </div>
    )
  }

  return (
    <div>
      {/* Search */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full pl-9 pr-4 py-2.5 bg-white/4 border border-glass rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-600/60 transition-colors"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-glass text-slate-500 text-left">
              <th className="pb-3 pr-4 font-medium">User</th>
              <th className="pb-3 pr-4 font-medium">Plan</th>
              <th className="pb-3 pr-4 font-medium hidden md:table-cell">Joined</th>
              <th className="pb-3 pr-4 font-medium hidden lg:table-cell">Limits</th>
              <th className="pb-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-glass">
            {filtered.map((u) => {
              const sub = u.subscriptions
              const plan = sub?.plan || 'free'
              const isSelf = u.id === self?.id
              return (
                <tr key={u.id} className="hover:bg-white/2 transition-colors">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-600 to-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                        {u.email?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="font-medium text-white leading-tight flex items-center gap-1.5">
                          {u.full_name || '—'}
                          {u.is_admin && <Crown size={11} className="text-yellow-400" />}
                          {isSelf && <span className="text-xs text-brand-400">(you)</span>}
                        </div>
                        <div className="text-xs text-slate-500 truncate max-w-[180px]">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`badge ${PLAN_COLORS[plan] || 'badge-purple'} text-xs`}>
                      {plan}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-slate-500 hidden md:table-cell">
                    {timeAgo(u.created_at)}
                  </td>
                  <td className="py-3 pr-4 text-slate-500 text-xs hidden lg:table-cell">
                    {sub ? `${sub.projects_limit} proj · ${sub.ai_requests_limit} AI` : '—'}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center justify-end gap-2">
                      {/* Plan selector */}
                      <select
                        value={plan}
                        onChange={(e) => onPlanChange(u.id, e.target.value)}
                        className="text-xs bg-white/5 border border-glass rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:border-brand-600/60 cursor-pointer"
                      >
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                        <option value="business">Business</option>
                      </select>
                      {/* Admin toggle */}
                      {!isSelf && (
                        <button
                          onClick={() => onToggleAdmin(u.id, !u.is_admin)}
                          title={u.is_admin ? 'Remove admin' : 'Make admin'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            u.is_admin
                              ? 'text-yellow-400 hover:bg-yellow-500/10'
                              : 'text-slate-600 hover:text-slate-300 hover:bg-white/5'
                          }`}
                        >
                          {u.is_admin ? <Crown size={14} /> : <UserX size={14} />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center text-slate-600 py-10">No users found</p>
        )}
      </div>
    </div>
  )
}

// ─── Projects Tab ─────────────────────────────────────────────────────────────
function ProjectsTab({ projects, loading }) {
  const [search, setSearch] = useState('')

  const filtered = projects.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.profiles?.email?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => <div key={i} className="card h-14 skeleton" />)}
      </div>
    )
  }

  return (
    <div>
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by project name or owner email…"
          className="w-full pl-9 pr-4 py-2.5 bg-white/4 border border-glass rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-600/60 transition-colors"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-glass text-slate-500 text-left">
              <th className="pb-3 pr-4 font-medium">Project</th>
              <th className="pb-3 pr-4 font-medium hidden md:table-cell">Owner</th>
              <th className="pb-3 pr-4 font-medium">Framework</th>
              <th className="pb-3 pr-4 font-medium">Status</th>
              <th className="pb-3 font-medium hidden lg:table-cell">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-glass">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-white/2 transition-colors">
                <td className="py-3 pr-4">
                  <div className="font-medium text-white">{p.name}</div>
                  <div className="text-xs text-slate-600 mt-0.5">{truncate(p.description, 50)}</div>
                </td>
                <td className="py-3 pr-4 text-slate-400 text-xs hidden md:table-cell">
                  {p.profiles?.email || '—'}
                </td>
                <td className="py-3 pr-4">
                  <span className="badge badge-purple text-xs">{p.framework}</span>
                </td>
                <td className="py-3 pr-4">
                  <span className={`badge ${STATUS_COLORS[p.status] || 'badge-purple'} text-xs`}>
                    {p.status}
                  </span>
                </td>
                <td className="py-3 text-slate-500 text-xs hidden lg:table-cell">
                  {timeAgo(p.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center text-slate-600 py-10">No projects found</p>
        )}
      </div>
    </div>
  )
}

// ─── Usage Tab ────────────────────────────────────────────────────────────────
function UsageTab({ usage, loading }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(8)].map((_, i) => <div key={i} className="card h-14 skeleton" />)}
      </div>
    )
  }

  const ACTION_COLORS = {
    generate: 'text-brand-400',
    chat:     'text-blue-400',
    deploy:   'text-emerald-400',
    download: 'text-yellow-400',
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-glass text-slate-500 text-left">
            <th className="pb-3 pr-4 font-medium">User</th>
            <th className="pb-3 pr-4 font-medium">Action</th>
            <th className="pb-3 pr-4 font-medium hidden md:table-cell">Model</th>
            <th className="pb-3 pr-4 font-medium hidden lg:table-cell">Tokens In</th>
            <th className="pb-3 pr-4 font-medium hidden lg:table-cell">Tokens Out</th>
            <th className="pb-3 font-medium">When</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-glass">
          {usage.map((row) => (
            <tr key={row.id} className="hover:bg-white/2 transition-colors">
              <td className="py-3 pr-4 text-slate-400 text-xs">
                {row.profiles?.email || row.user_id?.slice(0, 8) + '…'}
              </td>
              <td className="py-3 pr-4">
                <span className={`font-medium ${ACTION_COLORS[row.action] || 'text-slate-300'}`}>
                  {row.action}
                </span>
              </td>
              <td className="py-3 pr-4 text-slate-500 text-xs hidden md:table-cell">
                {row.model || '—'}
              </td>
              <td className="py-3 pr-4 text-slate-500 hidden lg:table-cell">
                {(row.tokens_in || 0).toLocaleString()}
              </td>
              <td className="py-3 pr-4 text-slate-500 hidden lg:table-cell">
                {(row.tokens_out || 0).toLocaleString()}
              </td>
              <td className="py-3 text-slate-600 text-xs">{timeAgo(row.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {usage.length === 0 && (
        <p className="text-center text-slate-600 py-10">No usage data yet</p>
      )}
    </div>
  )
}

// ─── Main AdminPage ───────────────────────────────────────────────────────────
export default function AdminPage() {
  const { user, isAdmin, signOut } = useAuthStore()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')

  const [stats,    setStats]    = useState({ users: 0, projects: 0, deployments: 0, totalTokens: 0 })
  const [users,    setUsers]    = useState([])
  const [projects, setProjects] = useState([])
  const [usage,    setUsage]    = useState([])

  const [loadingStats,    setLoadingStats]    = useState(true)
  const [loadingUsers,    setLoadingUsers]    = useState(false)
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [loadingUsage,    setLoadingUsage]    = useState(false)

  // Load overview stats on mount
  useEffect(() => {
    loadStats()
  }, [])

  // Load tab data on demand
  useEffect(() => {
    if (activeTab === 'users' && users.length === 0)       loadUsers()
    if (activeTab === 'projects' && projects.length === 0) loadProjects()
    if (activeTab === 'usage' && usage.length === 0)       loadUsage()
  }, [activeTab])

  const loadStats = async () => {
    setLoadingStats(true)
    const result = await adminGetStats()
    if (result.error) toast.error('Failed to load stats')
    else setStats(result)
    setLoadingStats(false)
  }

  const loadUsers = async () => {
    setLoadingUsers(true)
    const { data, error } = await adminGetAllUsers()
    if (error) toast.error('Failed to load users')
    else setUsers(data || [])
    setLoadingUsers(false)
  }

  const loadProjects = async () => {
    setLoadingProjects(true)
    const { data, error } = await adminGetAllProjects()
    if (error) toast.error('Failed to load projects')
    else setProjects(data || [])
    setLoadingProjects(false)
  }

  const loadUsage = async () => {
    setLoadingUsage(true)
    const { data, error } = await adminGetRecentUsage()
    if (error) toast.error('Failed to load usage')
    else setUsage(data || [])
    setLoadingUsage(false)
  }

  const handlePlanChange = async (userId, plan) => {
    const { error } = await adminUpdateUserPlan(userId, plan)
    if (error) {
      toast.error('Failed to update plan')
    } else {
      toast.success(`Plan updated to ${plan}`)
      setUsers((u) =>
        u.map((usr) =>
          usr.id === userId
            ? { ...usr, subscriptions: { ...usr.subscriptions, plan } }
            : usr
        )
      )
    }
  }

  const handleToggleAdmin = async (userId, makeAdmin) => {
    const { error } = await adminToggleAdmin(userId, makeAdmin)
    if (error) {
      toast.error('Failed to update admin status')
    } else {
      toast.success(makeAdmin ? 'User promoted to admin' : 'Admin access removed')
      setUsers((u) =>
        u.map((usr) => (usr.id === userId ? { ...usr, is_admin: makeAdmin } : usr))
      )
    }
  }

  const handleRefresh = () => {
    loadStats()
    if (activeTab === 'users')    loadUsers()
    if (activeTab === 'projects') loadProjects()
    if (activeTab === 'usage')    loadUsage()
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Top Nav */}
      <nav className="glass border-b border-glass sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm">
              <ArrowLeft size={14} />
              Dashboard
            </Link>
            <div className="w-px h-4 bg-glass" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-brand">
                <Shield size={14} className="text-white" />
              </div>
              <span className="font-bold">Admin Panel</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              title="Refresh data"
            >
              <RefreshCw size={15} />
            </button>
            <div className="relative group">
              <button className="flex items-center gap-2 glass-light rounded-xl px-3 py-2 text-sm hover:bg-white/8 transition-colors">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-xs font-bold">
                  {user?.email?.[0]?.toUpperCase() || 'A'}
                </div>
                <span className="text-slate-300 hidden sm:block truncate max-w-[120px]">
                  {user?.user_metadata?.full_name || user?.email}
                </span>
              </button>
              <div className="absolute right-0 top-full mt-2 w-44 glass rounded-xl border border-glass py-1 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity shadow-elevated">
                <div className="px-3 py-2 border-b border-glass">
                  <div className="text-xs text-yellow-400 font-medium flex items-center gap-1">
                    <Crown size={11} /> Admin
                  </div>
                  <div className="text-xs text-slate-500 truncate">{user?.email}</div>
                </div>
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
        <div className="mb-8">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-black mb-1"
          >
            Admin <span className="gradient-text">Control Panel</span>
          </motion.h1>
          <p className="text-slate-400 text-sm">Platform management and oversight.</p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-8 bg-white/3 border border-glass rounded-xl p-1 w-fit">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-brand-600 text-white shadow-brand'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
        >
          {activeTab === 'overview' && (
            <OverviewTab stats={stats} loading={loadingStats} />
          )}
          {activeTab === 'users' && (
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-lg">All Users</h2>
                <span className="text-sm text-slate-500">{users.length} total</span>
              </div>
              <UsersTab
                users={users}
                loading={loadingUsers}
                onPlanChange={handlePlanChange}
                onToggleAdmin={handleToggleAdmin}
              />
            </div>
          )}
          {activeTab === 'projects' && (
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-lg">All Projects</h2>
                <span className="text-sm text-slate-500">{projects.length} total</span>
              </div>
              <ProjectsTab projects={projects} loading={loadingProjects} />
            </div>
          )}
          {activeTab === 'usage' && (
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-lg">Recent Activity</h2>
                <span className="text-sm text-slate-500">Last 50 entries</span>
              </div>
              <UsageTab usage={usage} loading={loadingUsage} />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
