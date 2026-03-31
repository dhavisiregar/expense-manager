"use client";

import { useState, useTransition, useEffect } from "react";
import { Category, CreateExpenseInput, Expense, PaginationMeta } from "@/types";
import {
  createExpense,
  deleteExpense,
  getExpenses,
  updateExpense,
  getCategories,
} from "@/lib/api";
import {
  Button,
  Card,
  Input,
  Modal,
  PageHeader,
  Select,
  Textarea,
  Badge,
  EmptyState,
  Spinner,
} from "@/components/ui";
import { formatCurrency, formatDateInput } from "@/lib/utils";
import {
  Plus,
  Pencil,
  Trash2,
  Receipt,
  Search,
  ChevronDown,
} from "lucide-react";
import { confirmDelete, errorAlert, successAlert } from "@/lib/alert";

const DAY_PAGE_SIZE = 5;

function ExpenseForm({
  categories,
  initial,
  onSubmit,
  loading,
}: {
  categories: Category[];
  initial?: Partial<Expense>;
  onSubmit: (data: CreateExpenseInput) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<CreateExpenseInput>({
    title: initial?.title || "",
    amount: initial?.amount || (0 as any),
    category_id: initial?.category_id || "",
    tags: initial?.tags || [],
    date: initial?.date
      ? formatDateInput(initial.date)
      : formatDateInput(new Date().toISOString()),
    description: initial?.description || "",
  });
  const [tagInput, setTagInput] = useState(initial?.tags?.join(", ") || "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!form.category_id && categories.length > 0) {
      setForm((f) => ({ ...f, category_id: categories[0].id }));
    }
  }, [categories]);

  const set = (k: keyof CreateExpenseInput, v: any) =>
    setForm((f) => ({ ...f, [k]: v }));

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.amount || form.amount <= 0)
      e.amount = "Amount must be greater than 0";
    if (!form.category_id) e.category_id = "Category is required";
    if (!form.date) e.date = "Date is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <Input
        label="Title *"
        value={form.title}
        onChange={(e) => set("title", e.target.value)}
        placeholder="e.g. Lunch at Sushi Tei"
        error={errors.title}
      />
      <div
        className="form-row-2"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}
      >
        <Input
          label="Amount (IDR) *"
          type="number"
          value={form.amount || ""}
          onChange={(e) => set("amount", parseFloat(e.target.value))}
          placeholder="0"
          error={errors.amount}
        />
        <Input
          label="Date *"
          type="date"
          value={form.date}
          onChange={(e) => set("date", e.target.value)}
          error={errors.date}
        />
      </div>
      <Select
        label="Category *"
        value={form.category_id}
        onChange={(e) => set("category_id", e.target.value)}
        error={errors.category_id}
      >
        <option value="">Select a category</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.icon} {c.name}
          </option>
        ))}
      </Select>
      <Input
        label="Tags (comma separated)"
        value={tagInput}
        onChange={(e) => {
          setTagInput(e.target.value);
          set(
            "tags",
            e.target.value
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
          );
        }}
        placeholder="food, work, personal"
      />
      <Textarea
        label="Description"
        value={form.description}
        onChange={(e) => set("description", e.target.value)}
        placeholder="Optional notes..."
      />
      <Button
        onClick={() => {
          if (validate()) onSubmit(form);
        }}
        loading={loading}
        style={{ marginTop: "4px" }}
      >
        {initial?.id ? "Save Changes" : "Add Expense"}
      </Button>
    </div>
  );
}

function groupByDate(
  expenses: Expense[],
): { date: string; items: Expense[] }[] {
  const map = new Map<string, Expense[]>();
  for (const exp of expenses) {
    const key = exp.date.slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(exp);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, items]) => ({ date, items }));
}

