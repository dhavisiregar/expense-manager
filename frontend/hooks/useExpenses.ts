"use client";

import { useState, useCallback, useTransition } from "react";
import {
  Expense,
  ExpenseFilter,
  PaginationMeta,
  CreateExpenseInput,
  UpdateExpenseInput,
} from "@/types";
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from "@/lib/api";

interface UseExpensesReturn {
  expenses: Expense[];
  meta: PaginationMeta | null;
  loading: boolean;
  error: string | null;
  refresh: (filter?: ExpenseFilter) => void;
  create: (input: CreateExpenseInput) => Promise<Expense | null>;
  update: (id: string, input: UpdateExpenseInput) => Promise<Expense | null>;
  remove: (id: string) => Promise<boolean>;
}

export function useExpenses(
  initialExpenses: Expense[] = [],
  initialMeta: PaginationMeta | null = null,
): UseExpensesReturn {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [meta, setMeta] = useState<PaginationMeta | null>(initialMeta);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback((filter: ExpenseFilter = {}) => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await getExpenses(filter);
        setExpenses(res.data ?? []);
        setMeta(res.meta ?? null);
      } catch (e: any) {
        setError(e.message ?? "Failed to load expenses");
      }
    });
  }, []);

  const create = useCallback(
    async (input: CreateExpenseInput): Promise<Expense | null> => {
      setError(null);
      try {
        const res = await createExpense(input);
        refresh();
        return res.data ?? null;
      } catch (e: any) {
        setError(e.message ?? "Failed to create expense");
        return null;
      }
    },
    [refresh],
  );

  const update = useCallback(
    async (id: string, input: UpdateExpenseInput): Promise<Expense | null> => {
      setError(null);
      try {
        const res = await updateExpense(id, input);
        refresh();
        return res.data ?? null;
      } catch (e: any) {
        setError(e.message ?? "Failed to update expense");
        return null;
      }
    },
    [refresh],
  );

  const remove = useCallback(async (id: string): Promise<boolean> => {
    setError(null);
    try {
      await deleteExpense(id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      return true;
    } catch (e: any) {
      setError(e.message ?? "Failed to delete expense");
      return false;
    }
  }, []);

  return {
    expenses,
    meta,
    loading: isPending,
    error,
    refresh,
    create,
    update,
    remove,
  };
}
