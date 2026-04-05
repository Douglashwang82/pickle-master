import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ExpenseForm from "@/components/expenses/ExpenseForm";
import { BarChart2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ExpPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: appUser } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("auth_provider_user_id", user.id)
    .single();

  // Fetch recent expenses (all, not filtered by submitter — shared view)
  const { data: expenses } = await supabaseAdmin
    .from("expenses")
    .select(`
      id, payer_name, total_amount_twd, description, created_at,
      expense_splits(participant_name, amount_owed_twd)
    `)
    .order("created_at", { ascending: false })
    .limit(30);

  void appUser; // auth check done above via redirect

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Expenses</h1>
          <p className="text-sm text-muted-foreground">Record who paid for the group</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/exp-summary">
            <BarChart2 className="h-4 w-4 mr-1" />
            View summary
          </Link>
        </Button>
      </div>

      <ExpenseForm />

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Recent expenses
        </h2>

        {!expenses || expenses.length === 0 ? (
          <p className="text-sm text-muted-foreground">No expenses yet. Add one above.</p>
        ) : (
          expenses.map((exp) => (
            <Card key={exp.id}>
              <CardContent className="pt-4 pb-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{exp.description}</p>
                    <p className="text-xs text-muted-foreground">
                      Paid by <span className="font-medium text-foreground">{exp.payer_name}</span>
                      {" · "}
                      {format(new Date(exp.created_at), "MMM d, yyyy")}
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 tabular-nums">
                    {exp.total_amount_twd.toLocaleString()} TWD
                  </Badge>
                </div>

                {exp.expense_splits && exp.expense_splits.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {exp.expense_splits.map((split, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 text-xs bg-muted rounded-full px-2 py-0.5"
                      >
                        {split.participant_name}
                        <span className="text-muted-foreground">
                          {split.amount_owed_twd.toLocaleString()}
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
