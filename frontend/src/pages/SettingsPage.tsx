import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { setGithubToken } from '../api/client'
import { useAuthStore } from '../store/auth'
import { Key, CheckCircle, ExternalLink } from 'lucide-react'

export default function SettingsPage() {
  const [token, setToken] = useState('')
  const [saved, setSaved] = useState(false)
  const { user } = useAuthStore()

  const mutation = useMutation({
    mutationFn: () => setGithubToken(token),
    onSuccess: () => { setSaved(true); setToken(''); setTimeout(() => setSaved(false), 3000) }
  })

  return (
    <div className="p-8 max-w-2xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text">Settings</h1>
        <p className="text-text-muted text-sm mt-1">Configure your integrations</p>
      </div>

      {/* Profile */}
      <div className="bg-surface border border-border rounded-xl p-5 mb-5">
        <h2 className="text-sm font-semibold text-text mb-4">Profile</h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Name</span>
            <span className="text-text">{user?.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Email</span>
            <span className="text-text font-mono">{user?.email}</span>
          </div>
        </div>
      </div>

      {/* GitHub Token */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <Key size={15} className="text-text-muted" />
          <h2 className="text-sm font-semibold text-text">GitHub Personal Access Token</h2>
        </div>
        <p className="text-text-muted text-xs mb-4">
          Required to fetch your repos and workflow runs from GitHub.
        </p>

        <div className="bg-bg border border-border rounded-lg p-3 mb-4 text-xs text-text-muted space-y-1">
          <p className="font-semibold text-text">How to create a token:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Go to GitHub → Settings → Developer settings → Personal access tokens</li>
            <li>Click "Generate new token (classic)"</li>
            <li>Select scopes: <code className="font-mono bg-muted px-1 rounded">repo</code> and <code className="font-mono bg-muted px-1 rounded">workflow</code></li>
            <li>Copy the token and paste it below</li>
          </ol>
          <a href="https://github.com/settings/tokens/new" target="_blank" rel="noreferrer"
            className="flex items-center gap-1 text-accent hover:underline mt-2 w-fit">
            Open GitHub tokens page <ExternalLink size={11} />
          </a>
        </div>

        <div className="flex gap-3">
          <input
            type="password"
            value={token}
            onChange={e => setToken(e.target.value)}
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            className="flex-1 bg-bg border border-border rounded-lg px-3 py-2 text-sm font-mono text-text placeholder-text-muted focus:outline-none focus:border-accent/60 transition-colors"
          />
          <button
            onClick={() => mutation.mutate()}
            disabled={!token.trim() || mutation.isPending}
            className="px-4 py-2 bg-accent text-bg rounded-lg text-sm font-semibold hover:bg-accent-dim transition-colors disabled:opacity-50"
          >
            {mutation.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>

        {saved && (
          <div className="flex items-center gap-2 mt-3 text-accent text-xs">
            <CheckCircle size={13} /> Token saved successfully
          </div>
        )}
      </div>
    </div>
  )
}
