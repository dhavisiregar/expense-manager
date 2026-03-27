import { getDashboard } from "@/lib/api";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  let summary = null;
  try {
    const res = await getDashboard();
    summary = res.data;
  } catch {
    // Will show empty state
  }

  return <DashboardClient summary={null} />;
}
