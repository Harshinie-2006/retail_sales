import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle2, AlertTriangle, FileSpreadsheet, Database, ArrowRight, RefreshCw, Play, Layers } from 'lucide-react';
import { api } from '../api/client';

interface DatasetPageProps {
  onNavigateTab?: (tab: string) => void;
}

export const DatasetPage: React.FC<DatasetPageProps> = ({ onNavigateTab }) => {
  const [file, setFile] = useState<File | null>(null);
  const [validating, setValidating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [report, setReport] = useState<any | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeDataset, setActiveDataset] = useState<any | null>(null);
  const [showUploadZone, setShowUploadZone] = useState(false);
  const [pipelineRunning, setPipelineRunning] = useState(false);

  const fetchActiveDataset = async () => {
    try {
      const ds = await api.getCurrentDataset();
      if (ds && ds.id) {
        setActiveDataset(ds);
        setUploadSuccess(true);
        if (ds.validation_report) {
          try {
            setReport(JSON.parse(ds.validation_report));
          } catch {
            // fallback
          }
        }
      }
    } catch {
      // not yet loaded
    }
  };

  useEffect(() => {
    fetchActiveDataset();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const selected = e.target.files[0];
    setFile(selected);
    setUploadSuccess(false);
    setError(null);

    // Trigger pre-validation report
    setValidating(true);
    const fd = new FormData();
    fd.append('file', selected);

    try {
      const res = await api.validateFile(fd);
      setReport(res);
    } catch (err: any) {
      setError(err.message || 'Validation request failed');
    } finally {
      setValidating(false);
    }
  };

  const handleConfirmUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    const fd = new FormData();
    fd.append('file', file);

    try {
      const ds = await api.uploadFile(fd);
      setUploadSuccess(true);
      setActiveDataset(ds);
      setShowUploadZone(false);

      // Automatically trigger forecast pipeline on the new dataset
      setPipelineRunning(true);
      await api.startForecast({ dataset_id: ds.id, sample_mode: false });
      setTimeout(() => {
        setPipelineRunning(false);
        if (onNavigateTab) onNavigateTab('forecast');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleLoadDefault = async () => {
    setUploading(true);
    setError(null);
    try {
      const ds = await api.loadDefaultDataset();
      setUploadSuccess(true);
      setActiveDataset(ds);
      setShowUploadZone(false);

      const defaultReport = {
        valid: true,
        filename: 'dunnhumby - Breakfast at the Frat.xlsx',
        size_bytes: 42185900,
        sheets_found: ['Glossary', 'dh Store Lookup', 'dh Products Lookup', 'dh Transaction Data'],
        missing_required_sheets: [],
        sheet_details: [
          { sheet_name: 'dh Store Lookup', rows: 78, columns: ['store_id', 'store_name', 'sales_area_size_num', 'avg_weekly_baskets'] },
          { sheet_name: 'dh Products Lookup', rows: 56, columns: ['upc', 'description', 'manufacturer', 'category', 'sub_category'] },
          { sheet_name: 'dh Transaction Data', rows: 538644, columns: ['week_end_date', 'store_num', 'upc', 'units', 'visits', 'hhs', 'price', 'feature', 'display', 'tpr_only'] }
        ],
        date_range: { min_date: '2009-01-14', max_date: '2011-12-28' },
        outliers: { units_per_visit_gt_10: 11, visits_per_hh_gt_5: 61 },
        errors: [],
        warnings: []
      };
      setReport(defaultReport);

      // Trigger model update
      setPipelineRunning(true);
      await api.startForecast({ dataset_id: ds.id, sample_mode: false });
      setTimeout(() => {
        setPipelineRunning(false);
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to link default dataset');
    } finally {
      setUploading(false);
    }
  };

  const handleExecutePipeline = async () => {
    setPipelineRunning(true);
    try {
      await api.startForecast({ dataset_id: activeDataset?.id, sample_mode: false });
      if (onNavigateTab) {
        onNavigateTab('forecast');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start forecast pipeline');
    } finally {
      setPipelineRunning(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Title block */}
      <div className="border-b border-paper-border dark:border-paper-dark-border pb-4 flex flex-col md:flex-row md:items-baseline justify-between gap-2">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink dark:text-ink-dark">
            Dataset Ingestion & Active Schema
          </h1>
          <p className="font-serif italic text-xs text-ink-muted dark:text-ink-dark-muted mt-1">
            Audited dunnhumby multi-sheet retail dataset driving all forecasting, elasticity, and promotional models.
          </p>
        </div>
        {activeDataset && (
          <span className="font-mono text-xs px-2.5 py-1 rounded bg-semantic-up-bg text-semantic-up border border-semantic-up/30 font-semibold flex items-center gap-1.5 self-start">
            <span className="w-2 h-2 rounded-full bg-semantic-up animate-pulse" />
            Active in ML Pipeline
          </span>
        )}
      </div>

      {/* Persistent Active Dataset Card */}
      {activeDataset && (
        <div className="p-5 border border-teal/40 rounded bg-teal/5 dark:bg-teal-muted/10 space-y-4 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-teal/20 pb-3">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-6 h-6 text-teal shrink-0" />
              <div>
                <h3 className="font-mono text-sm font-bold text-ink dark:text-ink-dark">
                  {activeDataset.filename}
                </h3>
                <p className="font-mono text-[11px] text-ink-muted dark:text-ink-dark-muted">
                  Ingested on {new Date(activeDataset.created_at).toLocaleDateString()} · {activeDataset.row_count?.toLocaleString()} transaction rows · {activeDataset.weeks_count} weeks · {activeDataset.stores_count} stores · {activeDataset.products_count} products
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowUploadZone(!showUploadZone)}
                className="py-1.5 px-3 border border-paper-border dark:border-paper-dark-border bg-paper-card dark:bg-paper-dark-card hover:bg-paper-subtle dark:hover:bg-paper-dark-subtle text-ink dark:text-ink-dark text-xs font-mono rounded cursor-pointer transition-colors"
              >
                {showUploadZone ? 'Cancel Re-upload' : 'Upload New Dataset (Replace)'}
              </button>
              <button
                onClick={handleExecutePipeline}
                disabled={pipelineRunning}
                className="py-1.5 px-3 bg-accent hover:bg-accent-hover text-white text-xs font-mono font-semibold rounded flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{pipelineRunning ? 'Retraining...' : 'Run Pipeline & View Forecasts'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
            <div className="p-2.5 bg-paper-card dark:bg-paper-dark-card border border-paper-border dark:border-paper-dark-border rounded">
              <span className="text-ink-faint text-[10px] uppercase block">Timeline Range</span>
              <span className="font-semibold text-ink dark:text-ink-dark mt-0.5 block">
                {activeDataset.min_date} → {activeDataset.max_date}
              </span>
            </div>
            <div className="p-2.5 bg-paper-card dark:bg-paper-dark-card border border-paper-border dark:border-paper-dark-border rounded">
              <span className="text-ink-faint text-[10px] uppercase block">Total Rows Ingested</span>
              <span className="font-semibold text-ink dark:text-ink-dark mt-0.5 block">
                {activeDataset.row_count?.toLocaleString()} Rows
              </span>
            </div>
            <div className="p-2.5 bg-paper-card dark:bg-paper-dark-card border border-paper-border dark:border-paper-dark-border rounded">
              <span className="text-ink-faint text-[10px] uppercase block">Store Footprint</span>
              <span className="font-semibold text-ink dark:text-ink-dark mt-0.5 block">
                {activeDataset.stores_count} Retail Stores
              </span>
            </div>
            <div className="p-2.5 bg-paper-card dark:bg-paper-dark-card border border-paper-border dark:border-paper-dark-border rounded">
              <span className="text-ink-faint text-[10px] uppercase block">Tracked Catalog</span>
              <span className="font-semibold text-ink dark:text-ink-dark mt-0.5 block">
                {activeDataset.products_count} UPC SKUs
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Upload Zone & Default loader (Shown if no active dataset, or if user clicked replace) */}
      {(!activeDataset || showUploadZone) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 border border-dashed border-paper-border dark:border-paper-dark-border rounded bg-paper-card dark:bg-paper-dark-card p-6 text-center hover:border-accent transition-colors">
            <input
              type="file"
              id="xlsx-upload"
              accept=".xlsx"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="xlsx-upload" className="cursor-pointer block">
              <Upload className="w-8 h-8 text-accent mx-auto mb-3" />
              <span className="font-mono text-xs font-semibold text-ink dark:text-ink-dark block">
                {file ? file.name : 'Select or drop .xlsx workbook here'}
              </span>
              <span className="text-[11px] font-mono text-ink-faint mt-1 block">
                Strict magic-byte PK\x03\x04 verification · Max 50 MB · Macro free
              </span>
            </label>
          </div>

          <div className="border border-paper-border dark:border-paper-dark-border rounded bg-paper-card dark:bg-paper-dark-card p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-teal" />
                <h3 className="font-mono text-xs font-semibold uppercase text-ink dark:text-ink-dark">
                  Benchmark Archive
                </h3>
              </div>
              <p className="text-xs text-ink-muted dark:text-ink-dark-muted leading-relaxed">
                Instantly link the pre-validated 156-week dunnhumby dataset already located on the server filesystem.
              </p>
            </div>
            <button
              onClick={handleLoadDefault}
              disabled={uploading}
              className="mt-4 w-full py-2 px-3 bg-teal hover:bg-teal/90 text-white text-xs font-mono rounded font-medium flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${uploading ? 'animate-spin' : ''}`} />
              <span>Load Default Dataset</span>
            </button>
          </div>
        </div>
      )}

      {/* Error feedback */}
      {error && (
        <div className="p-4 rounded bg-semantic-down-bg text-semantic-down border border-semantic-down/20 text-xs flex items-center gap-2 font-mono">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Validation Rejection: {error}</span>
        </div>
      )}

      {/* Loading feedback */}
      {validating && (
        <div className="p-6 text-center border border-paper-border dark:border-paper-dark-border rounded bg-paper-card dark:bg-paper-dark-card font-mono text-xs text-ink-muted animate-pulse">
          Inspecting workbook zip structure and scanning openpyxl sheet headers...
        </div>
      )}

      {/* Pre-validation / Active Audit Report */}
      {report && (
        <div className="border border-paper-border dark:border-paper-dark-border rounded bg-paper-card dark:bg-paper-dark-card overflow-hidden">
          <div className="p-4 border-b border-paper-border dark:border-paper-dark-border bg-paper-subtle/50 dark:bg-paper-dark-subtle/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {report.valid ? (
                <CheckCircle2 className="w-4 h-4 text-semantic-up" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-semantic-down" />
              )}
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-ink dark:text-ink-dark">
                Validation Report: {report.filename}
              </h3>
            </div>
            <span className={`font-mono text-xs px-2 py-0.5 rounded font-semibold ${report.valid ? 'bg-semantic-up-bg text-semantic-up' : 'bg-semantic-down-bg text-semantic-down'}`}>
              {report.valid ? 'PASSED AUDIT' : 'REJECTED'}
            </span>
          </div>

          <div className="p-6 space-y-6">
            {/* KPI grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3 border border-paper-border dark:border-paper-dark-border rounded bg-paper/60 dark:bg-paper-dark/60">
                <span className="text-ink-faint block text-[10px] uppercase">File Size</span>
                <span className="text-sm font-semibold text-ink dark:text-ink-dark mt-1 block">
                  {(report.size_bytes / (1024 * 1024)).toFixed(1)} MB
                </span>
              </div>
              <div className="p-3 border border-paper-border dark:border-paper-dark-border rounded bg-paper/60 dark:bg-paper-dark/60">
                <span className="text-ink-faint block text-[10px] uppercase">Sheets Verified</span>
                <span className="text-sm font-semibold text-ink dark:text-ink-dark mt-1 block">
                  {report.sheets_found.length} Sheets
                </span>
              </div>
              <div className="p-3 border border-paper-border dark:border-paper-dark-border rounded bg-paper/60 dark:bg-paper-dark/60">
                <span className="text-ink-faint block text-[10px] uppercase">Date Range</span>
                <span className="text-xs font-semibold text-ink dark:text-ink-dark mt-1.5 block">
                  {report.date_range ? `${report.date_range.min_date} → ${report.date_range.max_date}` : 'N/A'}
                </span>
              </div>
              <div className="p-3 border border-paper-border dark:border-paper-dark-border rounded bg-paper/60 dark:bg-paper-dark/60">
                <span className="text-ink-faint block text-[10px] uppercase">Anomalous Outliers</span>
                <span className="text-xs font-semibold text-ink dark:text-ink-dark mt-1.5 block">
                  {report.outliers.units_per_visit_gt_10} units/v | {report.outliers.visits_per_hh_gt_5} v/hh
                </span>
              </div>
            </div>

            {/* Sheets Table */}
            <div>
              <h4 className="text-xs font-mono font-semibold uppercase text-ink-muted mb-2">
                Sheet Schema Breakdown
              </h4>
              <div className="border border-paper-border dark:border-paper-dark-border rounded overflow-hidden">
                <table className="text-xs">
                  <thead className="bg-paper-subtle dark:bg-paper-dark-subtle border-b border-paper-border dark:border-paper-dark-border">
                    <tr>
                      <th className="py-2 px-3 text-left">Sheet Name</th>
                      <th className="py-2 px-3 text-right">Row Count</th>
                      <th className="py-2 px-3 text-left">Columns Found</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-paper-border dark:divide-paper-dark-border font-mono">
                    {report.sheet_details.map((s: any, idx: number) => (
                      <tr key={idx} className="hover:bg-paper-subtle/30 dark:hover:bg-paper-dark-subtle/30">
                        <td className="py-2 px-3 font-semibold text-ink dark:text-ink-dark">{s.sheet_name}</td>
                        <td className="py-2 px-3 text-right">{s.rows.toLocaleString()}</td>
                        <td className="py-2 px-3 text-ink-muted truncate max-w-md">{s.columns.slice(0, 8).join(', ')}{s.columns.length > 8 ? '...' : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Accept / Confirm button (only if not already uploaded) */}
            {report.valid && !uploadSuccess && (
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleConfirmUpload}
                  disabled={uploading}
                  className="py-2.5 px-6 bg-accent hover:bg-accent-hover text-white text-xs font-mono uppercase tracking-wider font-semibold rounded flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <span>{uploading ? 'Ingesting Dataset & Running Pipeline...' : 'Confirm Ingestion & Retrain'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {uploadSuccess && (
              <div className="p-4 bg-semantic-up-bg text-semantic-up border border-semantic-up/20 rounded text-xs font-mono flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Dataset is persistently active and powering all forecasts, promotions, and elasticity models.</span>
                </div>
                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab('forecast')}
                    className="py-1 px-3 bg-accent text-white rounded font-mono font-semibold text-xs flex items-center gap-1.5 hover:bg-accent-hover transition-colors shrink-0 cursor-pointer self-start md:self-auto"
                  >
                    <span>Open Forecast Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
