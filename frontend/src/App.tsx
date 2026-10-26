import React, { useState, useEffect } from 'react';
import { LeftRail } from './components/LeftRail';
import { Header } from './components/Header';
import { CommandPalette } from './components/CommandPalette';
import { AuthPage } from './pages/AuthPage';
import { DatasetPage } from './pages/DatasetPage';
import { OverviewPage } from './pages/OverviewPage';
import { ForecastPage } from './pages/ForecastPage';
import { PromotionsPage } from './pages/PromotionsPage';
import { ElasticityPage } from './pages/ElasticityPage';
import { ExportPage } from './pages/ExportPage';
import { AuditPage } from './pages/AuditPage';
import { api } from './api/client';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Sync dark mode class to html tag
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Check existing session
  useEffect(() => {
    api.getMe()
      .then(res => {
        if (res && res.user) setCurrentUser(res.user);
      })
      .catch(() => setCurrentUser(null))
      .finally(() => setCheckingAuth(false));
  }, []);

  // Global keyboard shortcuts (1-7 for tabs)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      switch (e.key) {
        case '1': setCurrentTab('overview'); break;
        case '2': setCurrentTab('dataset'); break;
        case '3': setCurrentTab('forecast'); break;
        case '4': setCurrentTab('promotions'); break;
        case '5': setCurrentTab('elasticity'); break;
        case '6': setCurrentTab('export'); break;
        case '7': 
          if (currentUser?.role === 'admin') setCurrentTab('audit'); 
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    } finally {
      setCurrentUser(null);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-paper dark:bg-paper-dark flex items-center justify-center font-mono text-xs text-ink-muted">
        Initializing Shelf Signal Workstation...
      </div>
    );
  }

  if (!currentUser) {
    return <AuthPage onSuccess={(user) => setCurrentUser(user)} />;
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'overview': return <OverviewPage />;
      case 'dataset': return <DatasetPage onNavigateTab={setCurrentTab} />;
      case 'forecast': return <ForecastPage />;
      case 'promotions': return <PromotionsPage />;
      case 'elasticity': return <ElasticityPage />;
      case 'export': return <ExportPage />;
      case 'audit': return currentUser.role === 'admin' ? <AuditPage /> : <OverviewPage />;
      default: return <OverviewPage />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-paper dark:bg-paper-dark text-ink dark:text-ink-dark">
      {/* Left rail navigation */}
      <LeftRail
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header currentTab={currentTab} />
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>

      {/* Quick Action Palette Modal */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onSelectTab={setCurrentTab}
        isAdmin={currentUser?.role === 'admin'}
      />
    </div>
  );
};

export default App;
