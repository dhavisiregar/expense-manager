import { SkeletonTable } from "@/components/ui/Skeleton";

export default function IncomeLoading() {
  return (
    <div style={{ padding: "32px" }}>
      <div
        style={{
          height: "26px",
          width: "160px",
          background: "var(--color-surface-2)",
          borderRadius: "6px",
          marginBottom: "8px",
        }}
      />
      <div
        style={{
          height: "14px",
          width: "240px",
          background: "var(--color-surface-2)",
          borderRadius: "6px",
          marginBottom: "28px",
        }}
      />
      <SkeletonTable rows={8} />
    </div>
  );
}
