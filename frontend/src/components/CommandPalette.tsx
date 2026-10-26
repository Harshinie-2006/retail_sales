import React, { useState, useEffect } from 'react';
import { Search, LayoutDashboard, Database, TrendingUp, Tags, SlidersHorizontal, Download, ShieldAlert } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: string) => void;
  isAdmin: boolean;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  isAdmin,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const commands = [
    { id: 'overview', title: 'Go to Executive Overview', section: 'Navigation', icon: LayoutDashboard },
    { id: 'dataset', title: 'Audit Dataset & Upload', section: 'Navigation', icon: Database },
    { id: 'forecast', title: 'Open ML Sales Forecast Models', section: 'Navigation', icon: TrendingUp },
    { id: 'promotions', title: 'Analyze Promotional Multipliers', section: 'Navigation', icon: Tags },
    { id: 'elasticity', title: 'Simulate Price Elasticity What-If', section: 'Navigation', icon: SlidersHorizontal },
    { id: 'export', title: 'Download Dossier (PDF & CSV)', section: 'Navigation', icon: Download },
  ];

  if (isAdmin) {
    commands.push({ id: 'audit', title: 'Inspect Security Audit Trail', section: 'Administration', icon: ShieldAlert });
  }

  const filtered = commands.filter(c =>
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.section.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-ink/40 dark:bg-black/60 backdrop-blur-xs">
      <div 
        className="w-full max-w-lg bg-paper-card dark:bg-paper-dark-card border border-paper-border dark:border-paper-dark-border rounded shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 border-b border-paper-border dark:border-paper-dark-border">
          <Search className="w-4 h-4 text-ink-faint mr-2" />
          <input
            type="text"
            placeholder="Type a command or navigate to a screen..."
            className="w-full py-3 text-sm bg-transparent border-none text-ink dark:text-ink-dark placeholder:text-ink-faint focus:ring-0 focus:outline-none font-sans"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-paper-subtle dark:bg-paper-dark-subtle rounded border border-paper-border dark:border-paper-dark-border text-ink-faint">
            ESC
          </kbd>
        </div>

        <div className="max-h-72 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <p className="p-4 text-center text-xs font-mono text-ink-faint">No matching commands found</p>
          ) : (
            filtered.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.id}
                  onClick={() => {
                    onSelectTab(cmd.id);
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-xs text-left rounded text-ink dark:text-ink-dark hover:bg-paper-subtle dark:hover:bg-paper-dark-subtle transition-colors"
                >
                  <Icon className="w-4 h-4 text-accent" />
                  <div className="flex-1">
                    <span className="font-medium">{cmd.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-ink-faint uppercase">{cmd.section}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
      <div className="fixed inset-0 -z-10" onClick={onClose} />
    </div>
  );
};
