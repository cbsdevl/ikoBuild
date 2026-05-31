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
