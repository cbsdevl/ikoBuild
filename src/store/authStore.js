import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'

// Admin emails from .env — no database needed
const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

console.log('[auth] admin emails configured:', ADMIN_EMAILS)

const isEmailAdmin = (email) =>
  !!email && ADMIN_EMAILS.includes(email.toLowerCase())

let authListenerUnsubscribe = null // prevent double-registration (React StrictMode)

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      loading: true,
      isAdmin: false,

      initialize: async () => {
        if (authListenerUnsubscribe) return // already initialized

        set({ loading: true })

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            const email = session?.user?.email ?? null
            const admin = isEmailAdmin(email)

            console.log(`[auth] event=${event} email=${email} isAdmin=${admin}`)

            set({
              session,
              user: session?.user ?? null,
              isAdmin: admin,
            })

            if (
              event === 'INITIAL_SESSION' ||
              event === 'SIGNED_IN' ||
              event === 'SIGNED_OUT'
            ) {
              set({ loading: false })
            }
          }
        )

        authListenerUnsubscribe = subscription
      },

      signOut: async () => {
        await supabase.auth.signOut()
        set({ user: null, session: null, isAdmin: false })
      },
    }),
    {
      name: 'ikobuild-auth',
      partialize: (state) => ({ user: state.user }),
    }
  )
)
