import React, { useEffect, useState } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { TrendingUp, ShoppingBag, Store, Tag, Percent, ArrowUpRight } from 'lucide-react';
import { api } from '../api/client';

export const OverviewPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getOverview()
      .then(res => setData(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="p-8 font-mono text-xs text-ink-muted animate-pulse">
        Retrieving econometric baseline metrics and transaction indices...
      </div>
    );
  }

  const { kpis, category_split, store_tiers, top_products, weekly_trend } = data;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header section */}
      <div className="border-b border-paper-border dark:border-paper-dark-border pb-4 flex flex-col md:flex-row md:items-baseline justify-between gap-2">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink dark:text-ink-dark">
            Executive Overview & Portfolio Health
          </h1>
          <p className="font-serif italic text-xs text-ink-muted dark:text-ink-dark-muted mt-1">
            Aggregated retail performance across 156 weeks of dunnhumby store transactions.
          </p>
        </div>
        <span className="font-mono text-xs text-ink-faint">
          Audit Period: Jan 2009 — Dec 2011
        </span>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 border border-paper-border dark:border-paper-dark-border rounded bg-paper-card dark:bg-paper-dark-card">
          <div className="flex items-center justify-between text-ink-faint mb-1">
            <span className="font-mono text-[11px] uppercase tracking-wider">Gross Volume</span>
            <ShoppingBag className="w-3.5 h-3.5 text-accent" />
          </div>
          <div className="font-mono text-xl font-bold text-ink dark:text-ink-dark">
            {(kpis.total_units / 1_000_000).toFixed(2)}M
          </div>
          <div className="text-[11px] font-mono text-ink-muted mt-1">
            13,749,210 Total Units Sold
          </div>
        </div>

        <div className="p-4 border border-paper-border dark:border-paper-dark-border rounded bg-paper-card dark:bg-paper-dark-card">
          <div className="flex items-center justify-between text-ink-faint mb-1">
            <span className="font-mono text-[11px] uppercase tracking-wider">Gross Sales Spend</span>
            <TrendingUp className="w-3.5 h-3.5 text-teal" />
          </div>
          <div className="font-mono text-xl font-bold text-ink dark:text-ink-dark">
            ${(kpis.total_spend / 1_000_000).toFixed(2)}M
          </div>
          <div className="text-[11px] font-mono text-ink-muted mt-1">
            Avg Price: ${kpis.avg_unit_price.toFixed(2)} / unit
          </div>
        </div>

        <div className="p-4 border border-paper-border dark:border-paper-dark-border rounded bg-paper-card dark:bg-paper-dark-card">
          <div className="flex items-center justify-between text-ink-faint mb-1">
            <span className="font-mono text-[11px] uppercase tracking-wider">Store Footprint</span>
            <Store className="w-3.5 h-3.5 text-ink-muted" />
          </div>
          <div className="font-mono text-xl font-bold text-ink dark:text-ink-dark">
            {kpis.active_stores} Stores
          </div>
          <div className="text-[11px] font-mono text-ink-muted mt-1">
            Across 3 Store Tiers (OH, KY, IN, TX)
          </div>
        </div>

        <div className="p-4 border border-paper-border dark:border-paper-dark-border rounded bg-paper-card dark:bg-paper-dark-card">
          <div className="flex items-center justify-between text-ink-faint mb-1">
            <span className="font-mono text-[11px] uppercase tracking-wider">Promo Penetration</span>
            <Percent className="w-3.5 h-3.5 text-semantic-up" />
          </div>
          <div className="font-mono text-xl font-bold text-ink dark:text-ink-dark">
            {kpis.promo_penetration_pct}%
          </div>
          <div className="text-[11px] font-mono text-ink-muted mt-1">
            Avg Discount: {kpis.avg_discount_pct}% off base
          </div>
        </div>
      </div>

      {/* Main Trend Chart */}
      <div className="border border-paper-border dark:border-paper-dark-border rounded bg-paper-card dark:bg-paper-dark-card p-6">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <h3 className="font-serif text-base font-bold text-ink dark:text-ink-dark">
              Weekly Volume & Revenue Progression
            </h3>
            <p className="font-serif italic text-xs text-ink-muted dark:text-ink-dark-muted">
              52-week chronological timeline showing units sold (bars) and gross revenue (trend line).
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-paper-subtle dark:bg-paper-dark-subtle border border-paper-border inline-block" />
              Units Sold
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-accent inline-block" />
              Gross Spend ($)
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={weekly_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#DCD7CC" opacity={0.4} />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#8C867E' }} interval={3} />
              <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#8C867E' }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#8C867E' }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#FAF8F4',
                  borderColor: '#DCD7CC',
                  fontSize: '11px',
                  fontFamily: 'monospace'
                }}
              />
              <Bar yAxisId="left" dataKey="units" fill="#D8D3C8" radius={[2, 2, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="spend" stroke="#B85D38" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Split & Store Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="border border-paper-border dark:border-paper-dark-border rounded bg-paper-card dark:bg-paper-dark-card p-5">
          <h3 className="font-serif text-sm font-bold text-ink dark:text-ink-dark mb-1">
            Category Contribution
          </h3>
          <p className="font-serif italic text-xs text-ink-muted dark:text-ink-dark-muted mb-4">
            Volume and revenue distribution across the 4 tracked commodity categories.
          </p>
          <div className="space-y-3 font-mono text-xs">
            {category_split.map((c: any) => (
              <div key={c.category} className="p-3 border border-paper-border dark:border-paper-dark-border rounded bg-paper/50 dark:bg-paper-dark/50">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-semibold text-ink dark:text-ink-dark">{c.category}</span>
                  <span className="text-accent font-bold">{c.share_pct}% vol</span>
                </div>
                <div className="flex justify-between text-[11px] text-ink-muted">
                  <span>{(c.units / 1_000_000).toFixed(2)}M units</span>
                  <span>${(c.spend / 1_000_000).toFixed(2)}M revenue</span>
                </div>
                <div className="w-full bg-paper-subtle dark:bg-paper-dark-subtle h-1.5 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="h-full rounded-full" 
                    style={{ width: `${c.share_pct}%`, backgroundColor: c.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Store Tier Comparison */}
        <div className="border border-paper-border dark:border-paper-dark-border rounded bg-paper-card dark:bg-paper-dark-card p-5">
          <h3 className="font-serif text-sm font-bold text-ink dark:text-ink-dark mb-1">
            Store Tier Segment Archetypes
          </h3>
          <p className="font-serif italic text-xs text-ink-muted dark:text-ink-dark-muted mb-4">
            Consumer demographics and basket elasticity across Value, Mainstream, and Upscale tiers.
          </p>
          <div className="border border-paper-border dark:border-paper-dark-border rounded overflow-hidden">
            <table className="text-xs">
              <thead className="bg-paper-subtle dark:bg-paper-dark-subtle border-b border-paper-border dark:border-paper-dark-border">
                <tr>
                  <th className="py-2.5 px-3 text-left">Segment</th>
                  <th className="py-2.5 px-3 text-right">Stores</th>
                  <th className="py-2.5 px-3 text-right">Avg Basket</th>
                  <th className="py-2.5 px-3 text-right">Promo Lift</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-border dark:divide-paper-dark-border font-mono">
                {store_tiers.map((t: any) => (
                  <tr key={t.tier} className="hover:bg-paper-subtle/30 dark:hover:bg-paper-dark-subtle/30">
                    <td className="py-2.5 px-3 font-semibold text-ink dark:text-ink-dark">{t.tier}</td>
                    <td className="py-2.5 px-3 text-right">{t.stores}</td>
                    <td className="py-2.5 px-3 text-right">{t.avg_basket.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right text-accent font-bold">{t.promo_lift}x</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-3 bg-paper-subtle/60 dark:bg-paper-dark-subtle/60 border border-paper-border dark:border-paper-dark-border rounded text-[11px] font-mono text-ink-muted">
            <strong>Analyst Takeaway:</strong> Value-tier shoppers demonstrate the highest promotional responsiveness (+2.89x volume multiplier), while Upscale locations maintain stable basket velocity with lower promo dependency.
          </div>
        </div>
      </div>

      {/* Top SKUs Table */}
      <div className="border border-paper-border dark:border-paper-dark-border rounded bg-paper-card dark:bg-paper-dark-card p-5">
        <h3 className="font-serif text-sm font-bold text-ink dark:text-ink-dark mb-1">
          Top Performing SKUs by Sales Velocity
        </h3>
        <p className="font-serif italic text-xs text-ink-muted dark:text-ink-dark-muted mb-4">
          Ranked by aggregate unit movement and promotional display multiplier.
        </p>
        <div className="border border-paper-border dark:border-paper-dark-border rounded overflow-hidden">
          <table className="text-xs">
            <thead className="bg-paper-subtle dark:bg-paper-dark-subtle border-b border-paper-border dark:border-paper-dark-border">
              <tr>
                <th className="py-2.5 px-3 text-left">UPC</th>
                <th className="py-2.5 px-3 text-left">Description</th>
                <th className="py-2.5 px-3 text-left">Category</th>
                <th className="py-2.5 px-3 text-right">Units Sold</th>
                <th className="py-2.5 px-3 text-right">Gross Spend</th>
                <th className="py-2.5 px-3 text-right">Avg Price</th>
                <th className="py-2.5 px-3 text-right">Display Lift</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-border dark:divide-paper-dark-border font-mono">
              {top_products.map((p: any) => (
                <tr key={p.upc} className="hover:bg-paper-subtle/30 dark:hover:bg-paper-dark-subtle/30">
                  <td className="py-2.5 px-3 text-ink-faint">{p.upc}</td>
                  <td className="py-2.5 px-3 font-semibold text-ink dark:text-ink-dark">{p.name}</td>
                  <td className="py-2.5 px-3 text-ink-muted text-[11px]">{p.category}</td>
                  <td className="py-2.5 px-3 text-right font-medium">{p.units.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right">${p.spend.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right">${p.avg_price.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-right text-accent font-bold">+{p.display_lift}x</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
