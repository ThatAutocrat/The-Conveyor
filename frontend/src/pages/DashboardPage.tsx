import { useQuery } from '@tanstack/react-query'
import { getStats, getPipelines, getRepos } from '../api/client'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { StatusBadge } from '../components/StatusBadge'
import { useRealtimePipelines } from '../hooks/useRealtimePipelines'
import { formatDistanceToNow } from 'date-fns'
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'

function StatCard({ label, value, icon: Icon, color }: any) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-text-muted text-xs uppercase tracking-wider">{label}</span>
        <Icon size={16} className={color} />
      </div>
      <div className={`text-3xl font-bold font-mono ${color}`}>{value}</div>
    </div>
  )
}

function formatDuration(seconds?: number | null) {
  if (!seconds) return '—'
  if (seconds < 60) return `${Math.round(seconds)}s`
  return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`
}

export default function DashboardPage() {
  useRealtimePipelines()

  const { data: stats } = useQuery({ queryKey: ['stats'], queryFn: () => getStats().then(r => r.data), refetchInterval: 30000 })
  const { data: pipelines } = useQuery({ queryKey: ['pipelines', 'recent'], queryFn: () => getPipelines({ limit: 20 }).then(r => r.data), refetchInterval: 30000 })
  const { data: repos } = useQuery({ queryKey: ['repos'], queryFn: () => getRepos().then(r => r.data) })

  // Build chart data from recent pipelines
  const chartData = pipelines ? (() => {
    const byDay: Record<string, { success: number; failure: number }> = {}
    pipelines.forEach((p: any) => {
      const day = new Date(p.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })
      if (!byDay[day]) byDay[day] = { success: 0, failure: 0 }
      if (p.conclusion === 'success') byDay[day].success++
      if (p.conclusion === 'failure') byDay[day].failure++
    })
    return Object.entries(byDay).slice(-7).map(([day, v]) => ({ day, ...v }))
  })() : []

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text">Dashboard</h1>
        <p className="text-text-muted text-sm mt-1">Real-time view of your GitHub Actions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Runs" value={stats?.total_runs ?? '—'} icon={Clock} color="text-info" />
        <StatCard label="Success Rate" value={stats ? `${stats.success_rate}%` : '—'} icon={CheckCircle} color="text-accent" />
        <StatCard label="Avg Duration" value={formatDuration(stats?.avg_duration_seconds)} icon={Clock} color="text-warn" />
        <StatCard label="Failing Repos" value={stats?.failing_repos ?? '—'} icon={AlertTriangle} color={stats?.failing_repos > 0 ? 'text-danger' : 'text-text-muted'} />
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-surface border border-border rounded-xl p-5 mb-8">
          <h2 className="text-sm font-semibold text-text mb-4">Run Results (Last 7 Days)</h2>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="success" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6ee7b7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6ee7b7" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="failure" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="success" stroke="#6ee7b7" fill="url(#success)" strokeWidth={2} />
              <Area type="monotone" dataKey="failure" stroke="#f87171" fill="url(#failure)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent runs */}
      <div className="bg-surface border border-border rounded-xl">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-text">Recent Runs</h2>
        </div>
        <div className="divide-y divide-border">
          {pipelines?.slice(0, 10).map((p: any) => (
            <div key={p.id} className="px-5 py-3 flex items-center gap-4 hover:bg-muted/20 transition-colors">
              <StatusBadge status={p.status} conclusion={p.conclusion} />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-text font-medium truncate">{p.name}</div>
                <div className="text-xs text-text-muted font-mono truncate">
                  {p.head_branch} · {p.head_sha?.slice(0, 7)} · {p.head_commit_message?.slice(0, 60)}
                </div>
              </div>
              <div className="text-xs text-text-muted whitespace-nowrap">
                {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
              </div>
              <div className="text-xs font-mono text-text-muted">{formatDuration(p.duration_seconds)}</div>
            </div>
          ))}
          {(!pipelines || pipelines.length === 0) && (
            <div className="px-5 py-12 text-center text-text-muted text-sm">
              No pipeline runs yet. Add a repo and sync it to see results.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
