import React from 'react';
import { 
  LayoutDashboard, 
  Database, 
  TrendingUp, 
  Tags, 
  SlidersHorizontal, 
  Download, 
  ShieldAlert, 
  LogOut, 
  Sun, 
  Moon,
  Command
} from 'lucide-react';

interface LeftRailProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUser: any;
  onLogout: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onOpenCommandPalette: () => void;
}

export const LeftRail: React.FC<LeftRailProps> = ({
  currentTab,
  setCurrentTab,
  currentUser,
  onLogout,
  darkMode,
  setDarkMode,
  onOpenCommandPalette,
}) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, shortcut: '1' },
    { id: 'dataset', label: 'Dataset', icon: Database, shortcut: '2' },
    { id: 'forecast', label: 'Forecast', icon: TrendingUp, shortcut: '3' },
    { id: 'promotions', label: 'Promotion Lift', icon: Tags, shortcut: '4' },
    { id: 'elasticity', label: 'Price Elasticity', icon: SlidersHorizontal, shortcut: '5' },
    { id: 'export', label: 'Dossier & Export', icon: Download, shortcut: '6' },
  ];

  if (currentUser?.role === 'admin') {
    navItems.push({ id: 'audit', label: 'Audit Log', icon: ShieldAlert, shortcut: '7' });
  }

  return (
    <aside className="w-64 border-r border-paper-border dark:border-paper-dark-border bg-paper-card dark:bg-paper-dark-card flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Masthead Header */}
        <div className="p-5 border-b border-paper-border dark:border-paper-dark-border">
          <div className="flex items-baseline justify-between">
            <h1 className="font-serif text-xl tracking-tight font-bold text-ink dark:text-ink-dark">
              SHELF SIGNAL
            </h1>
            <span className="font-mono text-[10px] text-accent dark:text-accent-dark tracking-widest uppercase">
              v1.0
            </span>
          </div>
          <p className="font-serif italic text-xs text-ink-muted dark:text-ink-dark-muted mt-0.5">
            Pricing & Promotion Analytics
          </p>
        </div>

        {/* Quick Command Hint */}
        <div className="px-4 py-2 border-b border-paper-border/60 dark:border-paper-dark-border/60 bg-paper-subtle/40 dark:bg-paper-dark-subtle/40">
          <button
            onClick={onOpenCommandPalette}
            className="w-full flex items-center justify-between text-xs font-mono text-ink-muted dark:text-ink-dark-muted hover:text-ink dark:hover:text-ink-dark py-1 px-2 rounded border border-paper-border dark:border-paper-dark-border bg-paper dark:bg-paper-dark"
          >
            <span className="flex items-center gap-1.5">
              <Command className="w-3.5 h-3.5" /> Quick Action
            </span>
            <kbd className="px-1.5 py-0.5 text-[10px] bg-paper-subtle dark:bg-paper-dark-subtle rounded border border-paper-border dark:border-paper-dark-border">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded transition-colors ${
                  isActive
                    ? 'bg-paper dark:bg-paper-dark text-accent dark:text-accent-dark font-semibold shadow-sm border border-paper-border dark:border-paper-dark-border'
                    : 'text-ink-muted dark:text-ink-dark-muted hover:bg-paper-subtle/70 dark:hover:bg-paper-dark-subtle/70 hover:text-ink dark:hover:text-ink-dark'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-accent dark:text-accent-dark' : 'text-ink-faint'}`} />
                  <span>{item.label}</span>
                </div>
                <span className="font-mono text-[10px] text-ink-faint opacity-60">
                  {item.shortcut}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Status & Utility Bar */}
      <div className="p-4 border-t border-paper-border dark:border-paper-dark-border bg-paper/50 dark:bg-paper-dark/50 space-y-3">
        <div className="flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-xs font-mono font-medium text-ink dark:text-ink-dark truncate" title={currentUser?.email}>
              {currentUser?.email || 'analyst@retail.local'}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${currentUser?.role === 'admin' ? 'bg-accent' : 'bg-teal'}`} />
              <span className="font-mono text-[10px] tracking-wide uppercase text-ink-muted dark:text-ink-dark-muted">
                {currentUser?.role || 'Analyst'}
              </span>
            </div>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-1.5 text-ink-muted dark:text-ink-dark-muted hover:text-ink dark:hover:text-ink-dark rounded hover:bg-paper-subtle dark:hover:bg-paper-dark-subtle"
            title="Toggle Light/Dark Theme"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-ink-muted hover:text-semantic-down border border-paper-border dark:border-paper-dark-border rounded hover:bg-semantic-down-bg/20 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
