'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2, Lock, Mail } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        const sessionRes = await fetch('/api/auth/session')
        const session = await sessionRes.json()
        const role = session?.user?.role

        if (role) {
          if (role === 'admin') router.replace('/admin')
          else if (role === 'reception') router.replace('/reception/orders')
          else if (role === 'kitchen') router.replace('/kitchen/orders')
          else router.replace('/')
        } else {
          setCheckingSession(false)
        }
      } catch (err) {
        setCheckingSession(false)
      }
    }
    checkActiveSession()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('Invalid email or password')
      setLoading(false)
    } else {
        // Fetch session to check role and redirect
        const sessionRes = await fetch('/api/auth/session')
        const session = await sessionRes.json()
        const role = session?.user?.role

        if (role === 'admin') router.replace('/admin')
        else if (role === 'reception') router.replace('/reception/orders')
        else if (role === 'kitchen') router.replace('/kitchen/orders')
        else router.replace('/')
    }
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center p-6">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md"
      >
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-[#E8D5C4]">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold font-playfair text-primary mb-2">Login</h1>
            <p className="text-text-secondary">Staff Portal Access</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-semibold mb-6 border border-red-100 italic">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-secondary uppercase ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary opacity-40" />
                <input 
                  type="email" 
                  required
                  placeholder="admin@royalcomfort.com"
                  className="w-full bg-[#FFF8F0] border border-[#E8D5C4] p-4 pl-12 rounded-[1.2rem] focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-text-secondary uppercase ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary opacity-40" />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full bg-[#FFF8F0] border border-[#E8D5C4] p-4 pl-12 rounded-[1.2rem] focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button 
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-light text-white py-4 rounded-[1.5rem] font-bold shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-border text-center">
            <p className="text-xs text-text-secondary opacity-60">
              Only authorized staff can access this section. 
              Contact admin for help.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
