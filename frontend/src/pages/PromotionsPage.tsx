import React, { useState, useEffect } from 'react';
import { Tags, Store, MapPin, AlertCircle, TrendingUp, Info } from 'lucide-react';
import { api } from '../api/client';

export const PromotionsPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPromotionsImpact()
      .then(res => setData(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="p-8 font-mono text-xs text-ink-muted animate-pulse">
        Calculating promotional multipliers and conditional lift ratios...
      </div>
    );
  }

  const { by_category, by_store_tier, by_state, disclaimer } = data;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header section */}
      <div className="border-b border-paper-border dark:border-paper-dark-border pb-4">
        <h1 className="font-serif text-2xl font-bold text-ink dark:text-ink-dark">
          Promotional Lift & Mechanism Effectiveness
        </h1>
        <p className="font-serif italic text-xs text-ink-muted dark:text-ink-dark-muted mt-1">
          Evaluating the demand multipliers of circular flyer features, end-cap displays, and temporary price reductions.
        </p>
      </div>

      {/* Mandatory Causal Association Disclaimer Banner */}
      <div className="p-4 border border-teal/30 rounded bg-teal/5 dark:bg-teal-muted/10 text-xs font-mono text-ink dark:text-ink-dark flex items-start gap-3">
        <Info className="w-4 h-4 text-teal shrink-0 mt-0.5" />
        <div>
          <strong className="text-teal font-semibold uppercase tracking-wider block mb-0.5">
            Statistical Association Notice:
          </strong>
          <span className="text-ink-muted dark:text-ink-dark-muted leading-relaxed">
            {disclaimer}
          </span>
        </div>
      </div>

      {/* Category Promotional Lift Table */}
      <div className="border border-paper-border dark:border-paper-dark-border rounded bg-paper-card dark:bg-paper-dark-card p-6">
        <h3 className="font-serif text-base font-bold text-ink dark:text-ink-dark mb-1">
          Promotional Multiplier by Commodity Category
        </h3>
        <p className="font-serif italic text-xs text-ink-muted dark:text-ink-dark-muted mb-4">
          Comparing baseline volume against circular flyers (`feature`), in-store endcaps (`display`), and price cuts alone (`tpr_only`).
        </p>
        <div className="border border-paper-border dark:border-paper-dark-border rounded overflow-hidden">
          <table className="text-xs">
            <thead className="bg-paper-subtle dark:bg-paper-dark-subtle border-b border-paper-border dark:border-paper-dark-border">
              <tr>
                <th className="py-2.5 px-3 text-left">Category</th>
                <th className="py-2.5 px-3 text-right">Base Weekly Units</th>
                <th className="py-2.5 px-3 text-right">Flyer Feature Lift</th>
                <th className="py-2.5 px-3 text-right">Display Lift</th>
                <th className="py-2.5 px-3 text-right">TPR Alone Lift</th>
                <th className="py-2.5 px-3 text-left">Optimal Mechanism</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-border dark:divide-paper-dark-border font-mono">
              {by_category.map((c: any) => (
                <tr key={c.category} className="hover:bg-paper-subtle/30 dark:hover:bg-paper-dark-subtle/30">
                  <td className="py-3 px-3 font-semibold text-ink dark:text-ink-dark">{c.category}</td>
                  <td className="py-3 px-3 text-right text-ink-muted">{c.base_units.toFixed(1)}</td>
                  <td className="py-3 px-3 text-right text-accent font-bold">+{c.feature_lift.toFixed(2)}x</td>
                  <td className="py-3 px-3 text-right text-teal font-bold">+{c.display_lift.toFixed(2)}x</td>
                  <td className="py-3 px-3 text-right text-ink-muted">{c.tpr_lift.toFixed(2)}x</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded bg-accent/10 text-accent font-semibold text-[11px]">
                      {c.best_promo}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: Store Tier & State Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* By Store Tier */}
        <div className="border border-paper-border dark:border-paper-dark-border rounded bg-paper-card dark:bg-paper-dark-card p-5">
          <div className="flex items-center gap-2 mb-1">
            <Store className="w-4 h-4 text-accent" />
            <h3 className="font-serif text-sm font-bold text-ink dark:text-ink-dark">
              Lift Responsiveness by Store Tier
            </h3>
          </div>
          <p className="font-serif italic text-xs text-ink-muted dark:text-ink-dark-muted mb-4">
            Demographic variance in promo elasticity.
          </p>
          <div className="border border-paper-border dark:border-paper-dark-border rounded overflow-hidden">
            <table className="text-xs font-mono">
              <thead className="bg-paper-subtle dark:bg-paper-dark-subtle border-b border-paper-border dark:border-paper-dark-border">
                <tr>
                  <th className="py-2 px-3 text-left">Tier</th>
                  <th className="py-2 px-3 text-right">Feature Lift</th>
                  <th className="py-2 px-3 text-right">Display Lift</th>
                  <th className="py-2 px-3 text-right">Combined Lift</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-border dark:divide-paper-dark-border">
                {by_store_tier.map((t: any) => (
                  <tr key={t.tier} className="hover:bg-paper-subtle/30 dark:hover:bg-paper-dark-subtle/30">
                    <td className="py-2.5 px-3 font-semibold text-ink dark:text-ink-dark">{t.tier}</td>
                    <td className="py-2.5 px-3 text-right font-medium text-accent">+{t.feature_lift.toFixed(2)}x</td>
                    <td className="py-2.5 px-3 text-right font-medium text-teal">+{t.display_lift.toFixed(2)}x</td>
                    <td className="py-2.5 px-3 text-right font-bold text-semantic-up">+{t.both_lift.toFixed(2)}x</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* By State */}
        <div className="border border-paper-border dark:border-paper-dark-border rounded bg-paper-card dark:bg-paper-dark-card p-5">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-teal" />
            <h3 className="font-serif text-sm font-bold text-ink dark:text-ink-dark">
              Promotional Velocity Across Regions
            </h3>
          </div>
          <p className="font-serif italic text-xs text-ink-muted dark:text-ink-dark-muted mb-4">
            Display lift across operating state territories.
          </p>
          <div className="border border-paper-border dark:border-paper-dark-border rounded overflow-hidden">
            <table className="text-xs font-mono">
              <thead className="bg-paper-subtle dark:bg-paper-dark-subtle border-b border-paper-border dark:border-paper-dark-border">
                <tr>
                  <th className="py-2 px-3 text-left">State</th>
                  <th className="py-2 px-3 text-right">Cereal Lift</th>
                  <th className="py-2 px-3 text-right">Pizza Lift</th>
                  <th className="py-2 px-3 text-right">Snacks Lift</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-border dark:divide-paper-dark-border">
                {by_state.map((s: any) => (
                  <tr key={s.state} className="hover:bg-paper-subtle/30 dark:hover:bg-paper-dark-subtle/30">
                    <td className="py-2.5 px-3 font-semibold text-ink dark:text-ink-dark">{s.state} Territory</td>
                    <td className="py-2.5 px-3 text-right text-accent font-medium">+{s.cold_cereal_lift.toFixed(2)}x</td>
                    <td className="py-2.5 px-3 text-right text-teal font-medium">+{s.frozen_pizza_lift.toFixed(2)}x</td>
                    <td className="py-2.5 px-3 text-right font-medium">+{s.bag_snacks_lift.toFixed(2)}x</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
