import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      profile: null,
      loading: true,

      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setLoading: (loading) => set({ loading }),

      initialize: async () => {
        set({ loading: true })
        const { data: { session } } = await supabase.auth.getSession()
        set({
          session,
          user: session?.user ?? null,
          loading: false,
        })

        // Listen for auth changes
        supabase.auth.onAuthStateChange((_event, session) => {
          set({
            session,
            user: session?.user ?? null,
          })
        })
      },

      signOut: async () => {
        await supabase.auth.signOut()
        set({ user: null, session: null, profile: null })
      },
    }),
    {
      name: 'ikobuild-auth',
      partialize: (state) => ({ user: state.user }),
    }
  )
)
