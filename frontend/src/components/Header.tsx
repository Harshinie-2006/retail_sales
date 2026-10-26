import React from 'react';
import { Database, Calendar, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  datasetInfo?: any;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, datasetInfo }) => {
  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'overview': return 'Executive Overview & Baseline KPIs';
      case 'dataset': return 'Dataset Audit & Schema Validation';
      case 'forecast': return 'Econometric & ML Sales Forecasting';
      case 'promotions': return 'Promotional Lift & Mechanism Effectiveness';
      case 'elasticity': return 'Price Elasticity of Demand & Scenario What-If';
      case 'export': return 'Executive Dossier & Predictions Export';
      case 'audit': return 'Security & Operations Audit Trail';
      default: return 'Analyst Desk';
    }
  };

  return (
    <header className="h-14 border-b border-paper-border dark:border-paper-dark-border bg-paper-card/70 dark:bg-paper-dark-card/70 backdrop-blur-sm px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs text-ink-faint uppercase tracking-wider">
          Desk / {currentTab}
        </span>
        <span className="text-paper-border dark:text-paper-dark-border">/</span>
        <h2 className="font-serif text-sm font-semibold text-ink dark:text-ink-dark">
          {getTabTitle(currentTab)}
        </h2>
      </div>

      <div className="flex items-center gap-4 text-xs font-mono">
        {/* Active Dataset Pill */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-paper-subtle dark:bg-paper-dark-subtle border border-paper-border dark:border-paper-dark-border text-ink-muted dark:text-ink-dark-muted">
          <Database className="w-3.5 h-3.5 text-accent" />
          <span>dunnhumby · 538,643 tx · 156w</span>
        </div>

        {/* Security badge */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded text-teal dark:text-teal-dark bg-teal/10 border border-teal/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Isolated Session</span>
        </div>
      </div>
    </header>
  );
};
