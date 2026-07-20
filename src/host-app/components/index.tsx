import { type ReactNode } from 'react'
import './components.css'

export function PageHeader({ title, desc, actions }: { title: string; desc?: string; actions?: ReactNode }) {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        {desc && <div className="page-desc">{desc}</div>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>
}

export function Btn({ children, variant = 'default', onClick, ...rest }: {
  children: ReactNode; variant?: 'default' | 'primary' | 'danger'; onClick?: () => void;
} & Record<string, unknown>) {
  return (
    <button className={`btn ${variant}`} onClick={onClick} {...rest}>
      {children}
    </button>
  )
}

export function Tag({ children, type = 'default' }: { children: ReactNode; type?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'review' | 'brand' }) {
  return <span className={`tag ${type}`}>{children}</span>
}

export function StatCard({ label, value, foot, color }: { label: string; value: string | number; foot?: string; color?: string }) {
  return (
    <div className="stat-card">
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value" style={color ? { color } : undefined}>{value}</div>
      {foot && <div className="stat-card-foot">{foot}</div>}
    </div>
  )
}
