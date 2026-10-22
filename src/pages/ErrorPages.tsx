import React from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '../components/Layout';
import { GlassButton } from '../components/ui';
import { Shield, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  return (
    <PublicLayout>
      <div className="max-w-3xl mx-auto px-4 py-20 animate-fade-in">
        <div className="text-center">
          <div className="w-20 h-20 rounded-3xl bg-accent/10 flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
            <img src="/Logo.png" alt="Personal Vault" className="w-10 h-10 object-contain" />
          </div>
          <h1 className="text-4xl font-bold text-primary mb-3">404</h1>
          <p className="text-lg text-secondary mb-2">Page not found</p>
          <p className="text-sm text-muted mb-8 max-w-md mx-auto">
            The page you're looking for doesn't exist or may have been moved.
          </p>
          <Link to="/">
            <GlassButton>
              <ArrowLeft size={16} /> Back to Vault
            </GlassButton>
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}

export function UnauthorizedPage() {
  return (
    <PublicLayout>
      <div className="max-w-3xl mx-auto px-4 py-20 animate-fade-in">
        <div className="text-center">
          <div className="w-20 h-20 rounded-3xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <Shield size={32} className="text-red-400" />
          </div>
          <h1 className="text-4xl font-bold text-primary mb-3">Access Denied</h1>
          <p className="text-lg text-secondary mb-2">You don't have permission to view this content.</p>
          <p className="text-sm text-muted mb-8 max-w-md mx-auto">
            This content is restricted. Please contact an administrator if you believe you should have access.
          </p>
          <Link to="/">
            <GlassButton>
              <ArrowLeft size={16} /> Back to Vault
            </GlassButton>
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}
