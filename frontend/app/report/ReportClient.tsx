"use client";

import { useEffect, useState } from "react";
import { getExpenses, getIncomes } from "@/lib/api";
import { Expense, Income } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Spinner, PageHeader, Card } from "@/components/ui";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import {
  ChevronRight,
  ChevronLeft,
  X,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { errorAlert } from "@/lib/alert";
import { useSubscription } from "@/components/ui/SubscriptionProvider";
import { Crown } from "lucide-react";
import { useRouter } from "next/navigation";

// ─── helpers ─────────────────────────────────────────────────

function toLocalDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addMonths(date: Date, n: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

function formatPeriod(start: Date, end: Date) {
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  return `${fmt(start)} – ${fmt(end)}`;
}

// Build a list of monthly periods going backwards from today
// Each period: [startDate, endDate] where start is the same day-of-month as the anchor
function buildPeriods(anchor: Date, count = 12) {
  // anchor is always the 27th
  // each period: 27th of month N → 26th of month N+1
  const periods: { start: Date; end: Date }[] = [];
  for (let i = 0; i < count; i++) {
    const start = new Date(anchor.getFullYear(), anchor.getMonth() - i, 27);
    const end = new Date(anchor.getFullYear(), anchor.getMonth() - i + 1, 26);
    periods.push({ start, end });
  }
  return periods;
}

interface PeriodSummary {
  start: Date;
  end: Date;
  expenses: number;
  income: number;
  balance: number;
  expenseItems: Expense[];
  incomeItems: Income[];
}

// ─── Drill-down detail view ───────────────────────────────────

function PeriodDetail({
  period,
  onClose,
}: {
  period: PeriodSummary;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"expenses" | "income">("expenses");

  // Group expenses by category
  const byCategory: Record<
    string,
    {
      name: string;
      icon: string;
      color: string;
      total: number;
      items: Expense[];
    }
  > = {};
  for (const e of period.expenseItems) {
    const key = e.category?.id ?? "uncategorized";
    if (!byCategory[key]) {
      byCategory[key] = {
        name: e.category?.name ?? "Uncategorized",
        icon: e.category?.icon ?? "📦",
        color: e.category?.color ?? "#94a3b8",
        total: 0,
        items: [],
      };
    }
    byCategory[key].total += e.amount;
    byCategory[key].items.push(e);
  }
  const categoryList = Object.values(byCategory).sort(
    (a, b) => b.total - a.total,
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "var(--color-bg)",
        overflowY: "auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "var(--color-surface)",
          borderBottom: "1px solid var(--color-border)",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--color-text-muted)",
            padding: "4px",
            display: "flex",
          }}
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: "15px" }}>
            Period Report
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "12px",
              color: "var(--color-text-muted)",
            }}
          >
            {formatPeriod(period.start, period.end)}
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            marginLeft: "auto",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--color-text-muted)",
            padding: "4px",
            display: "flex",
          }}
        >
          <X size={18} />
        </button>
      </div>

      <div style={{ padding: "20px" }}>
        {/* Summary strip */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "1px",
            background: "var(--color-border)",
            borderRadius: "12px",
            overflow: "hidden",
            marginBottom: "20px",
          }}
        >
          {[
            {
              label: "Expenses",
              value: period.expenses,
              color: "var(--color-danger)",
              icon: <TrendingDown size={14} />,
            },
            {
              label: "Income",
              value: period.income,
              color: "var(--color-success)",
              icon: <TrendingUp size={14} />,
            },
            {
              label: "Balance",
              value: period.balance,
              color:
                period.balance >= 0
                  ? "var(--color-success)"
                  : "var(--color-danger)",
              icon: <Wallet size={14} />,
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: "var(--color-surface)",
                padding: "14px 10px",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  margin: "0 0 4px",
                  fontSize: "10px",
                  fontWeight: 600,
                  color: "var(--color-text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {item.label}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: "12px",
                  fontWeight: 700,
                  color: item.color,
                  fontFamily: "var(--font-mono)",
                }}
              >
                {item.value === 0 ? "0" : formatCurrency(Math.abs(item.value))}
              </p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: "0",
            marginBottom: "16px",
            background: "var(--color-surface-2)",
            borderRadius: "10px",
            padding: "3px",
          }}
        >
          {(["expenses", "income"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                padding: "8px",
                border: "none",
                cursor: "pointer",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 500,
                fontFamily: "var(--font-sans)",
                background: tab === t ? "var(--color-surface)" : "transparent",
                color:
                  tab === t ? "var(--color-text)" : "var(--color-text-muted)",
                transition: "all 0.15s",
              }}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Expenses tab — grouped by category */}
        {tab === "expenses" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {categoryList.length === 0 ? (
              <p
                style={{
                  textAlign: "center",
                  color: "var(--color-text-muted)",
                  padding: "40px 0",
                }}
              >
                No expenses this period
              </p>
            ) : (
              categoryList.map((cat) => (
                <div key={cat.name}>
                  {/* Category header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 0 6px",
                    }}
                  >
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        background: `${cat.color}22`,
                        border: `1px solid ${cat.color}33`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <CategoryIcon icon={cat.icon} size={16} />
                    </div>
                    <span
                      style={{ fontWeight: 600, fontSize: "13px", flex: 1 }}
                    >
                      {cat.name}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "var(--color-danger)",
                      }}
                    >
                      -{formatCurrency(cat.total)}
                    </span>
                  </div>
                  {/* Items */}
                  {cat.items.map((e) => (
                    <div
                      key={e.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "8px 12px 8px 42px",
                        borderRadius: "8px",
                      }}
                      onMouseEnter={(ev) =>
                        (ev.currentTarget.style.background =
                          "var(--color-surface-2)")
                      }
                      onMouseLeave={(ev) =>
                        (ev.currentTarget.style.background = "transparent")
                      }
                    >
                      <div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "13px",
                            fontWeight: 500,
                          }}
                        >
                          {e.title}
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "11px",
                            color: "var(--color-text-muted)",
                          }}
                        >
                          {new Date(e.date).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                          })}
                          {e.tags?.length > 0 && ` · ${e.tags.join(", ")}`}
                        </p>
                      </div>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "13px",
                          color: "var(--color-danger)",
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        -{formatCurrency(e.amount)}
                      </span>
                    </div>
                  ))}
                  <div
                    style={{
                      height: "1px",
                      background: "var(--color-border)",
                      marginTop: "4px",
                    }}
                  />
                </div>
              ))
            )}
          </div>
        )}

        {/* Income tab */}
        {tab === "income" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {period.incomeItems.length === 0 ? (
              <p
                style={{
                  textAlign: "center",
                  color: "var(--color-text-muted)",
                  padding: "40px 0",
                }}
              >
                No income this period
              </p>
            ) : (
              period.incomeItems.map((inc) => (
                <div
                  key={inc.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 14px",
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "10px",
                  }}
                >
                  <div>
                    <p style={{ margin: 0, fontSize: "14px", fontWeight: 500 }}>
                      {inc.title}
                    </p>
                    <p
                      style={{
                        margin: "2px 0 0",
                        fontSize: "12px",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {inc.source} ·{" "}
                      {new Date(inc.date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "var(--color-success)",
                    }}
                  >
                    +{formatCurrency(inc.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Report Component ────────────────────────────────────

export function ReportClient() {
  const { isPro } = useSubscription();
  const router = useRouter();
  const [periods, setPeriods] = useState<PeriodSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PeriodSummary | null>(null);

  useEffect(() => {
    async function load() {
      try {
        // Anchor is always the 27th of the month
        const now = new Date();
        const anchor = new Date(now.getFullYear(), now.getMonth(), 27);
        // If today is before the 27th, start from the 27th of the previous month
        const today = now.getDate();
        if (today < 27) {
          anchor.setMonth(anchor.getMonth() - 1);
        }
        const periodDefs = buildPeriods(anchor, 12);

        // Fetch all expenses and incomes at once
        const [expRes, incRes] = await Promise.all([
          getExpenses({ page: 1, page_size: 500 }),
          getIncomes({ page: 1, page_size: 500 }),
        ]);

        const allExpenses: Expense[] = expRes.data ?? [];
        const allIncomes: Income[] = incRes.data ?? [];

        const summaries: PeriodSummary[] = periodDefs.map(({ start, end }) => {
          const startStr = toLocalDateStr(start);
          const endStr = toLocalDateStr(end);

          const expItems = allExpenses.filter((e) => {
            const d = toLocalDateStr(new Date(e.date));
            return d >= startStr && d <= endStr;
          });
          const incItems = allIncomes.filter((i) => {
            const d = toLocalDateStr(new Date(i.date));
            return d >= startStr && d <= endStr;
          });

          const expenses = expItems.reduce((s, e) => s + e.amount, 0);
          const income = incItems.reduce((s, i) => s + i.amount, 0);

          return {
            start,
            end,
            expenses,
            income,
            balance: income - expenses,
            expenseItems: expItems,
            incomeItems: incItems,
          };
        });

        // Only show periods that have data, plus the current period always
        setPeriods(summaries);
      } catch {
        errorAlert("Failed to load report");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading)
    return (
      <div style={{ padding: "32px" }}>
        <Spinner />
      </div>
    );

  const periodsWithData = periods.filter(
    (p, i) => i === 0 || p.expenses > 0 || p.income > 0,
  );

  return (
    <>
      {selected && (
        <PeriodDetail period={selected} onClose={() => setSelected(null)} />
      )}

      <div style={{ padding: "32px" }}>
        <PageHeader title="Report" subtitle="Monthly financial summary" />

        {periodsWithData.length === 0 ? (
          <Card>
            <p
              style={{
                textAlign: "center",
                color: "var(--color-text-muted)",
                padding: "40px 0",
              }}
            >
              No data yet. Add expenses and income to see your report.
            </p>
          </Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {periodsWithData.map((p, i) => (
              <div
                key={i}
                onClick={() => setSelected(p)}
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "12px",
                  padding: "16px 20px",
                  cursor: "pointer",
                  transition: "background 0.15s",
                  marginBottom: "8px",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--color-surface-2)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "var(--color-surface)")
                }
              >
                {/* Period label */}
                <p
                  style={{
                    margin: "0 0 12px",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--color-text-muted)",
                    textAlign: "center",
                  }}
                >
                  {formatPeriod(p.start, p.end)}
                  {i === 0 && (
                    <span
                      style={{
                        marginLeft: "8px",
                        fontSize: "10px",
                        background: "var(--color-accent-dim)",
                        color: "var(--color-accent)",
                        padding: "2px 7px",
                        borderRadius: "20px",
                        fontWeight: 700,
                      }}
                    >
                      CURRENT
                    </span>
                  )}
                </p>

                {/* Rows */}
                {[
                  {
                    label: "Expenses",
                    value: p.expenses,
                    color: "var(--color-text)",
                    prefix: "",
                  },
                  {
                    label: "Income",
                    value: p.income,
                    color: "var(--color-success)",
                    prefix: "+",
                  },
                  {
                    label: "Balance",
                    value: p.balance,
                    color:
                      p.balance >= 0
                        ? "var(--color-success)"
                        : "var(--color-danger)",
                    prefix: p.balance >= 0 ? "+" : "",
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "5px 0",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "14px",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {row.label}
                    </span>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: row.color,
                        }}
                      >
                        {row.value === 0
                          ? "0"
                          : `${row.prefix}${formatCurrency(Math.abs(row.value))}`}
                      </span>
                      {row.label === "Expenses" && (
                        <ChevronRight
                          size={14}
                          style={{ color: "var(--color-text-muted)" }}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
