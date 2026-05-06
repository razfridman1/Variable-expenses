"use client";

import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { api, ApiError } from "@/lib/api";
import { CATEGORY_COLORS, categoryLabel } from "@/lib/categories";
import { formatMoney, formatMonth } from "@/lib/format";
import { toast } from "@/components/Toaster";
import { cn } from "@/lib/cn";
import type { MonthlyAnalyticsDTO, YearlyAnalyticsDTO } from "@/types/dto";

type View = "monthly" | "yearly";

export default function AnalyticsPage() {
  const [view, setView] = useState<View>("monthly");
  const [monthly, setMonthly] = useState<MonthlyAnalyticsDTO | null>(null);
  const [yearly, setYearly] = useState<YearlyAnalyticsDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    (async () => {
      try {
        if (view === "monthly") {
          const res = await api.get<MonthlyAnalyticsDTO>("/api/analytics/monthly");
          if (alive) setMonthly(res);
        } else {
          const res = await api.get<YearlyAnalyticsDTO>("/api/analytics/yearly");
          if (alive) setYearly(res);
        }
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : "שגיאה בטעינה";
        toast.error(msg);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [view]);

  return (
    <AppShell>
      <h1 className="text-xl sm:text-2xl font-bold mb-1">תובנות</h1>
      <p className="text-sm text-muted mb-4">פילוח ההוצאות שלך לפי קטגוריה וזמן.</p>

      {/* View toggle */}
      <div className="card p-1.5 flex gap-1 mb-4">
        {([
          { k: "monthly", l: "החודש" },
          { k: "yearly",  l: "12 חודשים אחרונים" },
        ] as const).map((t) => {
          const active = t.k === view;
          return (
            <button
              key={t.k}
              type="button"
              onClick={() => setView(t.k)}
              className={cn(
                "flex-1 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary text-primary-fg"
                  : "text-muted hover:text-text hover:bg-surface-2",
              )}
            >
              {t.l}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="card p-6 h-[420px] animate-pulse" />
      ) : view === "monthly" ? (
        <MonthlyView data={monthly} />
      ) : (
        <YearlyView data={yearly} />
      )}
    </AppShell>
  );
}

function MonthlyView({ data }: { data: MonthlyAnalyticsDTO | null }) {
  if (!data) return null;
  if (data.total === 0) {
    return (
      <EmptyState
        title="אין נתונים לחודש הזה"
        description="הוסף הוצאות כדי לראות פילוח."
      />
    );
  }

  const pieData = data.byCategory.map((c) => ({
    name: categoryLabel(c.category, c.customCategory),
    value: c.total,
    color: CATEGORY_COLORS[c.category],
  }));

  const lineData = data.byDay.map((d) => ({
    day: d.date.slice(8, 10), // DD
    total: Math.round(d.total),
  }));

  return (
    <>
      <div className="card p-4 sm:p-5">
        <div className="flex items-baseline justify-between mb-3">
          <p className="text-sm text-muted">סה״כ החודש</p>
          <p className="text-xl font-bold tabular-nums">{formatMoney(data.total)}</p>
        </div>
      </div>

      <section className="card p-4 sm:p-5 mt-3">
        <h2 className="font-semibold mb-3">פילוח לפי קטגוריה</h2>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
              >
                {pieData.map((d, i) => (
                  <Cell key={i} fill={d.color} stroke="rgb(var(--surface))" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number) => formatMoney(v)}
                contentStyle={tooltipStyle}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {pieData.map((p) => (
            <li key={p.name} className="flex items-center gap-2 text-sm">
              <span
                className="h-3 w-3 rounded-sm flex-none"
                style={{ backgroundColor: p.color }}
              />
              <span className="flex-1 truncate">{p.name}</span>
              <span className="tabular-nums text-muted">
                {formatMoney(p.value)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card p-4 sm:p-5 mt-3">
        <h2 className="font-semibold mb-3">הוצאה יומית במהלך החודש</h2>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData} margin={{ top: 6, right: 6, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
              <XAxis dataKey="day" stroke="rgb(var(--muted))" fontSize={11} reversed />
              <YAxis stroke="rgb(var(--muted))" fontSize={11} width={40} />
              <Tooltip
                formatter={(v: number) => formatMoney(v)}
                contentStyle={tooltipStyle}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="rgb(var(--primary))"
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </>
  );
}

function YearlyView({ data }: { data: YearlyAnalyticsDTO | null }) {
  if (!data) return null;
  if (data.total === 0) {
    return (
      <EmptyState
        title="אין נתונים ל־12 החודשים האחרונים"
        description="הוסף הוצאות כדי לראות פילוח שנתי."
      />
    );
  }

  const barData = data.byMonth.map((m) => ({
    label: formatMonth(new Date(m.year, m.month - 1, 1)).replace(/ /g, " "),
    total: Math.round(m.total),
  }));

  const pieData = data.byCategory.map((c) => ({
    name: categoryLabel(c.category, c.customCategory),
    value: c.total,
    color: CATEGORY_COLORS[c.category],
  }));

  return (
    <>
      <div className="card p-4 sm:p-5">
        <div className="flex items-baseline justify-between mb-3">
          <p className="text-sm text-muted">סה״כ ב־12 חודשים אחרונים</p>
          <p className="text-xl font-bold tabular-nums">{formatMoney(data.total)}</p>
        </div>
      </div>

      <section className="card p-4 sm:p-5 mt-3">
        <h2 className="font-semibold mb-3">הוצאה לפי חודש</h2>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 6, right: 6, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
              <XAxis
                dataKey="label"
                stroke="rgb(var(--muted))"
                fontSize={10}
                interval={0}
                angle={-30}
                textAnchor="end"
                height={60}
                reversed
              />
              <YAxis stroke="rgb(var(--muted))" fontSize={11} width={50} />
              <Tooltip
                formatter={(v: number) => formatMoney(v)}
                contentStyle={tooltipStyle}
              />
              <Legend />
              <Bar
                dataKey="total"
                name="סה״כ"
                fill="rgb(var(--primary))"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="card p-4 sm:p-5 mt-3">
        <h2 className="font-semibold mb-3">פילוח שנתי לפי קטגוריה</h2>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
              >
                {pieData.map((d, i) => (
                  <Cell key={i} fill={d.color} stroke="rgb(var(--surface))" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number) => formatMoney(v)}
                contentStyle={tooltipStyle}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {pieData.map((p) => (
            <li key={p.name} className="flex items-center gap-2 text-sm">
              <span
                className="h-3 w-3 rounded-sm flex-none"
                style={{ backgroundColor: p.color }}
              />
              <span className="flex-1 truncate">{p.name}</span>
              <span className="tabular-nums text-muted">
                {formatMoney(p.value)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

const tooltipStyle: React.CSSProperties = {
  background: "rgb(var(--surface))",
  border: "1px solid rgb(var(--border))",
  borderRadius: 12,
  fontSize: 12,
  color: "rgb(var(--text))",
};
