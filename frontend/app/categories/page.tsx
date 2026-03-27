import { getCategories } from "@/lib/api";
import { CategoriesClient } from "./CategoriesClient";

export default async function CategoriesPage() {
  let categories: any[] = [];
  try {
    const res = await getCategories();
    categories = res.data || [];
  } catch {}

  return <CategoriesClient initialCategories={[]} />;
}
