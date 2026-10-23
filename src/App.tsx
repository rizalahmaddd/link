import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import { User } from './types';
import { Navbar } from './components/Navbar';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PublicReportPage } from './pages/PublicReportPage';
import { GlobalAdModal } from './components/GlobalAdModal';
import { usePWA } from './hooks/usePWA';
import { AlertCircle } from 'lucide-react';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [globalAdOpen, setGlobalAdOpen] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  const { isInstallable, promptInstall } = usePWA();

  useEffect(() => {
    // Check URL parameters for direct token or auth error
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    const errorParam = params.get('error');

    if (tokenParam) {
      verifyMagicToken(tokenParam);
      return;
    }

    if (errorParam) {
      setUrlError(errorParam);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    checkAuth();
  }, []);

  const verifyMagicToken = async (token: string) => {
    setLoading(true);
    try {
      const res = await api.verifyToken(token);
      if (res.authenticated && res.user) {
        setUser(res.user);
        window.history.replaceState({}, document.title, '/');
      } else {
        setUrlError(res.error || 'Tautan masuk tidak valid atau sudah kedaluwarsa.');
        window.history.replaceState({}, document.title, '/');
      }
    } catch (err: any) {
      setUrlError(err?.message || 'Gagal memproses verifikasi masuk.');
      window.history.replaceState({}, document.title, '/');
    } finally {
      setLoading(false);
    }
  };

  const checkAuth = async () => {
    setLoading(true);
    try {
      const res = await api.getMe();
      if (res.authenticated && res.user) {
        setUser(res.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Public View-Only Sponsor Report Route
  const isReportRoute = window.location.pathname.startsWith('/report/');
  const reportToken = isReportRoute
    ? window.location.pathname.replace('/report/', '').split('/')[0]
    : null;

  if (isReportRoute && reportToken) {
    return <PublicReportPage reportToken={reportToken} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-400 gap-3">
        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-200 font-semibold text-sm">
          L
        </div>
        <span className="text-xs text-zinc-500 font-mono tracking-wide">Memuat...</span>
      </div>
    );
  }

  // Unauthenticated: Desk-style split showcase landing & login page
  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col text-zinc-100 font-sans selection:bg-zinc-800 selection:text-zinc-100">
        {urlError && (
          <div className="bg-red-950/50 border-b border-red-900/60 px-4 py-2.5 text-red-300 text-xs text-center flex items-center justify-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-red-400" />
            <span>{urlError}</span>
          </div>
        )}
        <LoginPage onLoginSuccess={checkAuth} />
      </div>
    );
  }

  // Authenticated: Dashboard
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col text-zinc-100 font-sans selection:bg-zinc-800 selection:text-zinc-100">
      
      {/* PWA Install Banner */}
      {isInstallable && <PWAInstallBanner onInstall={promptInstall} />}

      {/* Navigation Bar */}
      <Navbar
        user={user}
        onOpenGlobalAds={() => setGlobalAdOpen(true)}
        onLogout={handleLogout}
      />

      {/* URL Error Banner */}
      {urlError && (
        <div className="bg-red-950/40 border-b border-red-900/50 px-4 py-2 text-red-300 text-xs text-center flex items-center justify-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-red-400" />
          <span>{urlError}</span>
        </div>
      )}

      {/* Main View */}
      <main className="flex-1">
        <DashboardPage
          user={user}
          onRefreshUser={checkAuth}
        />
      </main>

      {/* Modals */}
      <GlobalAdModal
        isOpen={globalAdOpen}
        onClose={() => setGlobalAdOpen(false)}
        onUpdated={checkAuth}
      />

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-500">
        <p>&copy; {new Date().getFullYear()} Link</p>
      </footer>

    </div>
  );
};

export default App;
