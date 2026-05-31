import { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Zap, Code2, Globe, Database, Shield, Rocket, ChevronRight,
  Star, Check, ChevronDown, Twitter, Github, Linkedin, Play
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const FEATURES = [
  { icon: Zap, title: 'AI-Powered Generation', desc: 'Describe your app in plain English and watch it come to life with production-ready code.' },
  { icon: Code2, title: 'Monaco Code Editor', desc: 'Industry-standard editor with syntax highlighting, IntelliSense, and multi-tab support.' },
  { icon: Globe, title: 'Live Preview', desc: 'See your application running in real-time as you build and iterate with AI.' },
  { icon: Database, title: 'Database Designer', desc: 'Visual schema designer with ER diagrams, relationships, and SQL export.' },
  { icon: Shield, title: 'Built-in Auth', desc: 'Authentication flows, role management, and security best practices included by default.' },
  { icon: Rocket, title: 'One-Click Deploy', desc: 'Deploy to IkoBuild hosting or download a ZIP — go live in seconds.' },
]

const TEMPLATES = [
  { name: 'School Management', emoji: '🏫', desc: 'Students, attendance, exams' },
  { name: 'Hospital System', emoji: '🏥', desc: 'Patients, doctors, appointments' },
  { name: 'E-Commerce', emoji: '🛒', desc: 'Products, cart, payments' },
  { name: 'CRM Platform', emoji: '💼', desc: 'Leads, contacts, deals' },
  { name: 'SACCO Management', emoji: '🏦', desc: 'Members, loans, savings' },
  { name: 'Church Management', emoji: '⛪', desc: 'Members, events, tithes' },
  { name: 'Inventory System', emoji: '📦', desc: 'Stock, orders, suppliers' },
  { name: 'Task Manager', emoji: '✅', desc: 'Projects, tasks, teams' },
  { name: 'Blog Platform', emoji: '📝', desc: 'Posts, comments, SEO' },
  { name: 'Portfolio Builder', emoji: '🎨', desc: 'Projects, skills, contact' },
]

const PRICING = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    desc: 'Perfect for exploration',
    color: 'border-white/10',
    features: ['3 projects/month', 'Basic AI models', 'Code editor', 'ZIP download', '500 MB storage'],
    cta: 'Start Free',
    ctaStyle: 'btn-ghost',
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/month',
    desc: 'For serious builders',
    color: 'border-brand-600',
    badge: 'Most Popular',
    features: ['Unlimited projects', 'Advanced AI models', 'Live preview', 'IkoBuild hosting', '10 GB storage', 'Custom domains'],
    cta: 'Start Pro',
    ctaStyle: 'btn-brand',
  },
  {
    name: 'Business',
    price: '$49',
    period: '/month',
    desc: 'For teams and agencies',
    color: 'border-white/10',
    features: ['Everything in Pro', 'Team collaboration', 'Version control', 'Priority support', '100 GB storage', 'White-label'],
    cta: 'Contact Sales',
    ctaStyle: 'btn-ghost',
  },
]

const TESTIMONIALS = [
  { name: 'Sarah K.', role: 'Startup Founder', avatar: '👩‍💼', text: 'IkoBuild saved us 3 months of development. We launched our MVP in a weekend!' },
  { name: 'James M.', role: 'Full-Stack Dev', avatar: '👨‍💻', text: 'The AI chat is incredible — it understands exactly what I want and generates clean code.' },
  { name: 'Amara T.', role: 'Product Manager', avatar: '👩‍💻', text: 'Non-technical founders can now prototype ideas without hiring a dev team. Game changer.' },
]

const FAQS = [
  { q: 'What frameworks does IkoBuild support?', a: 'React, Next.js, Vue, Angular, Node.js, Django, FastAPI, Laravel, and more. New frameworks are added regularly.' },
  { q: 'Does the generated code belong to me?', a: 'Yes, 100%. All generated code is yours to use, modify, and deploy commercially with no restrictions.' },
  { q: 'Can I connect my own database?', a: 'Yes! IkoBuild generates the schema and code. You can connect any PostgreSQL, MySQL, or MongoDB instance.' },
  { q: 'How does IkoBuild hosting work?', a: 'We deploy your app to our infrastructure and give you a .ikobuild.app subdomain. Custom domains available on Pro and Business plans.' },
  { q: 'Is my data secure?', a: 'All data is encrypted in transit and at rest. We use Supabase with Row Level Security to isolate your projects.' },
]

