"use client";

import { useState, useTransition, useEffect } from "react";
import { Category, CreateCategoryInput } from "@/types";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "@/lib/api";
import {
  Button,
  Card,
  Input,
  Modal,
  PageHeader,
  EmptyState,
  Spinner,
  Badge,
} from "@/components/ui";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { successAlert, errorAlert, confirmDelete } from "@/lib/alert";

const PRESET_COLORS = [
  "#7c6aff",
  "#f59e0b",
  "#3b82f6",
  "#ec4899",
  "#10b981",
  "#f97316",
  "#06b6d4",
  "#64748b",
  "#22d3a0",
  "#ff5c7c",
];

const PRESET_ICONS = [
  "🍔",
  "🚗",
  "🛍️",
  "🎬",
  "❤️",
  "🏠",
  "✈️",
  "📚",
  "⚡",
  "📦",
  "💊",
  "☕",
  "🎮",
  "💼",
  "🎵",
  "🐾",
  "🌿",
  "💡",
  "🔧",
  "💰",
];

function CategoryForm({
  initial,
  onSubmit,
  loading,
}: {
  initial?: Partial<Category>;
  onSubmit: (data: CreateCategoryInput) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<CreateCategoryInput>({
    name: initial?.name || "",
    color: initial?.color || PRESET_COLORS[0],
    icon: initial?.icon || PRESET_ICONS[0],
  });
  const [nameError, setNameError] = useState("");

  const handleSubmit = () => {
    if (!form.name.trim()) {
      setNameError("Category name is required");
      return;
    }
    setNameError("");
    onSubmit(form);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Input
        label="Category Name *"
        value={form.name}
        onChange={(e) => {
          setForm((f) => ({ ...f, name: e.target.value }));
          setNameError("");
        }}
        placeholder="e.g. Food & Dining"
        error={nameError}
      />

      {/* Icon picker */}
      <div>
        <label
          style={{
            fontSize: "13px",
            color: "var(--color-text-muted)",
            fontWeight: 500,
            display: "block",
            marginBottom: "8px",
          }}
        >
          Icon
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {PRESET_ICONS.map((icon) => (
            <button
              key={icon}
              onClick={() => setForm((f) => ({ ...f, icon }))}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                border: `2px solid ${form.icon === icon ? "var(--color-accent)" : "var(--color-border)"}`,
                background:
                  form.icon === icon
                    ? "var(--color-accent-dim)"
                    : "var(--color-surface-2)",
                cursor: "pointer",
                fontSize: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.1s",
              }}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* Color picker */}
      <div>
        <label
          style={{
            fontSize: "13px",
            color: "var(--color-text-muted)",
            fontWeight: 500,
            display: "block",
            marginBottom: "8px",
          }}
        >
          Color
        </label>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            alignItems: "center",
          }}
        >
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => setForm((f) => ({ ...f, color }))}
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: color,
                border:
                  form.color === color
                    ? "3px solid white"
                    : "3px solid transparent",
                cursor: "pointer",
                outline: form.color === color ? `2px solid ${color}` : "none",
                transition: "all 0.12s",
              }}
            />
          ))}
          <input
            type="color"
            value={form.color}
            onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
            title="Custom color"
          />
        </div>
      </div>

      {/* Preview */}
      <div
        style={{
          padding: "12px 14px",
          background: "var(--color-surface-2)",
          borderRadius: "8px",
          border: "1px solid var(--color-border)",
        }}
      >
        <p
          style={{
            margin: "0 0 8px",
            fontSize: "11px",
            color: "var(--color-text-muted)",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Preview
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: `${form.color}22`,
              border: `1px solid ${form.color}44`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CategoryIcon icon={form.icon} size={20} />
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 600, fontSize: "14px" }}>
              {form.name || "Category Name"}
            </p>
            <Badge color={form.color} style={{ marginTop: "4px" }}>
              <CategoryIcon icon={form.icon} size={11} />{" "}
              {form.name || "Preview"}
            </Badge>
          </div>
        </div>
      </div>

      <Button onClick={handleSubmit} loading={loading}>
        {initial?.id ? "Save Changes" : "Create Category"}
      </Button>
    </div>
  );
}

export function CategoriesClient({
  initialCategories,
}: {
  initialCategories: Category[];
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Fetch on mount — client-side so JWT is available
  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.data || []))
      .catch(() => errorAlert("Failed to load categories"))
      .finally(() => setLoading(false));
  }, []);

  const refresh = () => {
    startTransition(async () => {
      try {
        const res = await getCategories();
        setCategories(res.data || []);
      } catch {
        errorAlert("Failed to refresh categories");
      }
    });
  };

  const handleCreate = async (input: CreateCategoryInput) => {
    setSubmitting(true);
    try {
      await createCategory(input);
      setShowAdd(false);
      await successAlert(`Category "${input.name}" created`);
      refresh();
    } catch (e: any) {
      errorAlert(e.message || "Failed to create category");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (input: CreateCategoryInput) => {
    if (!editTarget) return;
    setSubmitting(true);
    try {
      await updateCategory(editTarget.id, input);
      setEditTarget(null);
      await successAlert("Category updated");
      refresh();
    } catch (e: any) {
      errorAlert(e.message || "Failed to update category");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const result = await confirmDelete(
      `Delete "${name}"? Expenses using this category will be affected.`,
    );
    if (!result.isConfirmed) return;
    setDeletingId(id);
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      successAlert(`Category "${name}" deleted`);
    } catch (e: any) {
      errorAlert(e.message || "Failed to delete category");
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

  return (
    <div style={{ padding: "32px" }}>
      <PageHeader
        title="Categories"
        subtitle={`${categories.length} ${categories.length === 1 ? "category" : "categories"}`}
        action={
          <Button onClick={() => setShowAdd(true)}>
            <Plus size={15} /> New Category
          </Button>
        }
      />

      {isPending ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "14px",
          }}
        >
          {Array.from({ length: categories.length || 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: "130px",
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "12px",
                opacity: 0.5,
              }}
            />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Tag size={36} />}
            title="No categories yet"
            subtitle="Create a category to start organizing your expenses"
          />
        </Card>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "14px",
          }}
        >
          {categories.map((cat) => (
            <Card
              key={cat.id}
              style={{
                opacity: deletingId === cat.id ? 0.4 : 1,
                transition: "opacity 0.2s",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "14px",
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    background: `${cat.color}22`,
                    border: `1px solid ${cat.color}33`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CategoryIcon icon={cat.icon} size={22} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontWeight: 600,
                      fontSize: "14px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {cat.name}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      marginTop: "4px",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        width: "9px",
                        height: "9px",
                        borderRadius: "50%",
                        background: cat.color,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--color-text-muted)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {cat.color}
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditTarget(cat)}
                  style={{ flex: 1 }}
                >
                  <Pencil size={12} /> Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(cat.id, cat.name)}
                  loading={deletingId === cat.id}
                  style={{ padding: "6px 10px" }}
                >
                  <Trash2 size={12} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="New Category"
      >
        <CategoryForm onSubmit={handleCreate} loading={submitting} />
      </Modal>

      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit Category"
      >
        {editTarget && (
          <CategoryForm
            initial={editTarget}
            onSubmit={handleUpdate}
            loading={submitting}
          />
        )}
      </Modal>
    </div>
  );
}
