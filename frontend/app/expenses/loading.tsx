import { SkeletonTable } from "@/components/ui/Skeleton";
export default function ExpensesLoading() {
  return (
    <div style={{ padding: "32px" }}>
      <div
        style={{
          height: "26px",
          width: "180px",
          background: "var(--color-surface-2)",
          borderRadius: "6px",
          marginBottom: "8px",
        }}
      />
      <div
        style={{
          height: "14px",
          width: "260px",
          background: "var(--color-surface-2)",
          borderRadius: "6px",
          marginBottom: "28px",
        }}
      />
      <SkeletonTable rows={8} />
    </div>
  );
}
