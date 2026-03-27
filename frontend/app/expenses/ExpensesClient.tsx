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
import { formatCurrency, formatDate, formatDateInput } from "@/lib/utils";
import {
  Plus,
  Pencil,
  Trash2,
  Receipt,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { successAlert, errorAlert, confirmDelete } from "@/lib/alert";

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

  // Set default category once categories load
  useEffect(() => {
    if (!form.category_id && categories.length > 0) {
      setForm((f) => ({ ...f, category_id: categories[0].id }));
    }
  }, [categories]);
  const [tagInput, setTagInput] = useState(initial?.tags?.join(", ") || "");
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const handleSubmit = () => {
    if (validate()) onSubmit(form);
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
        onClick={handleSubmit}
        loading={loading}
        style={{ marginTop: "4px" }}
      >
        {initial?.id ? "Save Changes" : "Add Expense"}
      </Button>
    </div>
  );
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

  useEffect(() => {
    Promise.all([getExpenses({ page: 1, page_size: 20 }), getCategories()])
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
          page_size: 20,
          category_id: catId || undefined,
        });
        setExpenses(res.data || []);
        setMeta(res.meta || null);
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
      const upd: UpdateExpenseInput = {
        title: input.title,
        amount: input.amount,
        category_id: input.category_id,
        tags: input.tags,
        date: input.date,
        description: input.description,
      };
      await updateExpense(editTarget.id, upd);
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

  const filtered = search
    ? expenses.filter((e) =>
        e.title.toLowerCase().includes(search.toLowerCase()),
      )
    : expenses;

  if (loadingInit)
    return (
      <div style={{ padding: "32px" }}>
        <Spinner />
      </div>
    );

  return (
    <div style={{ padding: "32px" }}>
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
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
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
                boxSizing: "border-box",
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

      {/* Table */}
      <Card style={{ padding: "0", overflow: "hidden" }}>
        {isPending ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Receipt size={36} />}
            title="No expenses found"
            subtitle={
              search || filterCat
                ? "Try adjusting your filters"
                : "Add your first expense to get started"
            }
          />
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                {["Title", "Category", "Tags", "Date", "Amount", ""].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "var(--color-text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((exp, i) => (
                <tr
                  key={exp.id}
                  style={{
                    borderBottom:
                      i < filtered.length - 1
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
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <td
                    style={{
                      padding: "13px 16px",
                      fontSize: "14px",
                      fontWeight: 500,
                      maxWidth: "200px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {exp.title}
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    {exp.category && (
                      <Badge color={exp.category.color}>
                        {exp.category.icon} {exp.category.name}
                      </Badge>
                    )}
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <div
                      style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}
                    >
                      {exp.tags?.map((tag) => (
                        <Badge key={tag}>{tag}</Badge>
                      ))}
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "13px 16px",
                      fontSize: "13px",
                      color: "var(--color-text-muted)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatDate(exp.date)}
                  </td>
                  <td
                    style={{
                      padding: "13px 16px",
                      fontFamily: "var(--font-mono)",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "var(--color-danger)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    -{formatCurrency(exp.amount)}
                  </td>
                  <td style={{ padding: "13px 16px" }}>
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
        )}
      </Card>

      {/* Pagination */}
      {meta && meta.total_pages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "12px",
            marginTop: "20px",
          }}
        >
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => {
              const p = page - 1;
              setPage(p);
              refresh(p);
            }}
          >
            <ChevronLeft size={14} /> Prev
          </Button>
          <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
            Page <strong style={{ color: "var(--color-text)" }}>{page}</strong>{" "}
            of {meta.total_pages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= meta.total_pages}
            onClick={() => {
              const p = page + 1;
              setPage(p);
              refresh(p);
            }}
          >
            Next <ChevronRight size={14} />
          </Button>
        </div>
      )}

      {/* Add Modal */}
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

      {/* Edit Modal */}
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
  );
}
