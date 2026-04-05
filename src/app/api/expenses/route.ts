import { requireAuth, isNextResponse } from "@/lib/utils/auth-guard";
import { supabaseAdmin } from "@/lib/db";
import { ok, fail } from "@/lib/utils/api";
import { CreateExpenseSchema } from "@/lib/validations/expenses";

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;

  const body: unknown = await request.json();
  const parsed = CreateExpenseSchema.safeParse(body);
  if (!parsed.success) {
    return fail("Validation error", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }

  const { payer_name, total_amount_twd, description, splits } = parsed.data;

  const { data: expense, error } = await supabaseAdmin
    .from("expenses")
    .insert({
      submitted_by_user_id: auth.appUserId,
      payer_name,
      total_amount_twd,
      description,
    })
    .select("id")
    .single();

  if (error || !expense) {
    return fail("Failed to create expense", "DB_ERROR", 500);
  }

  const { error: splitsError } = await supabaseAdmin
    .from("expense_splits")
    .insert(
      splits.map((s) => ({
        expense_id: expense.id,
        participant_name: s.participant_name,
        amount_owed_twd: s.amount_owed_twd,
      }))
    );

  if (splitsError) {
    return fail("Failed to save splits", "DB_ERROR", 500);
  }

  return ok({ id: expense.id }, 201);
}

export async function GET() {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;

  const { data: expenses, error } = await supabaseAdmin
    .from("expenses")
    .select(`
      id, payer_name, total_amount_twd, description, created_at,
      expense_splits(participant_name, amount_owed_twd)
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return fail("Failed to fetch expenses", "DB_ERROR", 500);
  }

  return ok(expenses ?? []);
}
