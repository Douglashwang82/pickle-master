import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, PlusCircle, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

type Expense = {
  payer_name: string;
  expense_splits: Array<{ participant_name: string; amount_owed_twd: number }>;
};

type DebtEntry = { debtor: string; creditor: string; amount_twd: number };

function computeDebts(expenses: Expense[]): DebtEntry[] {
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

  const result: DebtEntry[] = [];
  const seen = new Set<string>();

  for (const [debtor, creditors] of Object.entries(net)) {
    for (const creditor of Object.keys(creditors)) {
      const key = [debtor, creditor].sort().join("||");
      if (seen.has(key)) continue;
      seen.add(key);

      const forward = net[debtor]?.[creditor] ?? 0;
      const backward = net[creditor]?.[debtor] ?? 0;
      const netAmount = forward - backward;

      if (netAmount > 0) {
        result.push({ debtor, creditor, amount_twd: netAmount });
      } else if (netAmount < 0) {
        result.push({ debtor: creditor, creditor: debtor, amount_twd: -netAmount });
      }
    }
  }

  return result.sort((a, b) => b.amount_twd - a.amount_twd);
}

function buildPersonTotals(
  expenses: Expense[]
): Array<{ name: string; paid: number; owes: number; net: number }> {
  const paid: Record<string, number> = {};
  const owes: Record<string, number> = {};

  for (const exp of expenses) {
    paid[exp.payer_name] = (paid[exp.payer_name] ?? 0) + exp.expense_splits.reduce(
      (sum, s) => sum + s.amount_owed_twd,
      0
    );
    for (const split of exp.expense_splits) {
      owes[split.participant_name] =
        (owes[split.participant_name] ?? 0) + split.amount_owed_twd;
    }
  }

  const names = new Set([...Object.keys(paid), ...Object.keys(owes)]);
  return Array.from(names)
    .map((name) => ({
      name,
      paid: paid[name] ?? 0,
      owes: owes[name] ?? 0,
      net: (paid[name] ?? 0) - (owes[name] ?? 0),
    }))
    .sort((a, b) => b.net - a.net);
}

export default async function ExpSummaryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: expenses } = await supabaseAdmin
    .from("expenses")
    .select(`
      payer_name,
      expense_splits(participant_name, amount_owed_twd)
    `);

  const allExpenses = (expenses ?? []) as Expense[];
  const debts = computeDebts(allExpenses);
  const personTotals = buildPersonTotals(allExpenses);
  const totalSpend = allExpenses.reduce((sum, e) =>
    sum + e.expense_splits.reduce((s, sp) => s + sp.amount_owed_twd, 0), 0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Expense Summary</h1>
          <p className="text-sm text-muted-foreground">
            {allExpenses.length} expense{allExpenses.length !== 1 ? "s" : ""} ·{" "}
            {totalSpend.toLocaleString()} TWD total tracked
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/exp">
            <PlusCircle className="h-4 w-4 mr-1" />
            Add expense
          </Link>
        </Button>
      </div>

      {/* Who owes who */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Settle up</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {debts.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              All settled — no outstanding debts.
            </div>
          ) : (
            debts.map((d, i) => (
              <div
                key={i}
                className="flex items-center gap-2 py-2 border-b last:border-0"
              >
                <span className="font-medium text-sm">{d.debtor}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-medium text-sm">{d.creditor}</span>
                <Badge className="ml-auto tabular-nums">
                  {d.amount_twd.toLocaleString()} TWD
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Per-person breakdown */}
      {personTotals.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Per-person breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {personTotals.map((p) => (
                <div key={p.name} className="py-2.5 flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Paid {p.paid.toLocaleString()} · Owes {p.owes.toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-semibold tabular-nums ${
                      p.net > 0
                        ? "text-green-600"
                        : p.net < 0
                        ? "text-red-500"
                        : "text-muted-foreground"
                    }`}
                  >
                    {p.net > 0 ? "+" : ""}
                    {p.net.toLocaleString()} TWD
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              + net means others owe you · − net means you owe others
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
