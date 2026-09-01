"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createBudget, deleteBudget, getBudgets, updateBudget } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import type { BudgetStatus, CreateBudgetInput, UpdateBudgetInput } from "@/types";

interface UseBudgetsOptions {
  month?: number; // 1-12
  year?: number;
  /** Fire a toast the first time budgets load if any category is near/over limit. */
  notifyOnLoad?: boolean;
}

export function useBudgets({ month, year, notifyOnLoad }: UseBudgetsOptions = {}) {
  const [budgets, setBudgets] = useState<BudgetStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { warning } = useToast();
  const notifiedRef = useRef(false);

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getBudgets(month, year);
      const data = res.data || [];
      setBudgets(data);

      if (notifyOnLoad && !notifiedRef.current) {
        notifiedRef.current = true;
        const over = data.filter((b) => b.is_over_limit).length;
        const near = data.filter((b) => b.is_near_limit && !b.is_over_limit).length;
        if (over > 0) {
          warning(
            `${over} kategori sudah melewati budget bulan ini`,
          );
        } else if (near > 0) {
          warning(
            `${near} kategori mendekati limit budget bulan ini`,
          );
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load budgets");
    } finally {
      setLoading(false);
    }
  }, [month, year, notifyOnLoad, warning]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const createBudgetAndRefresh = useCallback(
    async (payload: CreateBudgetInput) => {
      await createBudget(payload);
      await fetchBudgets();
    },
    [fetchBudgets],
  );

  const updateBudgetAndRefresh = useCallback(
    async (id: string, payload: UpdateBudgetInput) => {
      await updateBudget(id, payload);
      await fetchBudgets();
    },
    [fetchBudgets],
  );

  const deleteBudgetAndRefresh = useCallback(
    async (id: string) => {
      await deleteBudget(id);
      await fetchBudgets();
    },
    [fetchBudgets],
  );

  const nearLimitCount = budgets.filter((b) => b.is_near_limit && !b.is_over_limit).length;
  const overLimitCount = budgets.filter((b) => b.is_over_limit).length;

  return {
    budgets,
    loading,
    error,
    createBudget: createBudgetAndRefresh,
    updateBudget: updateBudgetAndRefresh,
    deleteBudget: deleteBudgetAndRefresh,
    refetch: fetchBudgets,
    nearLimitCount,
    overLimitCount,
  };
}
