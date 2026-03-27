"use client";

import { useState, useTransition, useEffect } from "react";
import {
  Income,
  CreateIncomeInput,
  UpdateIncomeInput,
  PaginationMeta,
} from "@/types";
import {
  createIncome,
  deleteIncome,
  getIncomes,
  updateIncome,
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
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { confirmDelete, errorAlert, successAlert } from "@/lib/alert";

const INCOME_SOURCES = [
  "Salary",
  "Freelance",
  "Business",
  "Investment",
  "Rental",
  "Bonus",
  "Gift",
  "Refund",
  "Side Project",
  "Other",
];

function IncomeForm({
  initial,
  onSubmit,
  loading,
}: {
  initial?: Partial<Income>;
  onSubmit: (data: CreateIncomeInput) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<CreateIncomeInput>({
    title: initial?.title || "",
    amount: initial?.amount || (0 as any),
    source: initial?.source || "Salary",
    date: initial?.date
      ? formatDateInput(initial.date)
      : formatDateInput(new Date().toISOString()),
    description: initial?.description || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: keyof CreateIncomeInput, v: any) =>
    setForm((f) => ({ ...f, [k]: v }));

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.amount || form.amount <= 0)
      e.amount = "Amount must be greater than 0";
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
        placeholder="e.g. Monthly Salary"
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
        label="Source"
        value={form.source}
        onChange={(e) => set("source", e.target.value)}
      >
        {INCOME_SOURCES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </Select>
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
        {initial?.id ? "Save Changes" : "Add Income"}
      </Button>
    </div>
  );
}

export function IncomeClient({
  initialIncomes,
  initialMeta,
}: {
  initialIncomes: Income[];
  initialMeta: PaginationMeta | null;
}) {
  const [incomes, setIncomes] = useState(initialIncomes);
  const [meta, setMeta] = useState(initialMeta);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<Income | null>(null);
  const [isPending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loadingInit, setLoadingInit] = useState(true);

  useEffect(() => {
    getIncomes({ page: 1, page_size: 20 })
      .then((res) => {
        setIncomes(res.data || []);
        setMeta(res.meta || null);
      })
      .catch(() => errorAlert("Failed to load income"))
      .finally(() => setLoadingInit(false));
  }, []);

  const refresh = (p = page) => {
    startTransition(async () => {
      try {
        const res = await getIncomes({ page: p, page_size: 20 });
        setIncomes(res.data || []);
        setMeta(res.meta || null);
      } catch {
        errorAlert("Failed to load income");
      }
    });
  };

  const handleCreate = async (input: CreateIncomeInput) => {
    setSubmitting(true);
    try {
      await createIncome(input);
      setShowAdd(false);
      successAlert("Income added successfully");
      refresh(1);
    } catch (e: any) {
      errorAlert(e.message || "Failed to add income");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (input: CreateIncomeInput) => {
    if (!editTarget) return;
    setSubmitting(true);
    try {
      const upd: UpdateIncomeInput = {
        title: input.title,
        amount: input.amount,
        source: input.source,
        date: input.date,
        description: input.description,
      };
      await updateIncome(editTarget.id, upd);
      setEditTarget(null);
      successAlert("Income updated");
      refresh();
    } catch (e: any) {
      errorAlert(e.message || "Failed to update income");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirmDelete("Delete this income entry?");
    if (!confirmed) return;

    setDeletingId(id);
    try {
      await deleteIncome(id);
      setIncomes((prev) => prev.filter((i) => i.id !== id));
      successAlert("Income deleted");
    } catch (e: any) {
      errorAlert(e.message || "Failed to delete income");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = search
    ? incomes.filter(
        (i) =>
          i.title.toLowerCase().includes(search.toLowerCase()) ||
          i.source.toLowerCase().includes(search.toLowerCase()),
      )
    : incomes;

  // Summary totals from current page
  const pageTotal = filtered.reduce((sum, i) => sum + i.amount, 0);

  if (loadingInit)
    return (
      <div style={{ padding: "32px" }}>
        <Spinner />
      </div>
    );

  return (
    <div style={{ padding: "32px" }}>
      <PageHeader
        title="Income"
        subtitle={`${meta?.total_items ?? incomes.length} total entries`}
        action={
          <Button onClick={() => setShowAdd(true)}>
            <Plus size={15} /> Add Income
          </Button>
        }
      />

      {/* Summary strip */}
      {filtered.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "16px",
            marginBottom: "20px",
          }}
        >
          <Card style={{ flex: 1, padding: "14px 18px" }}>
            <p
              style={{
                margin: "0 0 2px",
                fontSize: "11px",
                color: "var(--color-text-muted)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Showing
            </p>
            <p
              style={{
                margin: 0,
                fontSize: "20px",
                fontWeight: 700,
                color: "var(--color-success)",
                letterSpacing: "-0.4px",
              }}
            >
              +{formatCurrency(pageTotal)}
            </p>
          </Card>
          <Card style={{ flex: 1, padding: "14px 18px" }}>
            <p
              style={{
                margin: "0 0 2px",
                fontSize: "11px",
                color: "var(--color-text-muted)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Entries
            </p>
            <p
              style={{
                margin: 0,
                fontSize: "20px",
                fontWeight: 700,
                letterSpacing: "-0.4px",
              }}
            >
              {filtered.length}
            </p>
          </Card>
        </div>
      )}

      {/* Search */}
      <Card style={{ marginBottom: "20px", padding: "14px 16px" }}>
        <div style={{ position: "relative" }}>
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
            placeholder="Search by title or source..."
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
      </Card>

      {/* Table */}
      <Card style={{ padding: "0", overflow: "hidden" }}>
        {isPending ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<TrendingUp size={36} />}
            title="No income entries yet"
            subtitle="Add your first income to track your earnings"
          />
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                {["Title", "Source", "Date", "Amount", ""].map((h) => (
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
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((inc, i) => (
                <tr
                  key={inc.id}
                  style={{
                    borderBottom:
                      i < filtered.length - 1
                        ? "1px solid var(--color-border)"
                        : "none",
                    opacity: deletingId === inc.id ? 0.4 : 1,
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
                  <td style={{ padding: "13px 16px" }}>
                    <div>
                      <p
                        style={{ margin: 0, fontSize: "14px", fontWeight: 500 }}
                      >
                        {inc.title}
                      </p>
                      {inc.description && (
                        <p
                          style={{
                            margin: "2px 0 0",
                            fontSize: "12px",
                            color: "var(--color-text-muted)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "200px",
                          }}
                        >
                          {inc.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <Badge color="var(--color-success)">{inc.source}</Badge>
                  </td>
                  <td
                    style={{
                      padding: "13px 16px",
                      fontSize: "13px",
                      color: "var(--color-text-muted)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatDate(inc.date)}
                  </td>
                  <td
                    style={{
                      padding: "13px 16px",
                      fontFamily: "var(--font-mono)",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "var(--color-success)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    +{formatCurrency(inc.amount)}
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditTarget(inc)}
                        style={{ padding: "5px" }}
                        title="Edit"
                      >
                        <Pencil size={13} />
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(inc.id)}
                        loading={deletingId === inc.id}
                        style={{ padding: "5px" }}
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

      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add Income"
      >
        <IncomeForm onSubmit={handleCreate} loading={submitting} />
      </Modal>

      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit Income"
      >
        {editTarget && (
          <IncomeForm
            initial={editTarget}
            onSubmit={handleUpdate}
            loading={submitting}
          />
        )}
      </Modal>
    </div>
  );
}
