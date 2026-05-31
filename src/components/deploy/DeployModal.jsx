import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Download, Rocket, Globe, X, Check, Loader2, Copy,
  ExternalLink, Shield, Server, ChevronRight, Zap
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useProjectStore } from '@/store/projectStore'
import { generateZip, downloadBlob, generateSlug } from '@/lib/utils'

const DEPLOY_OPTIONS = [
  {
    id: 'zip',
    icon: Download,
    title: 'Download ZIP',
    desc: 'Get your complete source code as a ZIP archive',
    badge: null,
    color: 'border-white/10',
  },
  {
    id: 'ikobuild',
    icon: Rocket,
    title: 'IkoBuild Hosting',
    desc: 'Deploy instantly to our cloud — get a live URL in seconds',
    badge: 'Recommended',
    color: 'border-brand-600',
    glow: true,
  },
  {
    id: 'custom',
    icon: Globe,
    title: 'Custom Domain',
    desc: 'Connect your own domain with automatic SSL',
    badge: 'Pro',
    color: 'border-white/10',
  },
]

export default function DeployModal({ onClose, inline = false }) {
  const { project, files } = useProjectStore()
  const [selected, setSelected] = useState('ikobuild')
  const [step, setStep] = useState('select') // select | deploy | done
  const [deploying, setDeploying] = useState(false)
  const [deployUrl, setDeployUrl] = useState('')
  const [customDomain, setCustomDomain] = useState('')
  const [progress, setProgress] = useState(0)

  const handleDeploy = async () => {
    if (selected === 'zip') {
      const blob = await generateZip(project, files)
      downloadBlob(blob, `${project?.name || 'project'}.zip`)
      toast.success('ZIP downloaded!')
      onClose?.()
      return
    }

    setStep('deploy')
    setDeploying(true)
    setProgress(0)

    // Simulate deployment steps
    const steps = [10, 25, 40, 60, 75, 90, 100]
    for (const p of steps) {
      await new Promise((r) => setTimeout(r, 500))
      setProgress(p)
    }

    const slug = generateSlug(project?.name || 'app')
    const url = selected === 'custom' && customDomain
      ? `https://${customDomain}`
      : `https://${slug}.ikobuild.app`
    setDeployUrl(url)
    setDeploying(false)
    setStep('done')
  }

  const content = (
    <div className="w-full max-w-lg">
      {!inline && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">Deploy Project</h2>
            <p className="text-slate-400 text-sm mt-1">{project?.name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/8 transition-all">
            <X size={18} />
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 'select' && (
          <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Options */}
            <div className="space-y-3 mb-6">
              {DEPLOY_OPTIONS.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setSelected(opt.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selected === opt.id
                      ? `${opt.color} bg-brand-600/10`
                      : 'border-white/8 hover:border-white/20'
                  } ${opt.glow && selected === opt.id ? 'shadow-brand' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      selected === opt.id ? 'bg-brand-600/20' : 'bg-white/5'
                    }`}>
                      <opt.icon size={18} className={selected === opt.id ? 'text-brand-400' : 'text-slate-400'} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{opt.title}</span>
                        {opt.badge && (
                          <span className={`badge ${opt.badge === 'Recommended' ? 'badge-purple' : 'badge-blue'} text-xs`}>
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      selected === opt.id ? 'border-brand-500 bg-brand-600' : 'border-white/20'
                    }`}>
                      {selected === opt.id && <Check size={11} className="text-white" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Custom domain input */}
            {selected === 'custom' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-6"
              >
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Your Domain
                </label>
                <div className="flex items-center gap-2">
                  <Globe size={15} className="text-slate-500 flex-shrink-0" />
                  <input
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    placeholder="example.com or app.mybusiness.rw"
                    className="input-field"
                    id="custom-domain-input"
                  />
                </div>
                <div className="mt-2 flex items-start gap-2 text-xs text-slate-500">
                  <Shield size={12} className="flex-shrink-0 mt-0.5 text-emerald-400" />
                  <span>SSL certificate will be provisioned automatically after DNS verification.</span>
                </div>
              </motion.div>
            )}

            {/* Info bar */}
            {selected === 'ikobuild' && (
              <div className="glass-light rounded-xl p-3 mb-6 flex items-center gap-3 text-xs text-slate-400">
                <Server size={14} className="text-brand-400 flex-shrink-0" />
                <div>
                  Your app will be deployed to{' '}
                  <span className="text-brand-300 font-mono">
                    {generateSlug(project?.name || 'app')}.ikobuild.app
                  </span>
                  <br />
                  <span className="text-slate-600">Global CDN · Auto SSL · {files.length} files</span>
                </div>
              </div>
            )}

            <button
              onClick={handleDeploy}
              className="btn-brand w-full justify-center py-3.5"
              id="confirm-deploy-btn"
            >
              {selected === 'zip' ? (
                <><Download size={16} /> Download ZIP</>
              ) : (
                <><Rocket size={16} /> Deploy Now</>
              )}
            </button>
          </motion.div>
        )}

        {step === 'deploy' && (
          <motion.div key="deploy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(124,58,237,0.15)" strokeWidth="6" />
                <circle
                  cx="40" cy="40" r="34" fill="none"
                  stroke="url(#grad)" strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 34}`}
                  strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress / 100)}`}
                  className="transition-all duration-500"
                />
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#7c3aed" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-brand-400">{progress}%</span>
              </div>
            </div>

            <h3 className="text-xl font-bold mb-2">Deploying...</h3>
            <p className="text-slate-400 text-sm">
              {progress < 30 ? 'Bundling your application...' :
               progress < 60 ? 'Uploading to CDN...' :
               progress < 90 ? 'Configuring SSL...' :
               'Almost done!'}
            </p>
          </motion.div>
        )}

        {step === 'done' && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
              <Check size={28} className="text-emerald-400" />
            </div>

            <h3 className="text-xl font-bold mb-2">Deployed Successfully! 🎉</h3>
            <p className="text-slate-400 text-sm mb-6">Your app is live at:</p>

            <div className="glass-light rounded-xl p-4 mb-6 flex items-center gap-3">
              <Zap size={16} className="text-brand-400 flex-shrink-0" />
              <a
                href={deployUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-300 font-mono text-sm flex-1 text-left truncate hover:text-brand-200 transition-colors"
              >
                {deployUrl}
              </a>
              <button
                onClick={() => { navigator.clipboard.writeText(deployUrl); toast.success('Copied!') }}
                className="p-1.5 rounded text-slate-500 hover:text-white hover:bg-white/8 transition-all"
              >
                <Copy size={14} />
              </button>
              <a
                href={deployUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded text-slate-500 hover:text-white hover:bg-white/8 transition-all"
              >
                <ExternalLink size={14} />
              </a>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6 text-center">
              {[
                { label: 'Status', value: 'Live', color: 'text-emerald-400' },
                { label: 'SSL', value: 'Active', color: 'text-blue-400' },
                { label: 'CDN', value: 'Global', color: 'text-purple-400' },
              ].map((item) => (
                <div key={item.label} className="glass-light rounded-xl py-3">
                  <div className={`font-bold text-sm ${item.color}`}>{item.value}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{item.label}</div>
                </div>
              ))}
            </div>

            <button onClick={onClose} className="btn-ghost w-full justify-center">
              Done
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

  if (inline) return content

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="glass rounded-2xl p-6 w-full max-w-lg shadow-elevated border border-glass"
      >
        {content}
      </motion.div>
    </motion.div>
  )
}
