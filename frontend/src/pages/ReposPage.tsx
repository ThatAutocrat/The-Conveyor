import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRepos, addRepo, removeRepo, syncRepo } from '../api/client'
import { GitBranch, Plus, Trash2, RefreshCw, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function ReposPage() {
  const [newRepo, setNewRepo] = useState('')
  const [error, setError] = useState('')
  const qc = useQueryClient()

  const { data: repos, isLoading } = useQuery({
    queryKey: ['repos'],
    queryFn: () => getRepos().then(r => r.data)
  })

  const addMutation = useMutation({
    mutationFn: () => addRepo(newRepo.trim()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['repos'] }); setNewRepo(''); setError('') },
    onError: (e: any) => setError(e.response?.data?.detail ?? 'Failed to add repo')
  })

  const removeMutation = useMutation({
    mutationFn: (id: number) => removeRepo(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['repos'] })
  })

  const syncMutation = useMutation({
    mutationFn: (id: number) => syncRepo(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pipelines'] }); qc.invalidateQueries({ queryKey: ['stats'] }) }
  })

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text">Repositories</h1>
        <p className="text-text-muted text-sm mt-1">Track GitHub Actions across your repos</p>
      </div>

      {/* Add repo */}
      <div className="bg-surface border border-border rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-text mb-3">Add Repository</h2>
        <div className="flex gap-3">
          <input
            value={newRepo}
            onChange={e => setNewRepo(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addMutation.mutate()}
            placeholder="owner/repo-name"
            className="flex-1 bg-bg border border-border rounded-lg px-3 py-2 text-sm font-mono text-text placeholder-text-muted focus:outline-none focus:border-accent/60 transition-colors"
          />
          <button
            onClick={() => addMutation.mutate()}
            disabled={!newRepo.trim() || addMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-bg rounded-lg text-sm font-semibold hover:bg-accent-dim transition-colors disabled:opacity-50"
          >
            <Plus size={15} />
            {addMutation.isPending ? 'Adding...' : 'Add'}
          </button>
        </div>
        {error && (
          <div className="flex items-center gap-2 mt-3 text-danger text-xs">
            <AlertCircle size={13} /> {error}
          </div>
        )}
        <p className="text-text-muted text-xs mt-3">
          Make sure you've added your GitHub token in Settings first.
        </p>
      </div>

      {/* Repo list */}
      <div className="bg-surface border border-border rounded-xl divide-y divide-border">
        {isLoading && (
          <div className="px-5 py-8 text-center text-text-muted text-sm">Loading...</div>
        )}
        {repos?.map((repo: any) => (
          <div key={repo.id} className="px-5 py-4 flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <GitBranch size={14} className="text-text-muted" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-text font-mono">{repo.github_full_name}</div>
              <div className="text-xs text-text-muted mt-0.5">
                {repo.description ?? 'No description'} · Added {formatDistanceToNow(new Date(repo.added_at), { addSuffix: true })}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => syncMutation.mutate(repo.id)}
                disabled={syncMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-muted border border-border rounded-lg hover:text-text hover:border-accent/40 transition-colors"
              >
                <RefreshCw size={12} className={syncMutation.isPending ? 'animate-spin' : ''} />
                Sync
              </button>
              <button
                onClick={() => removeMutation.mutate(repo.id)}
                className="p-1.5 text-text-muted hover:text-danger transition-colors rounded-lg hover:bg-danger/10"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        {repos?.length === 0 && !isLoading && (
          <div className="px-5 py-12 text-center">
            <GitBranch size={32} className="text-text-muted mx-auto mb-3" />
            <p className="text-text-muted text-sm">No repos added yet.</p>
            <p className="text-text-muted text-xs mt-1">Add a repo above using its full name (e.g. octocat/Hello-World)</p>
          </div>
        )}
      </div>
    </div>
  )
}
