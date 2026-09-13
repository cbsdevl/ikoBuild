import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Auth helpers
export const signUpWithEmail = async (email, password, fullName) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  })
  return { data, error }
}

export const signInWithEmail = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { data, error }
}

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/dashboard` },
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const resetPassword = async (email) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth?reset=true`,
  })
  return { data, error }
}

// Project CRUD
export const getProjects = async (userId) => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
  return { data, error }
}

export const createProject = async (project) => {
  const { data, error } = await supabase
    .from('projects')
    .insert(project)
    .select()
    .single()
  return { data, error }
}

export const updateProject = async (id, updates) => {
  const { data, error } = await supabase
    .from('projects')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export const deleteProject = async (id) => {
  const { error } = await supabase.from('projects').delete().eq('id', id)
  return { error }
}

// Project Files CRUD
export const getProjectFiles = async (projectId) => {
  const { data, error } = await supabase
    .from('project_files')
    .select('*')
    .eq('project_id', projectId)
    .order('path')
  return { data, error }
}

export const upsertProjectFile = async (file) => {
  const { data, error } = await supabase
    .from('project_files')
    .upsert(file, { onConflict: 'project_id,path' })
    .select()
    .single()
  return { data, error }
}

export const deleteProjectFile = async (id) => {
  const { error } = await supabase.from('project_files').delete().eq('id', id)
  return { error }
}

// Prompts
export const savePrompt = async (prompt) => {
  const { data, error } = await supabase
    .from('project_prompts')
    .insert(prompt)
    .select()
    .single()
  return { data, error }
}

export const getProjectPrompts = async (projectId) => {
  const { data, error } = await supabase
    .from('project_prompts')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at')
  return { data, error }
}

// Usage logs
export const logUsage = async (log) => {
  const { error } = await supabase.from('usage_logs').insert(log)
  return { error }
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export const getProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return { data, error }
}

// ─── Admin helpers ────────────────────────────────────────────────────────────

/** Fetch all user profiles (admin only — requires is_admin RLS policy) */
export const adminGetAllUsers = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, subscriptions(plan, status, projects_limit, ai_requests_limit)')
    .order('created_at', { ascending: false })
  return { data, error }
}

/** Fetch all projects across all users (admin only) */
export const adminGetAllProjects = async () => {
  const { data, error } = await supabase
    .from('projects')
    .select('*, profiles(email, full_name)')
    .order('created_at', { ascending: false })
    .limit(200)
  return { data, error }
}

/** Aggregate platform-level stats */
export const adminGetStats = async () => {
  const [usersRes, projectsRes, deploymentsRes, usageRes] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('projects').select('id', { count: 'exact', head: true }),
    supabase.from('deployments').select('id', { count: 'exact', head: true }),
    supabase.from('usage_logs').select('tokens_in, tokens_out'),
  ])

  const totalTokens = (usageRes.data || []).reduce(
    (sum, r) => sum + (r.tokens_in || 0) + (r.tokens_out || 0),
    0
  )

  return {
    users: usersRes.count ?? 0,
    projects: projectsRes.count ?? 0,
    deployments: deploymentsRes.count ?? 0,
    totalTokens,
    error: usersRes.error || projectsRes.error || deploymentsRes.error || usageRes.error,
  }
}

/** Fetch recent usage log entries with profile info */
export const adminGetRecentUsage = async (limit = 50) => {
  const { data, error } = await supabase
    .from('usage_logs')
    .select('*, profiles(email, full_name)')
    .order('created_at', { ascending: false })
    .limit(limit)
  return { data, error }
}

/** Update a user's subscription plan */
export const adminUpdateUserPlan = async (userId, plan) => {
  const limits = { free: { projects_limit: 3, ai_requests_limit: 50 }, pro: { projects_limit: 20, ai_requests_limit: 500 }, business: { projects_limit: 100, ai_requests_limit: 5000 } }
  const { error } = await supabase
    .from('subscriptions')
    .update({ plan, ...(limits[plan] || {}), updated_at: new Date().toISOString() })
    .eq('user_id', userId)
  return { error }
}

/** Promote or demote a user's admin status */
export const adminToggleAdmin = async (userId, isAdmin) => {
  const { error } = await supabase
    .from('profiles')
    .update({ is_admin: isAdmin, updated_at: new Date().toISOString() })
    .eq('id', userId)
  return { error }
}
