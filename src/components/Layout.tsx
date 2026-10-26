import React from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  Home,
  Link2,
  Video,
  FileText,
  FolderOpen,
  User,
  LogOut,
  Settings,
  Users,
  Share2,
  Activity,
  LayoutDashboard,
  Menu,
  X,
  Shield,
  Search,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { GlassButton } from "./ui";

const publicNav = [
  { to: "/", label: "Home", icon: Home },
  { to: "/links", label: "Links", icon: Link2 },
  { to: "/videos", label: "Videos", icon: Video },
  { to: "/notes", label: "Notes", icon: FileText },
  { to: "/files", label: "Files", icon: FolderOpen },
];

const adminNav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/items", label: "All Items", icon: FolderOpen },
  { to: "/admin/links", label: "Links", icon: Link2 },
  { to: "/admin/videos", label: "Videos", icon: Video },
  { to: "/admin/notes", label: "Notes", icon: FileText },
  { to: "/admin/files", label: "Files", icon: FolderOpen },
  { to: "/admin/members", label: "Members", icon: Users },
  { to: "/admin/shares", label: "Share Links", icon: Share2 },
  { to: "/admin/activity", label: "Activity", icon: Activity },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

function Logo({ admin = false }: { admin?: boolean }) {
  return (
    <Link
      to={admin ? "/admin" : "/"}
      className="flex items-center gap-3 min-w-0"
    >
      <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
        <img
          src={`${import.meta.env.BASE_URL}Logo.png`}
          alt="Personal Vault"
          className="w-7 h-7 object-contain"
        />
      </div>

      <div className="min-w-0">
        <p className="text-sm font-semibold text-primary truncate">
          Personal Vault
        </p>

        {admin && (
          <p className="text-xs text-muted truncate">
            Admin Panel
          </p>
        )}
      </div>
    </Link>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const nextTheme =
    theme === "dark"
      ? "light"
      : theme === "light"
        ? "system"
        : "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme)}
      className="w-9 h-9 rounded-xl glass flex items-center justify-center text-secondary hover:text-primary transition-colors"
      title={`Theme: ${theme}`}
      aria-label={`Switch theme. Current theme is ${theme}`}
    >
      {theme === "dark" ? (
        <Moon size={17} />
      ) : theme === "light" ? (
        <Sun size={17} />
      ) : (
        <Settings size={17} />
      )}
    </button>
  );
}

