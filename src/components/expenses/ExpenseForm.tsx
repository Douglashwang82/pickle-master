"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";

type Split = { participant_name: string; amount_owed_twd: string };

export default function ExpenseForm() {
  const router = useRouter();
  const { toast } = useToast();

  const [payer, setPayer] = useState("");
  const [total, setTotal] = useState("");
  const [description, setDescription] = useState("");
  const [splits, setSplits] = useState<Split[]>([
    { participant_name: "", amount_owed_twd: "" },
  ]);
  const [loading, setLoading] = useState(false);

  function addSplit() {
    setSplits((prev) => [...prev, { participant_name: "", amount_owed_twd: "" }]);
  }

  function removeSplit(i: number) {
    setSplits((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateSplit(i: number, field: keyof Split, value: string) {
    setSplits((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s))
    );
  }

  function splitTotal() {
    return splits.reduce((acc, s) => acc + (parseInt(s.amount_owed_twd) || 0), 0);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsedTotal = parseInt(total);
    if (isNaN(parsedTotal) || parsedTotal <= 0) {
      toast({ title: "Total amount must be a positive number", variant: "destructive" });
      return;
    }

    const validSplits = splits.filter(
      (s) => s.participant_name.trim() && parseInt(s.amount_owed_twd) > 0
    );
    if (validSplits.length === 0) {
      toast({ title: "Add at least one participant with an amount", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payer_name: payer.trim(),
          total_amount_twd: parsedTotal,
          description: description.trim(),
          splits: validSplits.map((s) => ({
            participant_name: s.participant_name.trim(),
            amount_owed_twd: parseInt(s.amount_owed_twd),
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to save");
      }

      toast({ title: "Expense recorded!" });
      setPayer("");
      setTotal("");
      setDescription("");
      setSplits([{ participant_name: "", amount_owed_twd: "" }]);
      router.refresh();
    } catch (err: unknown) {
      toast({
        title: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const splitSum = splitTotal();
  const parsedTotal = parseInt(total) || 0;
  const diff = parsedTotal - splitSum;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">New Expense</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="payer">Paid by</Label>
              <Input
                id="payer"
                placeholder="e.g. Alice"
                value={payer}
                onChange={(e) => setPayer(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="total">Total (TWD)</Label>
              <Input
                id="total"
                type="number"
                min={1}
                placeholder="e.g. 600"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="desc">Description</Label>
            <Input
              id="desc"
              placeholder="e.g. Court fees, Dinner after game"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Who owes how much?</Label>
              <Button type="button" variant="ghost" size="sm" onClick={addSplit}>
                <Plus className="h-4 w-4 mr-1" />
                Add person
              </Button>
            </div>

            {splits.map((split, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input
                  placeholder="Name"
                  value={split.participant_name}
                  onChange={(e) => updateSplit(i, "participant_name", e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  min={1}
                  placeholder="TWD"
                  value={split.amount_owed_twd}
                  onChange={(e) => updateSplit(i, "amount_owed_twd", e.target.value)}
                  className="w-28"
                />
                {splits.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSplit(i)}
                    className="shrink-0"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
            ))}

            {parsedTotal > 0 && (
              <p className={`text-xs ${diff === 0 ? "text-green-600" : "text-amber-600"}`}>
                Split total: {splitSum} TWD
                {diff !== 0 && ` (${diff > 0 ? `${diff} unassigned` : `${-diff} over by`})`}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving…" : "Record expense"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
