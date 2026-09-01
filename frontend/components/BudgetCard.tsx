"use client";

import { AlertTriangle, CheckCircle2, Pencil, Trash2 } from "lucide-react";
import { Card, Button } from "@/components/ui";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import type { BudgetStatus } from "@/types";

interface BudgetCardProps {
  budget: BudgetStatus;
  onEdit?: (budget: BudgetStatus) => void;
  onDelete?: (id: string) => void;
  deleting?: boolean;
}

function formatIDR(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function BudgetCard({ budget, onEdit, onDelete, deleting }: BudgetCardProps) {
  const pct = Math.min(budget.usage_pct, 100);
  const statusColor = budget.is_over_limit
    ? "var(--color-danger)"
    : budget.is_near_limit
      ? "var(--color-warning)"
      : "var(--color-success)";

  return (
    <Card style={{ opacity: deleting ? 0.4 : 1, transition: "opacity 0.2s" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "var(--color-surface-2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <CategoryIcon icon={budget.category_icon} size={18} />
          </div>
          <span
            style={{
              fontWeight: 600,
              fontSize: "14px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {budget.category_name}
          </span>
        </div>
        {budget.is_over_limit ? (
          <AlertTriangle size={16} color="var(--color-danger)" />
        ) : budget.is_near_limit ? (
          <AlertTriangle size={16} color="var(--color-warning)" />
        ) : (
          <CheckCircle2 size={16} color="var(--color-success)" />
        )}
      </div>

      <div
        style={{
          height: "8px",
          width: "100%",
          borderRadius: "999px",
          background: "var(--color-surface-2)",
          overflow: "hidden",
          marginBottom: "10px",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: statusColor,
            transition: "width 0.2s",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "13px",
          color: "var(--color-text-muted)",
        }}
      >
        <span>
          {formatIDR(budget.spent)} / {formatIDR(budget.limit_amount)}
        </span>
        <span style={{ color: statusColor, fontWeight: 600 }}>
          {budget.usage_pct.toFixed(0)}%
        </span>
      </div>

      {budget.is_over_limit && (
        <p style={{ margin: "8px 0 0", fontSize: "12px", color: "var(--color-danger)" }}>
          Over budget by {formatIDR(Math.abs(budget.remaining))}
        </p>
      )}
      {!budget.is_over_limit && budget.is_near_limit && (
        <p style={{ margin: "8px 0 0", fontSize: "12px", color: "var(--color-warning)" }}>
          Approaching limit — {formatIDR(budget.remaining)} left
        </p>
      )}

      {(onEdit || onDelete) && (
        <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
          {onEdit && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onEdit(budget)}
              style={{ flex: 1 }}
            >
              <Pencil size={12} /> Edit
            </Button>
          )}
          {onDelete && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => onDelete(budget.id)}
              loading={deleting}
              style={{ padding: "6px 10px" }}
            >
              <Trash2 size={12} />
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
