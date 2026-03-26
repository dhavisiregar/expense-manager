"use client";

import { useState, useCallback, useTransition } from "react";
import { Category, CreateCategoryInput } from "@/types";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/api";

export function useCategories(initial: Category[] = []) {
  const [categories, setCategories] = useState<Category[]>(initial);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(() => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await getCategories();
        setCategories(res.data ?? []);
      } catch (e: any) {
        setError(e.message ?? "Failed to load categories");
      }
    });
  }, []);

  const create = useCallback(
    async (input: CreateCategoryInput): Promise<Category | null> => {
      setError(null);
      try {
        const res = await createCategory(input);
        refresh();
        return res.data ?? null;
      } catch (e: any) {
        setError(e.message ?? "Failed to create category");
        return null;
      }
    },
    [refresh],
  );

  const update = useCallback(
    async (
      id: string,
      input: Partial<CreateCategoryInput>,
    ): Promise<Category | null> => {
      setError(null);
      try {
        const res = await updateCategory(id, input);
        refresh();
        return res.data ?? null;
      } catch (e: any) {
        setError(e.message ?? "Failed to update category");
        return null;
      }
    },
    [refresh],
  );

  const remove = useCallback(async (id: string): Promise<boolean> => {
    setError(null);
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      return true;
    } catch (e: any) {
      setError(e.message ?? "Failed to delete category");
      return false;
    }
  }, []);

  return {
    categories,
    loading: isPending,
    error,
    refresh,
    create,
    update,
    remove,
  };
}
