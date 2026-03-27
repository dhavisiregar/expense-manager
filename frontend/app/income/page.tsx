import { getIncomes } from "@/lib/api";
import { IncomeClient } from "./IncomeClient";

export default async function IncomePage() {
  let incomes: any[] = [];
  let meta: any = null;
  try {
    const res = await getIncomes({ page: 1, page_size: 20 });
    incomes = res.data || [];
    meta = res.meta;
  } catch {}

  return <IncomeClient initialIncomes={[]} initialMeta={null} />;
}
