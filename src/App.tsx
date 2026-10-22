import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { LoadingScreen } from './components/ui';
// Lazy load pages
const HomePage = lazy(() => import('./pages/PublicPages').then(m => ({ default: m.HomePage })));
const CategoryPageLazy = lazy(() => import('./pages/PublicPages').then(m => ({ default: m.CategoryPage })));
const ItemDetailPage = lazy(() => import('./pages/PublicPages').then(m => ({ default: m.ItemDetailPage })));
const SharePage = lazy(() => import('./pages/PublicPages').then(m => ({ default: m.SharePage })));
const LoginPage = lazy(() => import('./pages/AuthPages').then(m => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import('./pages/AuthPages').then(m => ({ default: m.SignupPage })));
const AdminLoginPage = lazy(() => import('./pages/AuthPages').then(m => ({ default: m.AdminLoginPage })));
const AccountPage = lazy(() => import('./pages/AuthPages').then(m => ({ default: m.AccountPage })));
const AdminDashboard = lazy(() => import('./pages/AdminPages').then(m => ({ default: m.AdminDashboard })));
const AdminItemsPage = lazy(() => import('./pages/AdminPages').then(m => ({ default: m.AdminItemsPage })));
const AdminMembersPage = lazy(() => import('./pages/AdminPages').then(m => ({ default: m.AdminMembersPage })));
const AdminActivityPage = lazy(() => import('./pages/AdminPages').then(m => ({ default: m.AdminActivityPage })));
const AdminSharesPage = lazy(() => import('./pages/AdminPages').then(m => ({ default: m.AdminSharesPage })));
const AdminSettingsPage = lazy(() => import('./pages/AdminPages').then(m => ({ default: m.AdminSettingsPage })));
const NotFoundPage = lazy(() => import('./pages/ErrorPages').then(m => ({ default: m.NotFoundPage })));

// Category wrapper components
function LinksPage() { return <CategoryPageLazy type="link" />; }
function VideosPage() { return <CategoryPageLazy type="video" />; }
function NotesPage() { return <CategoryPageLazy type="note" />; }
function FilesPage() { return <CategoryPageLazy type="file" />; }

// Auth guards
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { role, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (role !== 'admin') return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

function MemberRoute({ children }: { children: React.ReactNode }) {
  const { role, member, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (role === 'anonymous') return <Navigate to="/login" replace />;
  if (role === 'member' && member?.status !== 'approved') return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// App routes
function AppRoutes() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/links" element={<LinksPage />} />
        <Route path="/videos" element={<VideosPage />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/files" element={<FilesPage />} />
        <Route path="/item/:id" element={<ItemDetailPage />} />
        <Route path="/share/:token" element={<SharePage />} />

        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* Member Routes */}
        <Route path="/account" element={<MemberRoute><AccountPage /></MemberRoute>} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/items" element={<AdminRoute><AdminItemsPage /></AdminRoute>} />
        <Route path="/admin/links" element={<AdminRoute><AdminItemsPage typeFilter="link" /></AdminRoute>} />
        <Route path="/admin/videos" element={<AdminRoute><AdminItemsPage typeFilter="video" /></AdminRoute>} />
        <Route path="/admin/notes" element={<AdminRoute><AdminItemsPage typeFilter="note" /></AdminRoute>} />
        <Route path="/admin/files" element={<AdminRoute><AdminItemsPage typeFilter="file" /></AdminRoute>} />
        <Route path="/admin/members" element={<AdminRoute><AdminMembersPage /></AdminRoute>} />
        <Route path="/admin/shares" element={<AdminRoute><AdminSharesPage /></AdminRoute>} />
        <Route path="/admin/activity" element={<AdminRoute><AdminActivityPage /></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminRoute><AdminSettingsPage /></AdminRoute>} />

        {/* Catch all */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
