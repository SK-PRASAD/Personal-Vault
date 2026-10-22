import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import {
  GlassCard,
  GlassInput,
  GlassButton,
  Badge,
} from "../components/ui";
import {
  Shield,
  ArrowRight,
  CheckCircle,
  Home,
} from "lucide-react";

function AuthShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 relative">
      {/* Home button */}
      <Link
        to="/"
        className="absolute top-5 left-5 inline-flex items-center gap-2 px-3 py-2 rounded-xl glass text-secondary hover:text-primary transition-all duration-200"
        aria-label="Go to home"
      >
        <Home size={16} />
        <span className="text-sm font-medium">Home</span>
      </Link>

      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <img
            src="/Logo.png"
            alt="Personal Vault"
            className="w-16 h-16 object-contain mx-auto mb-3"
          />

          <h1 className="text-2xl font-bold text-primary">
            {title}
          </h1>

          <p className="text-secondary mt-1">
            {subtitle}
          </p>
        </div>

        {children}
      </div>
    </div>
  );
}

export function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    const result = await login(email, password);

    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    toast("Welcome back!", "success");
    nav("/");
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your approved member account"
    >
      <GlassCard className="p-6">
        <form onSubmit={submit} className="space-y-4">
          <GlassInput
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <GlassInput
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            error={error}
          />

          <GlassButton
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
            <ArrowRight size={16} />
          </GlassButton>
        </form>

        <div className="mt-5 text-center text-sm text-secondary">
          No account?{" "}
          <Link
            className="text-accent hover:underline"
            to="/signup"
          >
            Create one
          </Link>
        </div>

        <div className="mt-3 text-center">
          <Link
            className="text-xs text-muted hover:text-primary transition-colors"
            to="/admin/login"
          >
            Administrator login
          </Link>
        </div>
      </GlassCard>
    </AuthShell>
  );
}

export function SignupPage() {
  const { signup } = useAuth();
  const { toast } = useToast();
  const nav = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    const result = await signup(email, password, name);

    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setDone(true);
    toast("Signup submitted for approval.", "success");
  };

  if (done) {
    return (
      <AuthShell
        title="Request submitted"
        subtitle="Your account is waiting for administrator approval"
      >
        <GlassCard className="p-7 text-center">
          <CheckCircle
            className="mx-auto text-accent mb-4"
            size={42}
          />

          <p className="text-secondary">
            Once approved, you can sign in with your email and
            password.
          </p>

          <GlassButton
            className="w-full mt-6"
            onClick={() => nav("/login")}
          >
            Go to login
          </GlassButton>

          <button
            type="button"
            onClick={() => nav("/")}
            className="mt-4 text-sm text-muted hover:text-primary transition-colors"
          >
            Back to Home
          </button>
        </GlassCard>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create member account"
      subtitle="Access is enabled after admin approval"
    >
      <GlassCard className="p-6">
        <form onSubmit={submit} className="space-y-4">
          <GlassInput
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <GlassInput
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <GlassInput
            label="Password"
            type="password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            error={error}
          />

          <GlassButton
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create account"}
            <ArrowRight size={16} />
          </GlassButton>
        </form>

        <div className="mt-5 text-center text-sm text-secondary">
          Already registered?{" "}
          <Link
            className="text-accent hover:underline"
            to="/login"
          >
            Sign in
          </Link>
        </div>
      </GlassCard>
    </AuthShell>
  );
}

export function AdminLoginPage() {
  const { adminLogin } = useAuth();
  const { toast } = useToast();
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    const result = await adminLogin(email, password);

    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    toast("Admin access granted.", "success");
    nav("/admin");
  };

  return (
    <AuthShell
      title="Admin Console"
      subtitle="Restricted administrator access"
    >
      <GlassCard className="p-6">
        <form onSubmit={submit} className="space-y-4">
          <GlassInput
            label="Admin email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <GlassInput
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            error={error}
          />

          <GlassButton
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Checking..." : "Admin sign in"}
            <Shield size={16} />
          </GlassButton>
        </form>

        <div className="mt-5 text-center">
          <Link
            className="text-sm text-muted hover:text-primary transition-colors"
            to="/"
          >
            Back to site
          </Link>
        </div>
      </GlassCard>
    </AuthShell>
  );
}

export function AccountPage() {
  const { user, member, logout } = useAuth();
  const nav = useNavigate();

  return (
    <div className="min-h-screen bg-surface p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-primary">
              My Account
            </h1>

            <p className="text-secondary mt-1">
              Member access and profile status
            </p>
          </div>

          <div className="flex items-center gap-2">
            <GlassButton
              variant="ghost"
              onClick={() => nav("/")}
            >
              <Home size={16} />
              Home
            </GlassButton>

            <GlassButton
              variant="ghost"
              onClick={() => {
                void logout();
                nav("/");
              }}
            >
              Sign out
            </GlassButton>
          </div>
        </div>

        <GlassCard className="p-6 space-y-5">
          <div className="flex items-center gap-4">
            <img
              src="/Logo.png"
              alt="Personal Vault"
              className="w-14 h-14 object-contain"
            />

            <div>
              <p className="font-semibold text-primary">
                {member?.name || user?.email}
              </p>

              <p className="text-sm text-secondary">
                {user?.email}
              </p>
            </div>

            <Badge variant={member?.status || "pending"}>
              {member?.status || "pending"}
            </Badge>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="glass rounded-xl p-4">
              <p className="text-xs text-muted">
                Member since
              </p>

              <p className="text-primary mt-1">
                {member?.created_at
                  ? new Date(
                      member.created_at
                    ).toLocaleDateString()
                  : "—"}
              </p>
            </div>

            <div className="glass rounded-xl p-4">
              <p className="text-xs text-muted">
                Access
              </p>

              <p className="text-primary mt-1">
                Approved members can access permitted private
                items.
              </p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}