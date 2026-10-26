import React, { ReactNode, useState } from 'react';
import { X } from 'lucide-react';

// Glass Card
export function GlassCard({ children, className = '', hover = false, onClick, style }: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`glass glass-card ${hover ? 'glass-hover cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      style={style}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}

// Glass Button
export function GlassButton({ children, variant = 'primary', size = 'md', className = '', disabled, onClick, type = 'button' }: {
  children: ReactNode;
  variant?: 'primary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
}) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed';
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2.5 text-sm', lg: 'px-6 py-3 text-base' };
  const variants = {
    primary: 'btn-primary',
    ghost: 'btn-ghost text-primary',
    danger: 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20',
    outline: 'border border-accent text-accent hover:bg-accent/10',
  };

  return (
    <button type={type} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}

// Glass Input
export function GlassInput({ label, error, className = '', ...props }: {
  label?: string;
  error?: string;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && <label className="text-sm text-secondary font-medium">{label}</label>}
      <input className={`input-field ${error ? 'border-red-500/50' : ''}`} {...props} />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

// Glass Textarea
export function GlassTextarea({ label, error, className = '', ...props }: {
  label?: string;
  error?: string;
  className?: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && <label className="text-sm text-secondary font-medium">{label}</label>}
      <textarea className={`input-field resize-none ${error ? 'border-red-500/50' : ''}`} rows={4} {...props} />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

// Glass Select
export function GlassSelect({ label, options, className = '', ...props }: {
  label?: string;
  options: { value: string; label: string }[];
  className?: string;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && <label className="text-sm text-secondary font-medium">{label}</label>}
      <select className="input-field appearance-none cursor-pointer" {...props}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// Badge
export function Badge({ children, variant = 'public' }: {
  children: ReactNode;
  variant?: 'public' | 'unlisted' | 'private' | 'pending' | 'approved' | 'rejected' | 'suspended';
}) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}

// Modal
export function Modal({ open, onClose, title, children, maxWidth = 'md' }: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  if (!open) return null;
  const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className={`glass-strong glass-card relative w-full ${widths[maxWidth]} p-6 animate-scale-in`}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-primary">{title}</h3>
            <button onClick={onClose} className="text-muted hover:text-primary transition-colors p-1">
              <X size={18} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

// Confirm Dialog
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmText = 'Confirm', danger = false }: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  danger?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="sm">
      <p className="text-secondary text-sm mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <GlassButton variant="ghost" onClick={onClose}>Cancel</GlassButton>
        <GlassButton variant={danger ? 'danger' : 'primary'} onClick={() => { onConfirm(); onClose(); }}>
          {confirmText}
        </GlassButton>
      </div>
    </Modal>
  );
}

// Empty State
export function EmptyState({ icon, title, description }: {
  icon: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mb-4 text-accent">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-primary mb-2">{title}</h3>
      {description && <p className="text-sm text-secondary max-w-sm">{description}</p>}
    </div>
  );
}

// Skeleton Loader
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="glass glass-card p-5 space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

// Loading Screen
export function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-surface z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center animate-pulse-glow">
          <img
            src={`${import.meta.env.BASE_URL}Logo.png`}
            alt="Personal Vault"
            className="w-7 h-7 object-contain"
          />
        </div>

        <p className="text-sm text-secondary">
          Loading Personal Vault...
        </p>
      </div>
    </div>
  );
}

// Tabs
export function Tabs({ tabs, active, onChange }: {
  tabs: { id: string; label: string; icon?: ReactNode }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-1 p-1 glass rounded-xl overflow-x-auto">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap
            ${active === tab.id ? 'bg-accent/10 text-accent' : 'text-secondary hover:text-primary hover:bg-white/5'}`}
        >
          {tab.icon}{tab.label}
        </button>
      ))}
    </div>
  );
}

// Dropdown
export function Dropdown({ trigger, items, align = 'right' }: {
  trigger: ReactNode;
  items: { label: string; icon?: ReactNode; onClick: () => void; danger?: boolean }[];
  align?: 'left' | 'right';
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className={`absolute z-50 mt-2 ${align === 'right' ? 'right-0' : 'left-0'} glass-strong glass-card p-1.5 min-w-[160px] animate-scale-in`}>
            {items.map((item, i) => (
              <button
                key={i}
                onClick={() => { item.onClick(); setOpen(false); }}
                className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors
                  ${item.danger ? 'text-red-400 hover:bg-red-500/10' : 'text-primary hover:bg-white/5'}`}
              >
                {item.icon}{item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
