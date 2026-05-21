import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, register, getMe } from '../api/client'
import { useAuthStore } from '../store/auth'

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async () => {
    setError(''); setLoading(true)
    try {
      let token: string
      if (isRegister) {
        const r = await register(email, name, password)
        token = r.data.access_token
      } else {
        const r = await login(email, password)
        token = r.data.access_token
      }
      // Temporarily set token so getMe works
      useAuthStore.setState({ token })
      const me = await getMe()
      setAuth(token, me.data)
      navigate('/dashboard')
    } catch (e: any) {
      setError(e.response?.data?.detail ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: 'linear-gradient(#6ee7b7 1px, transparent 1px), linear-gradient(90deg, #6ee7b7 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 border border-accent/30 mb-4">
            <span className="font-mono font-bold text-accent text-lg">CI</span>
          </div>
          <h1 className="text-2xl font-bold text-text">Pipeline Board</h1>
          <p className="text-text-muted text-sm mt-1">Monitor all your GitHub Actions in one place</p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-text mb-5">
            {isRegister ? 'Create account' : 'Sign in'}
          </h2>

          <div className="space-y-3">
            {isRegister && (
              <div>
                <label className="text-xs text-text-muted mb-1 block">Name</label>
                <input value={name} onChange={e => setName(e.target.value)}
                  className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder-text-muted focus:outline-none focus:border-accent/60 transition-colors"
                  placeholder="Your name" />
              </div>
            )}
            <div>
              <label className="text-xs text-text-muted mb-1 block">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder-text-muted focus:outline-none focus:border-accent/60 transition-colors"
                placeholder="you@example.com" />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder-text-muted focus:outline-none focus:border-accent/60 transition-colors"
                placeholder="••••••••" />
            </div>
          </div>

          {error && <p className="text-danger text-xs mt-3">{error}</p>}

          <button onClick={handleSubmit} disabled={loading}
            className="mt-4 w-full bg-accent text-bg py-2 rounded-lg text-sm font-semibold hover:bg-accent-dim transition-colors disabled:opacity-50">
            {loading ? 'Loading...' : isRegister ? 'Create account' : 'Sign in'}
          </button>

          <p className="text-center text-xs text-text-muted mt-4">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}
            {' '}
            <button onClick={() => setIsRegister(!isRegister)} className="text-accent hover:underline">
              {isRegister ? 'Sign in' : 'Register'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
