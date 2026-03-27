"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { DashboardSummary } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, PageHeader, EmptyState, Spinner } from "@/components/ui";
import {
  TrendingDown,
  TrendingUp,
  Receipt,
  Tag,
  ArrowUpRight,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { getDashboard } from "@/lib/api";
import { errorAlert } from "@/lib/alert";

function StatCard({
  label,
  value,
  icon,
  sub,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  sub?: string;
  accent?: string;
}) {
  return (
    <Card>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <p
            style={{
              margin: "0 0 4px",
              fontSize: "12px",
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              fontWeight: 600,
            }}
          >
            {label}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "22px",
              fontWeight: 700,
              letterSpacing: "-0.5px",
              color: accent || "var(--color-text)",
            }}
          >
            {value}
          </p>
          {sub && (
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "12px",
                color: "var(--color-text-muted)",
              }}
            >
              {sub}
            </p>
          )}
        </div>
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "10px",
            background: "var(--color-surface-2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}

export function DashboardClient({
  summary: initialSummary,
}: {
  summary: DashboardSummary | null;
}) {
  const [summary, setSummary] = useState<DashboardSummary | null>(
    initialSummary,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then((res) => setSummary(res.data))
      .catch(() => {
        setSummary(null);
        errorAlert("Failed to load dashboard");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div style={{ padding: "32px" }}>
        <Spinner />
      </div>
    );

  if (!summary) {
    return (
      <div style={{ padding: "32px" }}>
        <PageHeader title="Dashboard" subtitle="Your financial overview" />
        <EmptyState
          icon={<TrendingDown size={40} />}
          title="No data yet"
          subtitle="Add expenses and income to see your dashboard"
        />
      </div>
    );
  }

  const monthlyTrend = summary.monthly_trend ?? [];
  const byCategory = summary.by_category ?? [];
  const recentExpenses = summary.recent_expenses ?? [];
  const trendData = monthlyTrend.map((t) => ({
    name: `${t.month} ${t.year}`,
    expenses: t.total,
    income: t.income,
  }));
  const pieColors = byCategory.map((c) => c.category?.color || "#6366f1");
  const balanceColor =
    (summary.monthly_balance ?? 0) >= 0
      ? "var(--color-success)"
      : "var(--color-danger)";

  return (
    <div style={{ padding: "32px" }}>
      <PageHeader
        title="Dashboard"
        subtitle="Your financial overview at a glance"
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "14px",
          marginBottom: "14px",
        }}
      >
        <StatCard
          label="Total Income"
          value={formatCurrency(summary.total_income ?? 0)}
          icon={<TrendingUp size={18} color="var(--color-success)" />}
          sub="All time"
          accent="var(--color-success)"
        />
        <StatCard
          label="Total Expenses"
          value={formatCurrency(summary.total_expenses ?? 0)}
          icon={<TrendingDown size={18} color="var(--color-danger)" />}
          sub="All time"
          accent="var(--color-danger)"
        />
        <StatCard
          label="Net Balance"
          value={formatCurrency(summary.balance ?? 0)}
          icon={
            <Wallet
              size={18}
              color={
                (summary.balance ?? 0) >= 0
                  ? "var(--color-success)"
                  : "var(--color-danger)"
              }
            />
          }
          sub="All time"
          accent={
            (summary.balance ?? 0) >= 0
              ? "var(--color-success)"
              : "var(--color-danger)"
          }
        />
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "14px",
          marginBottom: "24px",
        }}
      >
        <StatCard
          label="This Month Income"
          value={formatCurrency(summary.monthly_income ?? 0)}
          icon={<TrendingUp size={18} color="var(--color-success)" />}
          sub="Current month"
          accent="var(--color-success)"
        />
        <StatCard
          label="This Month Expenses"
          value={formatCurrency(summary.monthly_expenses ?? 0)}
          icon={<Receipt size={18} color="var(--color-warning)" />}
          sub="Current month"
          accent="var(--color-warning)"
        />
        <StatCard
          label="Monthly Balance"
          value={formatCurrency(summary.monthly_balance ?? 0)}
          icon={<Wallet size={18} color={balanceColor} />}
          sub="Current month"
          accent={balanceColor}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 340px",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <Card>
          <p style={{ margin: "0 0 20px", fontWeight: 600, fontSize: "14px" }}>
            Income vs Expenses (6 months)
          </p>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3a0" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#22d3a0" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff5c7c" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#ff5c7c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#8888aa", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#8888aa", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    background: "#111118",
                    border: "1px solid #ffffff10",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(v) => [formatCurrency(v as number)]}
                />
                <Legend
                  wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
                  formatter={(val) =>
                    val === "income" ? "Income" : "Expenses"
                  }
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#22d3a0"
                  strokeWidth={2}
                  fill="url(#gradIncome)"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="#ff5c7c"
                  strokeWidth={2}
                  fill="url(#gradExpenses)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              icon={<TrendingUp size={24} />}
              title="No trend data yet"
              subtitle="Add income and expenses to see trends"
            />
          )}
        </Card>
        <Card>
          <p style={{ margin: "0 0 16px", fontWeight: 600, fontSize: "14px" }}>
            Expenses by Category
          </p>
          {byCategory.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={byCategory}
                    dataKey="total"
                    nameKey="category.name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={3}
                  >
                    {byCategory.map((_, i) => (
                      <Cell key={i} fill={pieColors[i]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#111118",
                      border: "1px solid #ffffff10",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(v) => [formatCurrency(v as number)]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "6px" }}
              >
                {byCategory.slice(0, 4).map((c, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <div
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: pieColors[i],
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontSize: "12px",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        {c.category?.name}
                      </span>
                    </div>
                    <span style={{ fontSize: "12px", fontWeight: 500 }}>
                      {c.percent.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyState icon={<Tag size={24} />} title="No category data yet" />
          )}
        </Card>
      </div>

      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <p style={{ margin: 0, fontWeight: 600, fontSize: "14px" }}>
            Recent Expenses
          </p>
          <Link
            href="/expenses"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "13px",
              color: "var(--color-accent)",
              textDecoration: "none",
            }}
          >
            View all <ArrowUpRight size={13} />
          </Link>
        </div>
        {recentExpenses.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {recentExpenses.map((exp, i) => (
              <div
                key={exp.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 0",
                  borderBottom:
                    i < recentExpenses.length - 1
                      ? "1px solid var(--color-border)"
                      : "none",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "9px",
                      background: exp.category?.color
                        ? `${exp.category.color}22`
                        : "var(--color-surface-2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {exp.category?.icon ? (
                      <CategoryIcon icon={exp.category.icon} size={18} />
                    ) : (
                      "💳"
                    )}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: "14px", fontWeight: 500 }}>
                      {exp.title}
                    </p>
                    <p
                      style={{
                        margin: "2px 0 0",
                        fontSize: "12px",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {exp.category?.name ?? "Uncategorized"} ·{" "}
                      {formatDate(exp.date)}
                    </p>
                  </div>
                </div>
                <span
                  style={{
                    fontWeight: 600,
                    color: "var(--color-danger)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "14px",
                  }}
                >
                  -{formatCurrency(exp.amount)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Receipt size={24} />}
            title="No expenses yet"
            subtitle="Start tracking your spending"
          />
        )}
      </Card>
    </div>
  );
}
