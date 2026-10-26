import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, ArrowRight, Info, TrendingUp, TrendingDown, ShieldAlert } from 'lucide-react';
import { api } from '../api/client';

export const ElasticityPage: React.FC = () => {
  const [estimates, setEstimates] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('FROZEN PIZZA');
  const [priceChange, setPriceChange] = useState<number>(-10);
  const [simulation, setSimulation] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getElasticityEstimates()
      .then(res => {
        setEstimates(res);
        if (res.length > 0) setSelectedCategory(res[0].category);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const runSimulation = (category: string, change: number) => {
    api.simulatePriceChange({ category, price_change_pct: change })
      .then(res => setSimulation(res))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    if (selectedCategory) {
      runSimulation(selectedCategory, priceChange);
    }
  }, [selectedCategory, priceChange]);

  if (loading) {
    return (
      <div className="p-8 font-mono text-xs text-ink-muted animate-pulse">
        Retrieving econometric OLS log-log elasticity estimates...
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Title */}
      <div className="border-b border-paper-border dark:border-paper-dark-border pb-4">
        <h1 className="font-serif text-2xl font-bold text-ink dark:text-ink-dark">
          Price Elasticity of Demand & Scenario What-If
        </h1>
        <p className="font-serif italic text-xs text-ink-muted dark:text-ink-dark-muted mt-1">
          Fixed-effects log-log OLS regressions estimating consumer demand sensitivity across retail commodities.
        </p>
      </div>

      {/* Mandatory Statistical Association Banner */}
      <div className="p-4 border border-teal/30 rounded bg-teal/5 dark:bg-teal-muted/10 text-xs font-mono text-ink dark:text-ink-dark flex items-start gap-3">
        <Info className="w-4 h-4 text-teal shrink-0 mt-0.5" />
        <div>
          <strong className="text-teal font-semibold uppercase tracking-wider block mb-0.5">
            Econometric Guidance (Non-Causal Association):
          </strong>
          <span className="text-ink-muted dark:text-ink-dark-muted leading-relaxed">
            All price elasticities and scenario projections reflect historical statistical associations controlled for product, store, and week fixed effects. They do not constitute guaranteed future causal proof and assume competitor pricing, inflation, and retail macro factors remain unchanged (ceteris paribus).
          </span>
        </div>
      </div>

      {/* Interactive Scenario What-If Simulator */}
      <div className="border border-paper-border dark:border-paper-dark-border rounded bg-paper-card dark:bg-paper-dark-card p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <SlidersHorizontal className="w-4 h-4 text-accent" />
          <h3 className="font-serif text-base font-bold text-ink dark:text-ink-dark">
            Policy Scenario Simulator
          </h3>
        </div>
        <p className="font-serif italic text-xs text-ink-muted dark:text-ink-dark-muted mb-6">
          Test hypothetical shelf price adjustments to forecast expected unit volume response and revenue trade-offs.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Controls */}
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-mono uppercase text-ink-muted mb-1.5 font-semibold">
                Target Commodity Category
              </label>
              <div className="grid grid-cols-2 gap-2">
                {estimates.map((e) => (
                  <button
                    key={e.category}
                    type="button"
                    onClick={() => setSelectedCategory(e.category)}
                    className={`py-2 px-3 text-xs font-mono rounded border text-left transition-colors ${
                      selectedCategory === e.category
                        ? 'border-accent bg-accent/10 text-accent font-bold'
                        : 'border-paper-border dark:border-paper-dark-border text-ink-muted hover:bg-paper-subtle dark:hover:bg-paper-dark-subtle'
                    }`}
                  >
                    <div>{e.category}</div>
                    <div className="text-[10px] opacity-75 font-normal">e = {e.elasticity.toFixed(2)}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-baseline mb-2 text-xs font-mono">
                <label className="uppercase text-ink-muted font-semibold">
                  Hypothetical Shelf Price Adjustment
                </label>
                <span className={`font-bold px-2 py-0.5 rounded text-xs ${
                  priceChange < 0 ? 'bg-semantic-down-bg text-semantic-down' : 'bg-semantic-up-bg text-semantic-up'
                }`}>
                  {priceChange > 0 ? `+${priceChange}%` : `${priceChange}%`}
                </span>
              </div>
              <input
                type="range"
                min="-30"
                max="30"
                step="1"
                value={priceChange}
                onChange={(e) => setPriceChange(Number(e.target.value))}
                className="w-full accent-accent cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-ink-faint mt-1">
                <span>-30% (Deep Discount)</span>
                <span>0% (Status Quo)</span>
                <span>+30% (Premium Uplift)</span>
              </div>
            </div>
          </div>

          {/* Projected Outcomes Box */}
          {simulation && (
            <div className="border border-paper-border dark:border-paper-dark-border rounded bg-paper/60 dark:bg-paper-dark/60 p-5 space-y-4">
              <span className="font-mono text-[10px] uppercase tracking-widest text-ink-faint block">
                Statistical Projection ({simulation.category})
              </span>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border border-paper-border dark:border-paper-dark-border rounded bg-paper-card dark:bg-paper-dark-card">
                  <span className="text-[10px] font-mono uppercase text-ink-muted block">Expected Volume Response</span>
                  <div className={`font-mono text-xl font-bold mt-1 ${
                    simulation.expected_units_change_pct >= 0 ? 'text-semantic-up' : 'text-semantic-down'
                  }`}>
                    {simulation.expected_units_change_pct >= 0 ? `+${simulation.expected_units_change_pct}%` : `${simulation.expected_units_change_pct}%`}
                  </div>
                  <span className="text-[10px] font-mono text-ink-faint block mt-0.5">
                    95% CI: [{simulation.confidence_interval_95.lower_pct}%, {simulation.confidence_interval_95.upper_pct}%]
                  </span>
                </div>

                <div className="p-3 border border-paper-border dark:border-paper-dark-border rounded bg-paper-card dark:bg-paper-dark-card">
                  <span className="text-[10px] font-mono uppercase text-ink-muted block">Projected Revenue Impact</span>
                  <div className={`font-mono text-xl font-bold mt-1 ${
                    simulation.expected_revenue_change_pct >= 0 ? 'text-semantic-up' : 'text-semantic-down'
                  }`}>
                    {simulation.expected_revenue_change_pct >= 0 ? `+${simulation.expected_revenue_change_pct}%` : `${simulation.expected_revenue_change_pct}%`}
                  </div>
                  <span className="text-[10px] font-mono text-ink-faint block mt-0.5">
                    Price × Volume net delta
                  </span>
                </div>
              </div>

              <div className="p-3 rounded bg-paper-subtle dark:bg-paper-dark-subtle border border-paper-border dark:border-paper-dark-border text-xs font-mono text-ink-muted space-y-1">
                <p>
                  <strong>Policy Interpretation:</strong> For {simulation.category}, a {priceChange}% price change associates with a{' '}
                  <span className="text-accent font-semibold">{simulation.expected_units_change_pct >= 0 ? `+${simulation.expected_units_change_pct}%` : `${simulation.expected_units_change_pct}%`}</span> shift in sales velocity.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Econometric Regression Table */}
      <div className="border border-paper-border dark:border-paper-dark-border rounded bg-paper-card dark:bg-paper-dark-card p-6">
        <h3 className="font-serif text-base font-bold text-ink dark:text-ink-dark mb-1">
          Category Price Elasticity Estimates
        </h3>
        <p className="font-serif italic text-xs text-ink-muted dark:text-ink-dark-muted mb-4">
          OLS log-log regression specification: `log(units+1) ~ log(price) + promo_controls + FE(upc) + FE(store) + FE(week)`.
        </p>
        <div className="border border-paper-border dark:border-paper-dark-border rounded overflow-hidden">
          <table className="text-xs font-mono">
            <thead className="bg-paper-subtle dark:bg-paper-dark-subtle border-b border-paper-border dark:border-paper-dark-border">
              <tr>
                <th className="py-2.5 px-3 text-left">Category</th>
                <th className="py-2.5 px-3 text-right">Elasticity (e)</th>
                <th className="py-2.5 px-3 text-right">Std. Error</th>
                <th className="py-2.5 px-3 text-center">95% Conf. Interval</th>
                <th className="py-2.5 px-3 text-right">Sample (n)</th>
                <th className="py-2.5 px-3 text-left">Behavioral Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-border dark:divide-paper-dark-border">
              {estimates.map((e) => (
                <tr key={e.category} className="hover:bg-paper-subtle/30 dark:hover:bg-paper-dark-subtle/30">
                  <td className="py-3 px-3 font-semibold text-ink dark:text-ink-dark">{e.category}</td>
                  <td className="py-3 px-3 text-right text-accent font-bold text-sm">{e.elasticity.toFixed(3)}</td>
                  <td className="py-3 px-3 text-right text-ink-muted">±{e.std_err.toFixed(3)}</td>
                  <td className="py-3 px-3 text-center text-ink-muted">[{e.ci_lower.toFixed(3)}, {e.ci_upper.toFixed(3)}]</td>
                  <td className="py-3 px-3 text-right text-ink-muted">{e.n.toLocaleString()}</td>
                  <td className="py-3 px-3 text-ink dark:text-ink-dark text-[11px]">{e.interpretation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
