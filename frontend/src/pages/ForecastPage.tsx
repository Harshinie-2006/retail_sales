import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { Play, CheckCircle, RefreshCw, Award, BarChart2, AlertCircle } from 'lucide-react';
import { api } from '../api/client';

export const ForecastPage: React.FC = () => {
  const [forecastData, setForecastData] = useState<any | null>(null);
  const [statusInfo, setStatusInfo] = useState<any | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = async () => {
    try {
      const res = await api.getForecastResults();
      setForecastData(res);
    } catch (err: any) {
      console.error('Failed to fetch forecast results:', err);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const handleStartRun = async () => {
    setRunning(true);
    setError(null);
    try {
      const started = await api.startForecast({ sample_mode: false });
      setStatusInfo(started);

      // Poll status until complete
      const pollInterval = setInterval(async () => {
        try {
          const currentStatus = await api.getForecastStatus();
          setStatusInfo(currentStatus);
          if (currentStatus.status === 'completed') {
            clearInterval(pollInterval);
            setRunning(false);
            fetchResults();
          } else if (currentStatus.status === 'failed') {
            clearInterval(pollInterval);
            setRunning(false);
            setError(currentStatus.error_message || 'Model execution failed');
          }
        } catch {
          clearInterval(pollInterval);
          setRunning(false);
        }
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to start forecast job');
      setRunning(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Title section */}
      <div className="border-b border-paper-border dark:border-paper-dark-border pb-4 flex flex-col md:flex-row md:items-baseline justify-between gap-2">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink dark:text-ink-dark">
            Econometric & ML Sales Forecasting
          </h1>
          <p className="font-serif italic text-xs text-ink-muted dark:text-ink-dark-muted mt-1">
            Chronological 70/15/15 time split: benchmark baselines vs. Gradient Boosted Trees and Random Forest.
          </p>
        </div>
        <button
          onClick={handleStartRun}
          disabled={running}
          className="py-2 px-4 bg-accent hover:bg-accent-hover text-white text-xs font-mono uppercase tracking-wider font-semibold rounded flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
        >
          {running ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Training In Progress...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Execute Model Pipeline</span>
            </>
          )}
        </button>
      </div>

      {/* Progress Banner */}
      {running && statusInfo && (
        <div className="p-4 border border-accent/30 rounded bg-accent/5 dark:bg-accent-dark-muted/20 space-y-2">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="font-semibold text-accent dark:text-accent-dark flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              {statusInfo.current_step}
            </span>
            <span className="font-bold text-ink dark:text-ink-dark">{statusInfo.progress}%</span>
          </div>
          <div className="w-full bg-paper-border dark:bg-paper-dark-border h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-accent h-full transition-all duration-300 rounded-full"
              style={{ width: `${statusInfo.progress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-semantic-down-bg text-semantic-down border border-semantic-down/20 rounded text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>Pipeline Error: {error}</span>
        </div>
      )}

      {/* Model Leaderboard Table */}
      <div className="border border-paper-border dark:border-paper-dark-border rounded bg-paper-card dark:bg-paper-dark-card p-6">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <h3 className="font-serif text-base font-bold text-ink dark:text-ink-dark flex items-center gap-2">
              <span>Model Leaderboard & Metric Comparison</span>
              <span className="px-2 py-0.5 text-[10px] font-mono bg-teal/15 text-teal border border-teal/20 rounded uppercase">
                Selected: {forecastData?.best_model || 'XGBoost (Poisson)'}
              </span>
            </h3>
            <p className="font-serif italic text-xs text-ink-muted dark:text-ink-dark-muted">
              Evaluated on 80,485 validation rows and 79,547 test rows strictly separated in time.
            </p>
          </div>
        </div>

        <div className="border border-paper-border dark:border-paper-dark-border rounded overflow-hidden">
          <table className="text-xs">
            <thead className="bg-paper-subtle dark:bg-paper-dark-subtle border-b border-paper-border dark:border-paper-dark-border">
              <tr>
                <th className="py-2.5 px-3 text-left">Model Architecture</th>
                <th className="py-2.5 px-3 text-right">Val MAE</th>
                <th className="py-2.5 px-3 text-right">Val RMSE</th>
                <th className="py-2.5 px-3 text-right">Val WAPE %</th>
                <th className="py-2.5 px-3 text-right">Val R²</th>
                <th className="py-2.5 px-3 text-right">Test MAE</th>
                <th className="py-2.5 px-3 text-right">Test RMSE</th>
                <th className="py-2.5 px-3 text-right">Test WAPE %</th>
                <th className="py-2.5 px-3 text-right">Test R²</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-border dark:divide-paper-dark-border font-mono">
              {forecastData?.models?.map((m: any) => {
                const isBest = m.model === forecastData.best_model;
                return (
                  <tr 
                    key={m.model} 
                    className={`hover:bg-paper-subtle/30 dark:hover:bg-paper-dark-subtle/30 ${
                      isBest ? 'bg-accent/5 dark:bg-accent-dark-muted/10 font-medium' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-semibold text-ink dark:text-ink-dark flex items-center gap-1.5">
                      {isBest && <Award className="w-3.5 h-3.5 text-accent" />}
                      <span>{m.model}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right">{m.val_MAE.toFixed(3)}</td>
                    <td className="py-2.5 px-3 text-right">{m.val_RMSE.toFixed(3)}</td>
                    <td className="py-2.5 px-3 text-right">{m.val_WAPE_pct.toFixed(2)}%</td>
                    <td className="py-2.5 px-3 text-right">{m.val_R2.toFixed(3)}</td>
                    <td className={`py-2.5 px-3 text-right ${isBest ? 'text-accent font-bold' : ''}`}>
                      {m.test_MAE.toFixed(3)}
                    </td>
                    <td className="py-2.5 px-3 text-right">{m.test_RMSE.toFixed(3)}</td>
                    <td className={`py-2.5 px-3 text-right ${isBest ? 'text-accent font-bold' : ''}`}>
                      {m.test_WAPE_pct.toFixed(2)}%
                    </td>
                    <td className={`py-2.5 px-3 text-right ${isBest ? 'text-semantic-up font-bold' : ''}`}>
                      {m.test_R2.toFixed(3)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actual vs Predicted Weekly Curve */}
      <div className="border border-paper-border dark:border-paper-dark-border rounded bg-paper-card dark:bg-paper-dark-card p-6">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <h3 className="font-serif text-base font-bold text-ink dark:text-ink-dark">
              Actual vs. Predicted Total Weekly Volume (Test Horizon)
            </h3>
            <p className="font-serif italic text-xs text-ink-muted dark:text-ink-dark-muted">
              Aggregate unit tracking across 77 stores for the 24 unseen future test weeks.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-ink-muted dark:bg-ink-dark-muted inline-block" />
              Actual Units
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-accent inline-block" />
              Predicted (XGBoost Poisson)
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={forecastData?.actual_vs_predicted} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#DCD7CC" opacity={0.4} />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#8C867E' }} interval={2} />
              <YAxis tick={{ fontSize: 10, fill: '#8C867E' }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#FAF8F4',
                  borderColor: '#DCD7CC',
                  fontSize: '11px',
                  fontFamily: 'monospace'
                }}
              />
              <Line type="monotone" dataKey="actual" stroke="#5C5852" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="predicted" stroke="#B85D38" strokeWidth={2} strokeDasharray="3 3" dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Feature Importance Section */}
      <div className="border border-paper-border dark:border-paper-dark-border rounded bg-paper-card dark:bg-paper-dark-card p-6">
        <h3 className="font-serif text-base font-bold text-ink dark:text-ink-dark mb-1">
          Predictive Feature Attribution
        </h3>
        <p className="font-serif italic text-xs text-ink-muted dark:text-ink-dark-muted mb-4">
          Gain-based importance ranking from the gradient boosted trees showing key drivers of demand.
        </p>
        <div className="space-y-2.5 font-mono text-xs">
          {forecastData?.feature_importance?.map((f: any) => (
            <div key={f.feature} className="space-y-1">
              <div className="flex justify-between items-baseline text-[11px]">
                <span className="font-semibold text-ink dark:text-ink-dark">{f.feature} ({f.description})</span>
                <span className="text-accent font-bold">{(f.importance * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-paper-subtle dark:bg-paper-dark-subtle h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-accent h-full rounded-full"
                  style={{ width: `${Math.min(100, f.importance * 400)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
