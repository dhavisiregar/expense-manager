import { getExpenses, getCategories } from "@/lib/api";
import { ExpensesClient } from "./ExpensesClient";

export default async function ExpensesPage() {
  let expenses: any[] = [];
  let categories: any[] = [];
  let meta: any = null;

  try {
    const [expRes, catRes] = await Promise.all([
      getExpenses({ page: 1, page_size: 20 }),
      getCategories(),
    ]);
    expenses = expRes.data || [];
    categories = catRes.data || [];
    meta = expRes.meta;
  } catch {
    // fallback to empty
  }

  return (
    <ExpensesClient
      initialExpenses={expenses}
      categories={categories}
      initialMeta={meta}
    />
  );
}