function dateGroupLabel(isoDate: string): string {
  const d = new Date(isoDate + "T00:00:00");
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(d, today)) return "Today";
  if (sameDay(d, yesterday)) return "Yesterday";

  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function ExpensesClient({
  initialExpenses,
  categories: initialCategories,
  initialMeta,
}: {
  initialExpenses: Expense[];
  categories?: Category[];
  initialMeta: PaginationMeta | null;
}) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [categories, setCategories] = useState<Category[]>(
    initialCategories ?? [],
  );
  const [meta, setMeta] = useState(initialMeta);
  const [page, setPage] = useState(1);
  const [filterCat, setFilterCat] = useState("");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<Expense | null>(null);
  const [isPending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loadingInit, setLoadingInit] = useState(true);

  // Per-date visible count: { "2026-03-31": 5, "2026-03-30": 10, ... }
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>(
    {},
  );

  useEffect(() => {
    Promise.all([getExpenses({ page: 1, page_size: 100 }), getCategories()])
      .then(([expRes, catRes]) => {
        setExpenses(expRes.data || []);
        setMeta(expRes.meta || null);
        setCategories(catRes.data || []);
      })
      .catch(() => errorAlert("Failed to load data"))
      .finally(() => setLoadingInit(false));
  }, []);

  const refresh = (p = page, catId = filterCat) => {
    startTransition(async () => {
      try {
        const res = await getExpenses({
          page: p,
          page_size: 100,
          category_id: catId || undefined,
        });
        setExpenses(res.data || []);
        setMeta(res.meta || null);
        setVisibleCounts({}); // reset per-day pagination on refresh
      } catch {
        errorAlert("Failed to load expenses");
      }
    });
  };

  const handleCreate = async (input: CreateExpenseInput) => {
    setSubmitting(true);
    try {
      await createExpense(input);
      setShowAdd(false);
      successAlert("Expense added successfully");
      refresh(1);
    } catch (e: any) {
      errorAlert(e.message || "Failed to add expense");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (input: CreateExpenseInput) => {
    if (!editTarget) return;
    setSubmitting(true);
    try {
      await updateExpense(editTarget.id, {
        title: input.title,
        amount: input.amount,
        category_id: input.category_id,
        tags: input.tags,
        date: input.date,
        description: input.description,
      });
      setEditTarget(null);
      successAlert("Expense updated");
      refresh();
    } catch (e: any) {
      errorAlert(e.message || "Failed to update expense");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirmDelete("Delete this expense?");
    if (!confirmed) return;
    setDeletingId(id);
    try {
      await deleteExpense(id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      successAlert("Expense deleted");
    } catch (e: any) {
      errorAlert(e.message || "Failed to delete expense");
    } finally {
      setDeletingId(null);
    }
  };

  const getVisibleCount = (date: string) =>
    visibleCounts[date] ?? DAY_PAGE_SIZE;

  const showMore = (date: string, total: number) => {
    setVisibleCounts((prev) => ({
      ...prev,
      [date]: Math.min((prev[date] ?? DAY_PAGE_SIZE) + DAY_PAGE_SIZE, total),
    }));
  };

  const filtered = search
    ? expenses.filter((e) =>
        e.title.toLowerCase().includes(search.toLowerCase()),
      )
    : expenses;

  const grouped = groupByDate(filtered);

  if (loadingInit)
    return (
      <div style={{ padding: "20px 16px" }}>
        <Spinner />
      </div>
    );

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .expenses-page { padding: 20px 16px !important; }
          .expenses-filter { flex-direction: column !important; }
          .expenses-filter select { width: 100% !important; }
          .exp-col-tags { display: none !important; }
          .exp-col-category { display: none !important; }
        }
      `}</style>

      <div className="expenses-page" style={{ padding: "32px" }}>
        <PageHeader
          title="Expenses"
          subtitle={`${meta?.total_items ?? expenses.length} total transactions`}
          action={
            <Button onClick={() => setShowAdd(true)}>
              <Plus size={15} /> Add Expense
            </Button>
          }
        />

        {/* Filters */}
        <Card style={{ marginBottom: "20px", padding: "14px 16px" }}>
          <div
            className="expenses-filter"
            style={{ display: "flex", gap: "12px", alignItems: "center" }}
          >
            <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
              <Search
                size={14}
                style={{
                  position: "absolute",
                  left: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--color-text-muted)",
                }}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search expenses..."
                style={{
                  background: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                  color: "var(--color-text)",
                  fontFamily: "var(--font-sans)",
                  fontSize: "13px",
                  padding: "8px 12px 8px 32px",
                  outline: "none",
                  width: "100%",
                  boxSizing: "border-box" as any,
                }}
              />
            </div>
            <select
              value={filterCat}
              onChange={(e) => {
                setFilterCat(e.target.value);
                setPage(1);
                refresh(1, e.target.value);
              }}
              style={{
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                color: "var(--color-text)",
                fontFamily: "var(--font-sans)",
                fontSize: "13px",
                padding: "8px 12px",
                outline: "none",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {filterCat && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterCat("");
                  setPage(1);
                  refresh(1, "");
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </Card>

        {/* Date-grouped expense list */}
        {isPending ? (
          <Spinner />
        ) : grouped.length === 0 ? (
          <Card style={{ padding: "0", overflow: "hidden" }}>
            <EmptyState
              icon={<Receipt size={36} />}
              title="No expenses found"
              subtitle={
                search || filterCat
                  ? "Try adjusting your filters"
                  : "Add your first expense to get started"
              }
            />
          </Card>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {grouped.map(({ date, items }) => {
              const dayTotal = items.reduce((sum, e) => sum + e.amount, 0);
              const visibleCount = getVisibleCount(date);
              const visibleItems = items.slice(0, visibleCount);
              const hasMore = visibleCount < items.length;
              const remaining = items.length - visibleCount;

              return (
                <div key={date}>
                  {/* Date section header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                      padding: "0 4px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "var(--color-text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {dateGroupLabel(date)}
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "var(--color-danger)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      -{formatCurrency(dayTotal)}
                    </span>
                  </div>

                  <Card style={{ padding: "0", overflow: "hidden" }}>
                    <div
                      style={
                        {
                          overflowX: "auto",
                          WebkitOverflowScrolling: "touch",
                        } as any
                      }
                    >
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          minWidth: "380px",
                        }}
                      >
                        <tbody>
                          {visibleItems.map((exp, i) => (
                            <tr
                              key={exp.id}
                              style={{
                                borderBottom:
                                  i < visibleItems.length - 1 || hasMore
                                    ? "1px solid var(--color-border)"
                                    : "none",
                                opacity: deletingId === exp.id ? 0.4 : 1,
                                transition: "opacity 0.2s, background 0.1s",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background =
                                  "var(--color-surface-2)")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background =
                                  "transparent")
                              }
                            >
                              <td
                                style={{
                                  padding: "13px 16px",
                                  fontSize: "14px",
                                  fontWeight: 500,
                                  maxWidth: "160px",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {exp.title}
                              </td>
                              <td
                                className="exp-col-category"
                                style={{ padding: "13px 16px" }}
                              >
                                {exp.category && (
                                  <Badge color={exp.category.color}>
                                    {exp.category.icon} {exp.category.name}
                                  </Badge>
                                )}
                              </td>
                              <td
                                className="exp-col-tags"
                                style={{ padding: "13px 16px" }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    gap: "4px",
                                    flexWrap: "wrap",
                                  }}
                                >
                                  {exp.tags?.map((tag) => (
                                    <Badge key={tag}>{tag}</Badge>
                                  ))}
                                </div>
                              </td>
                              <td
                                style={{
                                  padding: "13px 16px",
                                  fontFamily: "var(--font-mono)",
                                  fontSize: "14px",
                                  fontWeight: 600,
                                  color: "var(--color-danger)",
                                  whiteSpace: "nowrap",
                                  textAlign: "right",
                                }}
                              >
                                -{formatCurrency(exp.amount)}
                              </td>
                              <td
                                style={{ padding: "13px 16px", width: "72px" }}
                              >
                                <div style={{ display: "flex", gap: "6px" }}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditTarget(exp)}
                                    style={{ padding: "5px" }}
                                    title="Edit"
                                  >
                                    <Pencil size={13} />
                                  </Button>
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => handleDelete(exp.id)}
                                    style={{ padding: "5px" }}
                                    loading={deletingId === exp.id}
                                    title="Delete"
                                  >
                                    <Trash2 size={13} />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Show more button */}
                    {hasMore && (
                      <button
                        onClick={() => showMore(date, items.length)}
                        style={{
                          width: "100%",
                          padding: "10px 16px",
                          background: "transparent",
                          border: "none",
                          borderTop: "1px solid var(--color-border)",
                          color: "var(--color-text-muted)",
                          fontSize: "12px",
                          fontFamily: "var(--font-sans)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          transition: "background 0.1s, color 0.1s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            "var(--color-surface-2)";
                          e.currentTarget.style.color = "var(--color-text)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color =
                            "var(--color-text-muted)";
                        }}
                      >
                        <ChevronDown size={13} />
                        Show {remaining} more
                      </button>
                    )}
                  </Card>
                </div>
              );
            })}
          </div>
        )}

        <Modal
          open={showAdd}
          onClose={() => setShowAdd(false)}
          title="Add Expense"
        >
          <ExpenseForm
            categories={categories}
            onSubmit={handleCreate}
            loading={submitting}
          />
        </Modal>
        <Modal
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          title="Edit Expense"
        >
          {editTarget && (
            <ExpenseForm
              categories={categories}
              initial={editTarget}
              onSubmit={handleUpdate}
              loading={submitting}
            />
          )}
        </Modal>
      </div>
    </>
  );
}
