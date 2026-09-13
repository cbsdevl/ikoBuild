import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

export default function DebugPage() {
  const { user, isAdmin, loading, profile, profileError } = useAuthStore()
  const [session, setSession]         = useState(null)
  const [profileRaw, setProfileRaw]   = useState(null)
  const [profileErr, setProfileErr]   = useState(null)
  const [checking, setChecking]       = useState(true)

  useEffect(() => {
    async function run() {
      // 1. Raw session
      const { data: { session: s } } = await supabase.auth.getSession()
      setSession(s)

      // 2. Direct profile query (bypasses store)
      if (s?.user?.id) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', s.user.id)
          .single()
        setProfileRaw(data)
        setProfileErr(error)
      }
      setChecking(false)
    }
    run()
  }, [])

  const row = (label, value, ok) => (
    <div className="flex items-start gap-3 py-2 border-b border-white/5">
      <span className="text-slate-500 w-44 shrink-0 text-sm">{label}</span>
      <span className={`text-sm font-mono ${ok === false ? 'text-red-400' : ok === true ? 'text-emerald-400' : 'text-slate-200'} break-all`}>
        {JSON.stringify(value)}
      </span>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-black mb-6">🔍 Auth Debug</h1>

        {checking ? (
          <p className="text-slate-500">Querying Supabase…</p>
        ) : (
          <div className="card space-y-0">
            <p className="text-xs text-slate-500 mb-4 font-mono uppercase tracking-wider">Store state</p>
            {row('loading',      loading,      loading === false)}
            {row('user.email',   user?.email ?? null, !!user)}
            {row('user.id',      user?.id ?? null)}
            {row('isAdmin',      isAdmin,      isAdmin === true)}
            {row('profileError', profileError, !profileError)}
            {row('profile.is_admin', profile?.is_admin ?? null, profile?.is_admin === true)}

            <p className="text-xs text-slate-500 mt-6 mb-4 font-mono uppercase tracking-wider">Direct Supabase query (bypasses store)</p>
            {row('session.user.email', session?.user?.email ?? null, !!session?.user)}
            {row('session.user.id',    session?.user?.id ?? null)}
            {row('profile raw',        profileRaw, !!profileRaw)}
            {row('profile.is_admin',   profileRaw?.is_admin ?? null, profileRaw?.is_admin === true)}
            {row('profile query error', profileErr ? `${profileErr.code}: ${profileErr.message}` : null, !profileErr)}
          </div>
        )}

        <p className="text-xs text-slate-600 mt-4">
          Visit <span className="text-slate-400 font-mono">/admin-debug</span> and share a screenshot of this page.
        </p>
      </div>
    </div>
  )
}
