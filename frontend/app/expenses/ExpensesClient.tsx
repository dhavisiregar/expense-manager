"use client";

import { useState, useTransition, useEffect } from "react";
import {
  Category,
  CreateExpenseInput,
  Expense,
  PaginationMeta,
  UpdateExpenseInput,
} from "@/types";
import {
  createExpense,
  deleteExpense,
  getExpenses,
  updateExpense,
  getCategories,
  getIncomes,
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
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { formatCurrency, formatDate, formatDateInput } from "@/lib/utils";
import {
  Plus,
  Pencil,
  Trash2,
  Receipt,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { confirmDelete, errorAlert, successAlert } from "@/lib/alert";

// ─── helpers ─────────────────────────────────────────────────
function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const today = toLocalDateStr(new Date());
  const yesterday = toLocalDateStr(new Date(Date.now() - 86400000));
  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Expense Form ─────────────────────────────────────────────
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
    if (!form.category_id && categories.length > 0)
      setForm((f) => ({ ...f, category_id: categories[0].id }));
  }, [categories]);

  const set = (k: keyof CreateExpenseInput, v: any) =>
    setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.amount || form.amount <= 0) e.amount = "Amount must be > 0";
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

// ─── Main Component ───────────────────────────────────────────
export function ExpensesClient({
  initialExpenses,
  categories: initialCategories,
  initialMeta,
}: {
  initialExpenses: Expense[];
  categories?: Category[];
  initialMeta: PaginationMeta | null;
}) {
  const today = toLocalDateStr(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [allExpenses, setAllExpenses] = useState<Expense[]>(initialExpenses);
  const [dailyIncome, setDailyIncome] = useState(0);
  const [categories, setCategories] = useState<Category[]>(
    initialCategories ?? [],
  );
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<Expense | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loadingInit, setLoadingInit] = useState(true);
  const [loadingDay, setLoadingDay] = useState(false);
  const [, startTransition] = useTransition();

  // Load all expenses + categories on mount (fetch all pages for client-side date grouping)
  useEffect(() => {
    Promise.all([getExpenses({ page: 1, page_size: 200 }), getCategories()])
      .then(([expRes, catRes]) => {
        setAllExpenses(expRes.data || []);
        setCategories(catRes.data || []);
      })
      .catch(() => errorAlert("Failed to load data"))
      .finally(() => setLoadingInit(false));
  }, []);

  // Load income for selected date
  useEffect(() => {
    getIncomes({
      start_date: selectedDate,
      end_date: selectedDate,
      page: 1,
      page_size: 200,
    })
      .then((res) => {
        const total = (res.data || []).reduce((s, i) => s + i.amount, 0);
        setDailyIncome(total);
      })
      .catch(() => setDailyIncome(0));
  }, [selectedDate]);

  const refresh = () => {
    startTransition(async () => {
      try {
        const res = await getExpenses({ page: 1, page_size: 200 });
        setAllExpenses(res.data || []);
      } catch {
        errorAlert("Failed to reload");
      }
    });
  };

  // Filter expenses for selected date
  const dayExpenses = allExpenses.filter((e) => {
    const d = new Date(e.date);
    return toLocalDateStr(d) === selectedDate;
  });

  const dailyExpenses = dayExpenses.reduce((s, e) => s + e.amount, 0);
  const dailyBalance = dailyIncome - dailyExpenses;

  const prevDay = () => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() - 1);
    setSelectedDate(toLocalDateStr(d));
  };
  const nextDay = () => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + 1);
    setSelectedDate(toLocalDateStr(d));
  };
  const isToday = selectedDate === today;
  const isFuture = selectedDate > today;

  const handleCreate = async (input: CreateExpenseInput) => {
    setSubmitting(true);
    try {
      await createExpense(input);
      setShowAdd(false);
      successAlert("Expense added");
      refresh();
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
      errorAlert(e.message || "Failed to update");
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
      setAllExpenses((prev) => prev.filter((e) => e.id !== id));
      successAlert("Expense deleted");
    } catch (e: any) {
      errorAlert(e.message || "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

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
          .expenses-page { padding: 16px !important; }
          .form-row-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="expenses-page" style={{ padding: "32px" }}>
        {/* ── Day navigator ─────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <button
            onClick={prevDay}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--color-text-muted)",
              padding: "8px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <ChevronLeft size={20} />
          </button>

          <div style={{ textAlign: "center" }}>
            <p
              style={{
                margin: 0,
                fontSize: "16px",
                fontWeight: 700,
                color: "var(--color-text)",
                letterSpacing: "-0.3px",
              }}
            >
              {formatDayLabel(selectedDate)}
            </p>
            {selectedDate !== today && (
              <button
                onClick={() => setSelectedDate(today)}
                style={{
                  margin: "4px 0 0",
                  fontSize: "11px",
                  color: "var(--color-accent)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                }}
              >
                Back to today
              </button>
            )}
          </div>

          <button
            onClick={nextDay}
            disabled={isToday || isFuture}
            style={{
              background: "none",
              border: "none",
              cursor: isToday || isFuture ? "not-allowed" : "pointer",
              color:
                isToday || isFuture
                  ? "var(--color-border)"
                  : "var(--color-text-muted)",
              padding: "8px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* ── Daily summary ─────────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "1px",
            background: "var(--color-border)",
            borderRadius: "12px",
            overflow: "hidden",
            marginBottom: "24px",
          }}
        >
          {[
            {
              label: "Income",
              value: dailyIncome,
              color: "var(--color-success)",
            },
            {
              label: "Expenses",
              value: dailyExpenses,
              color: "var(--color-danger)",
            },
            {
              label: "Balance",
              value: dailyBalance,
              color:
                dailyBalance >= 0
                  ? "var(--color-success)"
                  : "var(--color-danger)",
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: "var(--color-surface)",
                padding: "14px 12px",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  margin: "0 0 4px",
                  fontSize: "11px",
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
                  fontSize: "13px",
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

        {/* ── Expense list ──────────────────────── */}
        {dayExpenses.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <Receipt
              size={36}
              style={{ color: "var(--color-text-muted)", marginBottom: "12px" }}
            />
            <p
              style={{ margin: 0, fontWeight: 500, color: "var(--color-text)" }}
            >
              No expenses on this day
            </p>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "13px",
                color: "var(--color-text-muted)",
              }}
            >
              Tap + to add one
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {dayExpenses.map((exp) => (
              <div
                key={exp.id}
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "12px",
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  opacity: deletingId === exp.id ? 0.4 : 1,
                  transition: "opacity 0.2s",
                }}
              >
                {/* Category icon */}
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    flexShrink: 0,
                    background: exp.category?.color
                      ? `${exp.category.color}22`
                      : "var(--color-surface-2)",
                    border: `1px solid ${exp.category?.color ? `${exp.category.color}33` : "var(--color-border)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {exp.category?.icon ? (
                    <CategoryIcon icon={exp.category.icon} size={20} />
                  ) : (
                    <Receipt
                      size={16}
                      style={{ color: "var(--color-text-muted)" }}
                    />
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "14px",
                      fontWeight: 600,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {exp.title}
                  </p>
                  <p
                    style={{
                      margin: "2px 0 0",
                      fontSize: "12px",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    {exp.category?.name ?? "Uncategorized"}
                    {exp.tags?.length > 0 && ` · ${exp.tags.join(", ")}`}
                  </p>
                </div>

                {/* Amount */}
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontWeight: 700,
                    fontSize: "14px",
                    color: "var(--color-danger)",
                    flexShrink: 0,
                  }}
                >
                  -{formatCurrency(exp.amount)}
                </span>

                {/* Actions */}
                <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
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
                    loading={deletingId === exp.id}
                    style={{ padding: "5px" }}
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── FAB ───────────────────────────────── */}
        <button
          onClick={() => setShowAdd(true)}
          title="Add expense"
          style={{
            position: "fixed",
            bottom: "28px",
            right: "28px",
            width: "54px",
            height: "54px",
            borderRadius: "50%",
            background: "var(--color-accent)",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 20px rgba(124,106,255,0.4)",
            transition: "transform 0.15s, box-shadow 0.15s",
            zIndex: 20,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <Plus size={22} />
        </button>

        {/* Modals */}
        <Modal
          open={showAdd}
          onClose={() => setShowAdd(false)}
          title="Add Expense"
        >
          <ExpenseForm
            categories={categories}
            initial={{ date: selectedDate }}
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
