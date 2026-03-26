export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category_id: string;
  category?: Category;
  tags: string[];
  date: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface CreateExpenseInput {
  title: string;
  amount: number;
  category_id: string;
  tags: string[];
  date: string;
  description: string;
}

export interface UpdateExpenseInput {
  title?: string;
  amount?: number;
  category_id?: string;
  tags?: string[];
  date?: string;
  description?: string;
}

export interface CreateCategoryInput {
  name: string;
  color: string;
  icon: string;
}

export interface CategorySummary {
  category: Category;
  total: number;
  count: number;
  percent: number;
}

export interface MonthlyTrend {
  month: string;
  year: number;
  total: number;
  income: number;
  count: number;
}

export interface DashboardSummary {
  total_expenses: number;
  monthly_expenses: number;
  expense_count: number;
  total_income: number;
  monthly_income: number;
  balance: number;
  monthly_balance: number;
  by_category: CategorySummary[];
  monthly_trend: MonthlyTrend[];
  recent_expenses: Expense[];
}

export interface PaginationMeta {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: PaginationMeta;
}

export interface ExpenseFilter {
  category_id?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
}

export interface Income {
  id: string;
  title: string;
  amount: number;
  source: string;
  date: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface CreateIncomeInput {
  title: string;
  amount: number;
  source: string;
  date: string;
  description: string;
}

export interface UpdateIncomeInput {
  title?: string;
  amount?: number;
  source?: string;
  date?: string;
  description?: string;
}

export interface IncomeFilter {
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
}
