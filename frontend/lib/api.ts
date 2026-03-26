import {
  APIResponse,
  Category,
  CreateCategoryInput,
  CreateExpenseInput,
  DashboardSummary,
  Expense,
  ExpenseFilter,
  PaginationMeta,
  UpdateExpenseInput,
} from "@/types";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<{ data: T; meta?: PaginationMeta }> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const json: APIResponse<T> = await res.json();

  if (!json.success || !res.ok) {
    throw new Error(json.error || "An unexpected error occurred");
  }

  return { data: json.data as T, meta: json.meta };
}

// ─── Expenses ────────────────────────────────────────────────
export async function getExpenses(filter: ExpenseFilter = {}) {
  const params = new URLSearchParams();
  if (filter.category_id) params.set("category_id", filter.category_id);
  if (filter.start_date) params.set("start_date", filter.start_date);
  if (filter.end_date) params.set("end_date", filter.end_date);
  if (filter.page) params.set("page", String(filter.page));
  if (filter.page_size) params.set("page_size", String(filter.page_size));
  const qs = params.toString() ? `?${params.toString()}` : "";
  return request<Expense[]>(`/expenses${qs}`);
}

export async function getExpense(id: string) {
  return request<Expense>(`/expenses/${id}`);
}

export async function createExpense(input: CreateExpenseInput) {
  return request<Expense>("/expenses", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateExpense(id: string, input: UpdateExpenseInput) {
  return request<Expense>(`/expenses/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteExpense(id: string) {
  return request<{ message: string }>(`/expenses/${id}`, { method: "DELETE" });
}

export async function getDashboard() {
  return request<DashboardSummary>("/expenses/dashboard");
}

// ─── Categories ───────────────────────────────────────────────
export async function getCategories() {
  return request<Category[]>("/categories");
}

export async function createCategory(input: CreateCategoryInput) {
  return request<Category>("/categories", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateCategory(
  id: string,
  input: Partial<CreateCategoryInput>,
) {
  return request<Category>(`/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteCategory(id: string) {
  return request<{ message: string }>(`/categories/${id}`, {
    method: "DELETE",
  });
}

// ─── Incomes ──────────────────────────────────────────────────
import type {
  Income,
  CreateIncomeInput,
  UpdateIncomeInput,
  IncomeFilter,
} from "@/types";

export async function getIncomes(filter: IncomeFilter = {}) {
  const params = new URLSearchParams();
  if (filter.start_date) params.set("start_date", filter.start_date);
  if (filter.end_date) params.set("end_date", filter.end_date);
  if (filter.page) params.set("page", String(filter.page));
  if (filter.page_size) params.set("page_size", String(filter.page_size));
  const qs = params.toString() ? `?${params.toString()}` : "";
  return request<Income[]>(`/incomes${qs}`);
}

export async function createIncome(input: CreateIncomeInput) {
  return request<Income>("/incomes", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateIncome(id: string, input: UpdateIncomeInput) {
  return request<Income>(`/incomes/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteIncome(id: string) {
  return request<{ message: string }>(`/incomes/${id}`, { method: "DELETE" });
}
