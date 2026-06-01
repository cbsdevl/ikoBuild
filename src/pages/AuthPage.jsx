import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Code2, Mail, Lock, User, Eye, EyeOff, ArrowLeft, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  resetPassword,
} from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

export default function AuthPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [mode, setMode] = useState(searchParams.get('signup') === 'true' ? 'signup' : 'login')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })

  useEffect(() => {
    if (user) navigate('/dashboard')
  }, [user, navigate])

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await signInWithEmail(form.email, form.password)
    setLoading(false)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Welcome back!')
      navigate('/dashboard')
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    if (!form.name) return toast.error('Please enter your name')
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters')
    setLoading(true)
    const { error } = await signUpWithEmail(form.email, form.password, form.name)
    setLoading(false)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Account created! Check your email to verify.')
      setMode('login')
    }
  }

  const handleGoogle = async () => {
    const { error } = await signInWithGoogle()
    if (error) toast.error(error.message)
  }

  const handleReset = async (e) => {
    e.preventDefault()
    if (!form.email) return toast.error('Enter your email address')
    setLoading(true)
    const { error } = await resetPassword(form.email)
    setLoading(false)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Password reset email sent!')
      setMode('login')
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden bg-gradient-to-br from-brand-900/40 to-blue-900/30">
        <div className="absolute inset-0 bg-gradient-glow opacity-50" />
        <div className="relative flex flex-col h-full p-12">
          <Link to="/" className="flex items-center gap-2.5 mb-auto">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-blue-600 flex items-center justify-center shadow-brand">
              <Code2 size={18} className="text-white" />
            </div>
            <span className="font-bold text-xl">IkoBuild</span>
          </Link>

          <div className="mb-auto">
            <h2 className="text-4xl font-black mb-4 leading-tight">
              Build complete software<br />
              <span className="gradient-text">with a single prompt</span>
            </h2>
            <p className="text-slate-400 text-lg mb-10">
              Join thousands of developers shipping faster with AI.
            </p>

            <div className="space-y-4">
              {[
                '⚡ Generate full-stack apps from natural language',
                '🎨 Monaco editor with AI assistance',
                '🚀 Deploy in one click to IkoBuild hosting',
                '🔒 Your code, your ownership — always',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-slate-300 text-sm">
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-slate-600 text-xs">© 2025 IkoBuild. All rights reserved.</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
            <ArrowLeft size={16} /> Back to home
          </Link>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {mode === 'login' && (
                <>
                  <h1 className="text-3xl font-black mb-2">Welcome back</h1>
                  <p className="text-slate-400 mb-8">Sign in to your IkoBuild account</p>

                  <button onClick={handleGoogle} className="btn-ghost w-full justify-center mb-6 gap-3">
                    <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/><path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.96L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
                    Continue with Google
                  </button>

                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex-1 h-px bg-white/8" />
                    <span className="text-xs text-slate-500">or</span>
                    <div className="flex-1 h-px bg-white/8" />
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1.5">Email</label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          type="email" required
                          value={form.email}
                          onChange={(e) => update('email', e.target.value)}
                          placeholder="you@example.com"
                          className="input-field pl-10"
                          id="login-email"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1.5">Password</label>
                      <div className="relative">
                        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          type={showPassword ? 'text' : 'password'} required
                          value={form.password}
                          onChange={(e) => update('password', e.target.value)}
                          placeholder="••••••••"
                          className="input-field pl-10 pr-10"
                          id="login-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setMode('reset')}
                      className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
                    >
                      Forgot password?
                    </button>

                    <button type="submit" disabled={loading} className="btn-brand w-full justify-center py-3.5" id="login-submit">
                      {loading ? <Loader2 size={18} className="animate-spin" /> : 'Sign In'}
                    </button>
                  </form>

                  <p className="text-center text-sm text-slate-500 mt-6">
                    No account?{' '}
                    <button onClick={() => setMode('signup')} className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
                      Sign up free
                    </button>
                  </p>
                </>
              )}

              {mode === 'signup' && (
                <>
                  <h1 className="text-3xl font-black mb-2">Create account</h1>
                  <p className="text-slate-400 mb-8">Start building with AI for free</p>

                  <button onClick={handleGoogle} className="btn-ghost w-full justify-center mb-6 gap-3">
                    <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/><path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.96L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
                    Continue with Google
                  </button>

                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex-1 h-px bg-white/8" />
                    <span className="text-xs text-slate-500">or</span>
                    <div className="flex-1 h-px bg-white/8" />
                  </div>

                  <form onSubmit={handleSignup} className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1.5">Full Name</label>
                      <div className="relative">
                        <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          type="text" required
                          value={form.name}
                          onChange={(e) => update('name', e.target.value)}
                          placeholder="John Doe"
                          className="input-field pl-10"
                          id="signup-name"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1.5">Email</label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          type="email" required
                          value={form.email}
                          onChange={(e) => update('email', e.target.value)}
                          placeholder="you@example.com"
                          className="input-field pl-10"
                          id="signup-email"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1.5">Password</label>
                      <div className="relative">
                        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          type={showPassword ? 'text' : 'password'} required
                          value={form.password}
                          onChange={(e) => update('password', e.target.value)}
                          placeholder="Min. 6 characters"
                          className="input-field pl-10 pr-10"
                          id="signup-password"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <button type="submit" disabled={loading} className="btn-brand w-full justify-center py-3.5" id="signup-submit">
                      {loading ? <Loader2 size={18} className="animate-spin" /> : 'Create Account'}
                    </button>
                  </form>

                  <p className="text-center text-sm text-slate-500 mt-6">
                    Already have an account?{' '}
                    <button onClick={() => setMode('login')} className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
                      Sign in
                    </button>
                  </p>
                </>
              )}

              {mode === 'reset' && (
                <>
                  <h1 className="text-3xl font-black mb-2">Reset password</h1>
                  <p className="text-slate-400 mb-8">We'll send you a reset link</p>

                  <form onSubmit={handleReset} className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1.5">Email</label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          type="email" required
                          value={form.email}
                          onChange={(e) => update('email', e.target.value)}
                          placeholder="you@example.com"
                          className="input-field pl-10"
                          id="reset-email"
                        />
                      </div>
                    </div>

                    <button type="submit" disabled={loading} className="btn-brand w-full justify-center py-3.5">
                      {loading ? <Loader2 size={18} className="animate-spin" /> : 'Send Reset Link'}
                    </button>
                  </form>

                  <p className="text-center text-sm text-slate-500 mt-6">
                    <button onClick={() => setMode('login')} className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
                      Back to sign in
                    </button>
                  </p>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
