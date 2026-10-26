import React from 'react';
import { Download, FileText, Table, CheckCircle2, ShieldCheck } from 'lucide-react';
import { api } from '../api/client';

export const ExportPage: React.FC = () => {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Title */}
      <div className="border-b border-paper-border dark:border-paper-dark-border pb-4">
        <h1 className="font-serif text-2xl font-bold text-ink dark:text-ink-dark">
          Executive Dossier & Predictions Export
        </h1>
        <p className="font-serif italic text-xs text-ink-muted dark:text-ink-dark-muted mt-1">
          Export verified forecasts and analytical dossiers formatted for leadership reviews and audit verification.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PDF Executive Dossier */}
        <div className="border border-paper-border dark:border-paper-dark-border rounded bg-paper-card dark:bg-paper-dark-card p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2 text-accent">
              <FileText className="w-5 h-5" />
              <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-ink dark:text-ink-dark">
                Executive Analytics Dossier (PDF)
              </h3>
            </div>
            <p className="text-xs text-ink-muted dark:text-ink-dark-muted leading-relaxed">
              Publication-grade report generated with ReportLab containing portfolio baseline KPIs, 
              chronological model comparison tables, category promotional multipliers, and price elasticity estimates.
            </p>
            <ul className="mt-4 space-y-1.5 text-xs font-mono text-ink-muted">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-semantic-up" />
                <span>Executive Portfolio Metrics</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-semantic-up" />
                <span>Model Leaderboard (Val/Test MAE, RMSE, WAPE, R²)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-semantic-up" />
                <span>Category Elasticity & Confidence Intervals</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-semantic-up" />
                <span>Methodological association disclaimers</span>
              </li>
            </ul>
          </div>

          <a
            href={api.getSummaryPdfUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 bg-accent hover:bg-accent-hover text-white text-xs font-mono uppercase tracking-wider font-semibold rounded flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Generate & Download PDF</span>
          </a>
        </div>

        {/* CSV Test Predictions */}
        <div className="border border-paper-border dark:border-paper-dark-border rounded bg-paper-card dark:bg-paper-dark-card p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2 text-teal">
              <Table className="w-5 h-5" />
              <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-ink dark:text-ink-dark">
                Test Period Predictions (CSV)
              </h3>
            </div>
            <p className="text-xs text-ink-muted dark:text-ink-dark-muted leading-relaxed">
              Full store-item-level test dataset with ground truth units and out-of-sample forecasts from the 
              best performing model architecture (XGBoost Poisson).
            </p>
            <ul className="mt-4 space-y-1.5 text-xs font-mono text-ink-muted">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-semantic-up" />
                <span>79,547 test records</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-semantic-up" />
                <span>Store ID, UPC, and Week Ending Date</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-semantic-up" />
                <span>Ground truth `units` column</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-semantic-up" />
                <span>Best model predicted `pred` column</span>
              </li>
            </ul>
          </div>

          <a
            href={api.getPredictionsCsvUrl()}
            download="shelf_signal_test_predictions.csv"
            className="w-full py-2.5 px-4 bg-teal hover:bg-teal/90 text-white text-xs font-mono uppercase tracking-wider font-semibold rounded flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Predictions CSV</span>
          </a>
        </div>
      </div>

      {/* Security Note */}
      <div className="p-4 border border-paper-border dark:border-paper-dark-border rounded bg-paper-subtle/50 dark:bg-paper-dark-subtle/50 flex items-center gap-2 text-xs font-mono text-ink-muted">
        <ShieldCheck className="w-4 h-4 text-teal" />
        <span>All export transactions are cryptographically logged with user identity, timestamp, and client IP in the immutable audit trail.</span>
      </div>
    </div>
  );
};
