"use client";

import { useEffect, useState } from "react";
import { useBudgets } from "@/hooks/useBudgets";
import { getCategories } from "@/lib/api";
import { BudgetCard } from "@/components/BudgetCard";
import {
  Button,
  Card,
  Input,
  Modal,
  PageHeader,
  EmptyState,
  Select,
  Spinner,
} from "@/components/ui";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { Plus, PiggyBank, AlertTriangle } from "lucide-react";
import { successAlert, errorAlert, confirmDelete } from "@/lib/alert";
import type { BudgetStatus, Category, CreateBudgetInput, UpdateBudgetInput } from "@/types";

function CreateBudgetForm({
  categories,
  onSubmit,
  loading,
}: {
  categories: Category[];
  onSubmit: (data: CreateBudgetInput) => void;
  loading: boolean;
}) {
  const now = new Date();
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [limitAmount, setLimitAmount] = useState("");
  const [alertThresholdPct, setAlertThresholdPct] = useState("80");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!categoryId) {
      setError("Pilih kategori");
      return;
    }
    const amount = Number(limitAmount);
    if (!amount || amount <= 0) {
      setError("Limit harus lebih dari 0");
      return;
    }
    setError("");
    onSubmit({
      category_id: categoryId,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      limit_amount: amount,
      alert_threshold_pct: Number(alertThresholdPct) || 80,
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Select
        label="Kategori *"
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
      >
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.icon} {c.name}
          </option>
        ))}
      </Select>

      <Input
        label="Limit Bulanan (IDR) *"
        type="number"
        min={0}
        value={limitAmount}
        onChange={(e) => setLimitAmount(e.target.value)}
        placeholder="e.g. 1500000"
        error={error}
      />

      <Input
        label="Alert Threshold (%)"
        type="number"
        min={1}
        max={100}
        value={alertThresholdPct}
        onChange={(e) => setAlertThresholdPct(e.target.value)}
      />
      <p style={{ margin: "-8px 0 0", fontSize: "12px", color: "var(--color-text-muted)" }}>
        Kamu akan mendapat notifikasi saat pengeluaran mencapai persentase ini dari limit.
      </p>

      <Button onClick={handleSubmit} loading={loading}>
        Create Budget
      </Button>
    </div>
  );
}

function EditBudgetForm({
  budget,
  onSubmit,
  loading,
}: {
  budget: BudgetStatus;
  onSubmit: (data: UpdateBudgetInput) => void;
  loading: boolean;
}) {
  const [limitAmount, setLimitAmount] = useState(String(budget.limit_amount));
  const [alertThresholdPct, setAlertThresholdPct] = useState(String(budget.alert_threshold_pct));
  const [error, setError] = useState("");

  const handleSubmit = () => {
    const amount = Number(limitAmount);
    if (!amount || amount <= 0) {
      setError("Limit harus lebih dari 0");
      return;
    }
    setError("");
    onSubmit({
      limit_amount: amount,
      alert_threshold_pct: Number(alertThresholdPct) || 80,
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "10px 12px",
          background: "var(--color-surface-2)",
          borderRadius: "8px",
        }}
      >
        <CategoryIcon icon={budget.category_icon} size={18} />
        <div>
          <p style={{ margin: 0, fontWeight: 600, fontSize: "14px" }}>{budget.category_name}</p>
          <p style={{ margin: 0, fontSize: "12px", color: "var(--color-text-muted)" }}>
            {budget.month}/{budget.year} — kategori dan periode tidak bisa diubah
          </p>
        </div>
      </div>

      <Input
        label="Limit Bulanan (IDR) *"
        type="number"
        min={0}
        value={limitAmount}
        onChange={(e) => setLimitAmount(e.target.value)}
        error={error}
      />

      <Input
        label="Alert Threshold (%)"
        type="number"
        min={1}
        max={100}
        value={alertThresholdPct}
        onChange={(e) => setAlertThresholdPct(e.target.value)}
      />

      <Button onClick={handleSubmit} loading={loading}>
        Save Changes
      </Button>
    </div>
  );
}

export function BudgetsClient() {
  const now = new Date();
  const [month] = useState(now.getMonth() + 1);
  const [year] = useState(now.getFullYear());

  const {
    budgets,
    loading,
    error,
    createBudget,
    updateBudget,
    deleteBudget,
    nearLimitCount,
    overLimitCount,
  } = useBudgets({ month, year, notifyOnLoad: true });

  const [categories, setCategories] = useState<Category[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<BudgetStatus | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.data || []))
      .catch(() => {});
  }, []);

  const budgetedCategoryIds = new Set(budgets.map((b) => b.category_id));
  const availableCategories = categories.filter((c) => !budgetedCategoryIds.has(c.id));

  const handleOpenAdd = () => {
    if (availableCategories.length === 0) {
      errorAlert("Semua kategori sudah punya budget bulan ini, atau belum ada kategori.");
      return;
    }
    setShowAdd(true);
  };

  const handleCreate = async (input: CreateBudgetInput) => {
    setSubmitting(true);
    try {
      await createBudget(input);
      setShowAdd(false);
      await successAlert("Budget created");
    } catch (e: any) {
      errorAlert(e.message || "Failed to create budget");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (input: UpdateBudgetInput) => {
    if (!editTarget) return;
    setSubmitting(true);
    try {
      await updateBudget(editTarget.id, input);
      setEditTarget(null);
      await successAlert("Budget updated");
    } catch (e: any) {
      errorAlert(e.message || "Failed to update budget");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await confirmDelete("Hapus budget ini?");
    if (!result.isConfirmed) return;
    setDeletingId(id);
    try {
      await deleteBudget(id);
      successAlert("Budget deleted");
    } catch (e: any) {
      errorAlert(e.message || "Failed to delete budget");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading)
    return (
      <div className="page-content" style={{ padding: "32px" }}>
        <Spinner />
      </div>
    );

  if (error) {
    return (
      <div style={{ padding: "32px" }}>
        <p style={{ color: "var(--color-danger)" }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "32px" }}>
      <PageHeader
        title="Budget Planning"
        subtitle={`${budgets.length} kategori dianggarkan bulan ini`}
        action={
          <Button onClick={handleOpenAdd}>
            <Plus size={15} /> New Budget
          </Button>
        }
      />

      {(overLimitCount > 0 || nearLimitCount > 0) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 14px",
            borderRadius: "10px",
            background: "#ffb54718",
            border: "1px solid #ffb54744",
            color: "var(--color-warning)",
            fontSize: "13px",
            marginBottom: "20px",
          }}
        >
          <AlertTriangle size={15} />
          <span>
            {overLimitCount > 0 && `${overLimitCount} kategori over budget. `}
            {nearLimitCount > 0 && `${nearLimitCount} kategori mendekati limit.`}
          </span>
        </div>
      )}

      {budgets.length === 0 ? (
        <Card>
          <EmptyState
            icon={<PiggyBank size={36} />}
            title="Belum ada budget bulan ini"
            subtitle="Set limit per kategori buat mulai tracking pengeluaranmu"
          />
        </Card>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "14px",
          }}
        >
          {budgets.map((b) => (
            <BudgetCard
              key={b.id}
              budget={b}
              onEdit={setEditTarget}
              onDelete={handleDelete}
              deleting={deletingId === b.id}
            />
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="New Budget">
        <CreateBudgetForm
          categories={availableCategories}
          onSubmit={handleCreate}
          loading={submitting}
        />
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Budget">
        {editTarget && (
          <EditBudgetForm budget={editTarget} onSubmit={handleUpdate} loading={submitting} />
        )}
      </Modal>
    </div>
  );
}
