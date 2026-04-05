import { requireAuth, isNextResponse } from "@/lib/utils/auth-guard";
import { supabaseAdmin } from "@/lib/db";
import { ok, fail } from "@/lib/utils/api";

export type DebtEntry = {
  debtor: string;
  creditor: string;
  amount_twd: number;
};

/**
 * Builds a net-balance map from all expenses.
 * net[A][B] = total A owes B (after netting opposing transactions).
 * Returns a simplified list of {debtor, creditor, amount_twd} where amount > 0.
 */
function computeDebts(
  expenses: Array<{
    payer_name: string;
    expense_splits: Array<{ participant_name: string; amount_owed_twd: number }>;
  }>
): DebtEntry[] {
  // net[debtor][creditor] = amount debtor owes creditor
  const net: Record<string, Record<string, number>> = {};

  function add(debtor: string, creditor: string, amount: number) {
    if (debtor === creditor) return;
    if (!net[debtor]) net[debtor] = {};
    net[debtor][creditor] = (net[debtor][creditor] ?? 0) + amount;
  }

  for (const exp of expenses) {
    for (const split of exp.expense_splits) {
      add(split.participant_name, exp.payer_name, split.amount_owed_twd);
    }
  }

  // Net out A→B and B→A
  const result: DebtEntry[] = [];
  const seen = new Set<string>();

  for (const [debtor, creditors] of Object.entries(net)) {
    for (const [creditor, amount] of Object.entries(creditors)) {
      const key = [debtor, creditor].sort().join("||");
      if (seen.has(key)) continue;
      seen.add(key);

      const forward = net[debtor]?.[creditor] ?? 0;
      const backward = net[creditor]?.[debtor] ?? 0;
      const net_amount = forward - backward;

      if (net_amount > 0) {
        result.push({ debtor, creditor, amount_twd: net_amount });
      } else if (net_amount < 0) {
        result.push({ debtor: creditor, creditor: debtor, amount_twd: -net_amount });
      }
    }
  }

  return result.sort((a, b) => b.amount_twd - a.amount_twd);
}

export async function GET() {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;

  const { data: expenses, error } = await supabaseAdmin
    .from("expenses")
    .select(`
      payer_name,
      expense_splits(participant_name, amount_owed_twd)
    `);

  if (error) {
    return fail("Failed to fetch expenses", "DB_ERROR", 500);
  }

  const debts = computeDebts(expenses ?? []);

  return ok({ debts, total_expenses: expenses?.length ?? 0 });
}
