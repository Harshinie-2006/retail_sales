import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search, Filter, RefreshCw, Calendar, Terminal } from 'lucide-react';
import { api } from '../api/client';

export const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getAuditLogs({
        action: actionFilter || undefined,
        user_email: emailFilter || undefined,
        limit: 50,
      });
      setLogs(res);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, emailFilter]);

  const getActionBadgeColor = (action: string) => {
    if (action.startsWith('auth:')) return 'text-teal bg-teal/10 border-teal/20';
    if (action.startsWith('dataset:')) return 'text-accent bg-accent/10 border-accent/20';
    if (action.startsWith('forecast:')) return 'text-semantic-up bg-semantic-up/10 border-semantic-up/20';
    if (action.startsWith('export:')) return 'text-purple-600 bg-purple-50 border-purple-200';
    return 'text-ink-muted bg-paper-subtle border-paper-border';
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Title */}
      <div className="border-b border-paper-border dark:border-paper-dark-border pb-4 flex flex-col md:flex-row md:items-baseline justify-between gap-2">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink dark:text-ink-dark flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-accent" />
            <span>Security & Compliance Audit Trail</span>
          </h1>
          <p className="font-serif italic text-xs text-ink-muted dark:text-ink-dark-muted mt-1">
            Immutable log of all user authentication events, dataset ingestions, model training jobs, and data exports.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="p-2 border border-paper-border dark:border-paper-dark-border rounded text-ink-muted hover:text-ink dark:hover:text-ink-dark hover:bg-paper-subtle dark:hover:bg-paper-dark-subtle cursor-pointer transition-colors"
          title="Refresh Logs"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 border border-paper-border dark:border-paper-dark-border rounded bg-paper-card dark:bg-paper-dark-card flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-3.5 h-3.5 text-ink-faint absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Filter by user email..."
            value={emailFilter}
            onChange={(e) => setEmailFilter(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs font-mono bg-paper dark:bg-paper-dark border border-paper-border dark:border-paper-dark-border rounded text-ink dark:text-ink-dark"
          />
        </div>

        <div className="w-full sm:w-64">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full py-1.5 px-3 text-xs font-mono bg-paper dark:bg-paper-dark border border-paper-border dark:border-paper-dark-border rounded text-ink dark:text-ink-dark"
          >
            <option value="">All Actions</option>
            <option value="auth:">Authentication Events (Login/Logout)</option>
            <option value="dataset:">Dataset Ingestions</option>
            <option value="forecast:">Model Training Runs</option>
            <option value="export:">Dossier / CSV Exports</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="border border-paper-border dark:border-paper-dark-border rounded bg-paper-card dark:bg-paper-dark-card overflow-hidden">
        <table className="text-xs">
          <thead className="bg-paper-subtle dark:bg-paper-dark-subtle border-b border-paper-border dark:border-paper-dark-border">
            <tr>
              <th className="py-2.5 px-4 text-left">Timestamp (UTC)</th>
              <th className="py-2.5 px-4 text-left">Actor (Email)</th>
              <th className="py-2.5 px-4 text-left">Action Triggered</th>
              <th className="py-2.5 px-4 text-left">Client IP</th>
              <th className="py-2.5 px-4 text-left">Event Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-paper-border dark:divide-paper-dark-border font-mono">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-ink-faint">
                  {loading ? 'Retrieving audit entries...' : 'No audit records match the selected criteria.'}
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-paper-subtle/30 dark:hover:bg-paper-dark-subtle/30">
                  <td className="py-3 px-4 text-ink-faint text-[11px] whitespace-nowrap">
                    {new Date(log.created_at).toISOString().replace('T', ' ').substring(0, 19)}
                  </td>
                  <td className="py-3 px-4 font-semibold text-ink dark:text-ink-dark">
                    {log.user_email}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded border text-[11px] uppercase tracking-wider font-semibold ${getActionBadgeColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-ink-muted text-[11px]">
                    {log.ip_address || '127.0.0.1'}
                  </td>
                  <td className="py-3 px-4 text-ink-muted text-[11px] max-w-xs truncate" title={JSON.stringify(log.details)}>
                    {log.details ? JSON.stringify(log.details) : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