export default function LandingPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/dashboard')
  }, [user, navigate])

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-100">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-glass">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-blue-600 flex items-center justify-center shadow-brand">
              <Code2 size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">IkoBuild</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            {['Features', 'Templates', 'Pricing', 'FAQ'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-white transition-colors">
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link to="/auth" className="btn-ghost text-sm px-4 py-2">Sign In</Link>
            <Link to="/auth?signup=true" className="btn-brand text-sm px-4 py-2">Start Building</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-glow" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand-600/5 blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="section-label mb-6 inline-flex">
              <Zap size={12} /> AI-Native Software Builder
            </div>

            <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6 text-balance">
              Build Complete{' '}
              <span className="gradient-text">Software With AI</span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-10 text-balance">
              Turn ideas into full-stack applications using natural language.
              Frontend, backend, database — fully generated in seconds.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
              <Link to="/auth?signup=true" className="btn-brand text-base px-8 py-4">
                <Zap size={18} /> Start Building Free
              </Link>
              <button className="btn-ghost text-base px-8 py-4">
                <Play size={18} /> Watch Demo
              </button>
            </div>

            {/* Prompt demo card */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="glass rounded-2xl p-6 max-w-3xl mx-auto text-left shadow-elevated"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
                <span className="ml-2 text-xs text-slate-500 font-mono">IkoBuild — New Project</span>
              </div>
              <div className="font-mono text-sm text-slate-300 leading-relaxed">
                <span className="text-brand-400">→ </span>
                <span className="text-slate-100">Build a school management system using React, Node.js, PostgreSQL,</span>
                <br />
                <span className="ml-4 text-slate-300">authentication, attendance tracking, and exam management.</span>
                <span className="inline-block w-2 h-4 bg-brand-400 ml-1 animate-pulse" />
              </div>
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-3 text-xs text-slate-500">
                <span className="badge badge-green"><span className="dot-live" /> Generating...</span>
                <span>47 files created</span>
                <span>•</span>
                <span>React + Node.js + PostgreSQL</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="section-label mb-4 inline-flex"><Code2 size={12} /> Features</div>
            <h2 className="text-4xl font-bold mb-4">Everything you need to build</h2>
            <p className="text-slate-400 text-lg">A complete platform from prompt to production.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                viewport={{ once: true }}
                className="card group"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-600/15 border border-brand-600/20 flex items-center justify-center mb-4 group-hover:bg-brand-600/25 transition-colors">
                  <f.icon size={22} className="text-brand-400" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Templates */}
      <section id="templates" className="py-24 px-6 bg-surface-100/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="section-label mb-4 inline-flex"><Rocket size={12} /> Templates</div>
            <h2 className="text-4xl font-bold mb-4">Start from a template</h2>
            <p className="text-slate-400 text-lg">10 production-ready templates to jumpstart your project.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {TEMPLATES.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
                className="card cursor-pointer text-center p-4 group hover:border-brand-600/30"
              >
                <div className="text-3xl mb-3">{t.emoji}</div>
                <div className="font-semibold text-sm mb-1">{t.name}</div>
                <div className="text-xs text-slate-500">{t.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="section-label mb-4 inline-flex"><Star size={12} /> Pricing</div>
            <h2 className="text-4xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-slate-400 text-lg">Start free. Scale as you grow.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRICING.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className={`card relative ${plan.color} border-2 ${i === 1 ? 'shadow-brand' : ''}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="badge badge-purple px-4 py-1">{plan.badge}</span>
                  </div>
                )}
                <div className="mb-6">
                  <div className="text-slate-400 text-sm mb-1">{plan.name}</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black">{plan.price}</span>
                    <span className="text-slate-500 text-sm">{plan.period}</span>
                  </div>
                  <p className="text-slate-500 text-sm mt-1">{plan.desc}</p>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check size={16} className="text-brand-400 flex-shrink-0" />
                      <span className="text-slate-300">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/auth?signup=true" className={`${plan.ctaStyle} w-full justify-center`}>
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 bg-surface-100/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Loved by builders</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="card"
              >
                <div className="flex items-center gap-2 mb-2">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={14} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{t.avatar}</span>
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-slate-500">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <details key={i} className="card group cursor-pointer">
                <summary className="flex items-center justify-between font-semibold text-sm cursor-pointer list-none">
                  {faq.q}
                  <ChevronDown size={16} className="text-slate-400 group-open:rotate-180 transition-transform" />
                </summary>
                <p className="mt-3 text-slate-400 text-sm leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass rounded-3xl p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-600/10 to-blue-600/10" />
            <div className="relative">
              <h2 className="text-4xl font-black mb-4">Ready to build?</h2>
              <p className="text-slate-400 mb-8">Join thousands of builders shipping faster with IkoBuild.</p>
              <Link to="/auth?signup=true" className="btn-brand text-lg px-10 py-4">
                Start Building Free <ChevronRight size={20} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-glass py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-600 to-blue-600 flex items-center justify-center">
              <Code2 size={14} className="text-white" />
            </div>
            <span className="font-bold">IkoBuild</span>
          </div>
          <p className="text-slate-500 text-sm">© 2025 IkoBuild. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-slate-500 hover:text-white transition-colors"><Twitter size={18} /></a>
            <a href="#" className="text-slate-500 hover:text-white transition-colors"><Github size={18} /></a>
            <a href="#" className="text-slate-500 hover:text-white transition-colors"><Linkedin size={18} /></a>
          </div>
        </div>
      </footer>
    </div>
  )
}