export function PublicHeader() {
  const { user, isAdmin, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const location = useLocation();

  const closeMobile = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-subtle bg-surface/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4">
        <div className="h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Logo />

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {publicNav.map((item) => {
              const Icon = item.icon;

              const active =
                item.to === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(item.to);

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? "bg-accent/10 text-accent"
                      : "text-secondary hover:text-primary hover:bg-white/5"
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />

            {isAdmin ? (
              <Link to="/admin">
                <GlassButton size="sm">
                  <Shield size={15} />
                  Admin
                </GlassButton>
              </Link>
            ) : user ? (
              <>
                <Link to="/account">
                  <GlassButton size="sm" variant="ghost">
                    <User size={15} />
                    Account
                  </GlassButton>
                </Link>

                <GlassButton
                  size="sm"
                  variant="ghost"
                  onClick={() => void logout()}
                >
                  <LogOut size={15} />
                </GlassButton>
              </>
            ) : (
              <>
                <Link to="/login">
                  <GlassButton size="sm" variant="ghost">
                    Login
                  </GlassButton>
                </Link>

                <Link to="/signup">
                  <GlassButton size="sm">
                    Sign Up
                  </GlassButton>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />

            <button
              type="button"
              onClick={() => setMobileOpen((value) => !value)}
              className="w-9 h-9 rounded-xl glass flex items-center justify-center text-secondary hover:text-primary"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileOpen && (
          <div className="md:hidden border-t border-subtle py-3 animate-fade-in">
            <nav className="space-y-1">
              {publicNav.map((item) => {
                const Icon = item.icon;

                const active =
                  item.to === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(item.to);

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={closeMobile}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium ${
                      active
                        ? "bg-accent/10 text-accent"
                        : "text-secondary hover:text-primary hover:bg-white/5"
                    }`}
                  >
                    <Icon size={17} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-3 pt-3 border-t border-subtle space-y-2">
              {isAdmin ? (
                <Link
                  to="/admin"
                  onClick={closeMobile}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-secondary hover:text-primary hover:bg-white/5"
                >
                  <Shield size={17} />
                  Admin Panel
                </Link>
              ) : user ? (
                <>
                  <Link
                    to="/account"
                    onClick={closeMobile}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-secondary hover:text-primary hover:bg-white/5"
                  >
                    <User size={17} />
                    Account
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      closeMobile();
                      void logout();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-secondary hover:text-primary hover:bg-white/5"
                  >
                    <LogOut size={17} />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={closeMobile}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-secondary hover:text-primary hover:bg-white/5"
                  >
                    <User size={17} />
                    Login
                  </Link>

                  <Link
                    to="/signup"
                    onClick={closeMobile}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-accent hover:bg-accent/10"
                  >
                    <Shield size={17} />
                    Create Account
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface text-primary">
      <div className="bg-gradient-mesh" />

      <PublicHeader />

      <main className="relative z-10">
        {children}
      </main>

      <footer className="relative z-10 border-t border-subtle mt-16">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
                <img
                  src={`${import.meta.env.BASE_URL}Logo.png`}
                  alt="Personal Vault"
                  className="w-5 h-5 object-contain"
                />
              </div>

              <span className="text-sm text-secondary">
                Personal Vault
              </span>
            </div>

            <p className="text-xs text-muted">
              Private. Organized. Secure.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function AdminSidebar({
  mobileOpen,
  setMobileOpen,
}: {
  mobileOpen?: boolean;
  setMobileOpen?: (value: boolean) => void;
}) {
  const { logout } = useAuth();
  const location = useLocation();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-subtle bg-surface/95 backdrop-blur-xl transform transition-transform duration-200 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0`}
    >
      {/* Brand */}
      <div className="p-4 border-b border-subtle">
        <Logo admin />
      </div>

      {/* Navigation */}
      <div className="p-3 h-[calc(100vh-137px)] overflow-y-auto">
        <nav className="space-y-1">
          {adminNav.map((item) => {
            const Icon = item.icon;

            const active =
              item.to === "/admin"
                ? location.pathname === "/admin"
                : location.pathname.startsWith(item.to);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen?.(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? "bg-accent/10 text-accent"
                    : "text-secondary hover:text-primary hover:bg-white/5"
                }`}
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-subtle bg-surface/95">
        <button
          type="button"
          onClick={() => void logout()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-secondary hover:text-primary hover:bg-white/5 transition-colors"
        >
          <LogOut size={17} />
          Logout
        </button>
      </div>
    </aside>
  );
}

export function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-surface text-primary">
      <div className="bg-gradient-mesh" />

      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      <AdminSidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main */}
      <div className="lg:pl-64 min-h-screen relative z-10">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 h-16 border-b border-subtle bg-surface/90 backdrop-blur-xl">
          <div className="h-full px-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="w-9 h-9 rounded-xl glass flex items-center justify-center text-secondary hover:text-primary"
              aria-label="Open navigation"
            >
              <Menu size={19} />
            </button>

            <Logo admin />

            <ThemeToggle />
          </div>
        </header>

        {/* Desktop top bar */}
        <header className="hidden lg:flex h-16 border-b border-subtle items-center justify-end px-6 gap-3">
          <ThemeToggle />

          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-secondary hover:text-primary hover:bg-white/5 transition-colors"
          >
            <Home size={16} />
            View Vault
          </Link>
        </header>

        <main className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Search your vault...",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <Search
        size={17}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
      />

      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="input-field pl-10"
      />
    </div>
  );
}