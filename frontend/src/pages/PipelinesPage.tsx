import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getPipelines, getRepos } from '../api/client'
import { StatusBadge } from '../components/StatusBadge'
import { formatDistanceToNow } from 'date-fns'
import { Filter } from 'lucide-react'
import { clsx } from 'clsx'

function formatDuration(s?: number | null) {
  if (!s) return '—'
  if (s < 60) return `${Math.round(s)}s`
  return `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`
}

export default function PipelinesPage() {
  const [repoId, setRepoId] = useState<string>('')
  const [branch, setBranch] = useState('')
  const [conclusion, setConclusion] = useState('')

  const { data: repos } = useQuery({ queryKey: ['repos'], queryFn: () => getRepos().then(r => r.data) })
  const { data: pipelines, isLoading } = useQuery({
    queryKey: ['pipelines', repoId, branch, conclusion],
    queryFn: () => getPipelines({
      ...(repoId && { repo_id: repoId }),
      ...(branch && { branch }),
      ...(conclusion && { conclusion }),
      limit: 100,
    }).then(r => r.data),
    refetchInterval: 15000,
  })

  const repoMap = Object.fromEntries((repos ?? []).map((r: any) => [r.id, r.github_full_name]))

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Pipelines</h1>
          <p className="text-text-muted text-sm mt-1">{pipelines?.length ?? 0} runs</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <Filter size={14} className="text-text-muted" />
        <select value={repoId} onChange={e => setRepoId(e.target.value)}
          className="bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-text focus:outline-none focus:border-accent/60">
          <option value="">All repos</option>
          {repos?.map((r: any) => <option key={r.id} value={r.id}>{r.github_full_name}</option>)}
        </select>

        <input value={branch} onChange={e => setBranch(e.target.value)}
          placeholder="Branch..."
          className="bg-surface border border-border rounded-lg px-3 py-1.5 text-sm font-mono text-text placeholder-text-muted focus:outline-none focus:border-accent/60 w-36" />

        <select value={conclusion} onChange={e => setConclusion(e.target.value)}
          className="bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-text focus:outline-none focus:border-accent/60">
          <option value="">All results</option>
          <option value="success">Success</option>
          <option value="failure">Failure</option>
          <option value="cancelled">Cancelled</option>
          <option value="timed_out">Timed out</option>
        </select>

        {(repoId || branch || conclusion) && (
          <button onClick={() => { setRepoId(''); setBranch(''); setConclusion('') }}
            className="text-xs text-text-muted hover:text-danger transition-colors">
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-border text-xs text-text-muted uppercase tracking-wider">
          <span>Status</span>
          <span>Pipeline</span>
          <span>Repo</span>
          <span>Duration</span>
          <span>When</span>
        </div>
        <div className="divide-y divide-border">
          {isLoading && (
            <div className="px-5 py-8 text-center text-text-muted text-sm">Loading...</div>
          )}
          {pipelines?.map((p: any) => (
            <div key={p.id} className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-5 py-3 items-center hover:bg-muted/20 transition-colors">
              <StatusBadge status={p.status} conclusion={p.conclusion} />
              <div className="min-w-0">
                <div className="text-sm text-text font-medium truncate">{p.name}</div>
                <div className="text-xs text-text-muted font-mono truncate">
                  {p.head_branch} · {p.head_sha?.slice(0, 7)}
                  {p.head_commit_message && ` · ${p.head_commit_message.slice(0, 50)}`}
                </div>
              </div>
              <div className="text-xs font-mono text-text-muted whitespace-nowrap">
                {repoMap[p.repo_id] ?? `repo ${p.repo_id}`}
              </div>
              <div className="text-xs font-mono text-text-muted whitespace-nowrap">
                {formatDuration(p.duration_seconds)}
              </div>
              <div className="text-xs text-text-muted whitespace-nowrap">
                {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
              </div>
            </div>
          ))}
          {pipelines?.length === 0 && !isLoading && (
            <div className="px-5 py-12 text-center text-text-muted text-sm">No pipeline runs found.</div>
          )}
        </div>
      </div>
    </div>
  )
}
