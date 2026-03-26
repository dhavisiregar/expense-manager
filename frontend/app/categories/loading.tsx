import { SkeletonCard } from "@/components/ui/Skeleton";
export default function CategoriesLoading() {
  return (
    <div style={{ padding: "32px" }}>
      <div
        style={{
          height: "26px",
          width: "200px",
          background: "var(--color-surface-2)",
          borderRadius: "6px",
          marginBottom: "28px",
        }}
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "14px",
        }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
