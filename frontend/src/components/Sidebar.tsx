import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, GitBranch, Settings, LogOut, Activity } from 'lucide-react'
import { useAuthStore } from '../store/auth'
import { clsx } from 'clsx'

const links = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/repos', icon: GitBranch, label: 'Repositories' },
  { to: '/pipelines', icon: Activity, label: 'Pipelines' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <aside className="w-56 min-h-screen bg-surface border-r border-border flex flex-col py-6 px-3">
      {/* Logo */}
      <div className="px-3 mb-8">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-accent/20 border border-accent/40 flex items-center justify-center">
            <span className="text-accent text-xs font-mono font-bold">CI</span>
          </div>
          <span className="font-semibold text-text text-sm tracking-wide">Pipeline Board</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) =>
            clsx('flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all',
              isActive
                ? 'bg-accent/10 text-accent border border-accent/20'
                : 'text-text-muted hover:text-text hover:bg-muted/40'
            )
          }>
            <Icon size={15} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="mt-6 px-3 pt-4 border-t border-border">
        <div className="text-xs text-text-muted mb-1 truncate">{user?.email}</div>
        <div className="text-sm font-medium text-text truncate mb-3">{user?.name}</div>
        <button onClick={handleLogout}
          className="flex items-center gap-2 text-xs text-text-muted hover:text-danger transition-colors">
          <LogOut size={13} /> Sign out
        </button>
      </div>
    </aside>
  )
}
