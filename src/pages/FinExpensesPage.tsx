import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Save, Plus, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import { downloadTablePdf } from "@/lib/pdf";

const CATEGORIES = [
  "Milk", "Auto", "Tea", "Water", "Petrol", "Gate", "Diesel",
  "Packing", "Cup/Tape", "Poojai", "A4 Sheet", "Lemon", "Salary", "Other",
];

interface Expense {
  id?: string;
  date: string;
  category: string;
  amount: number;
  other: string;
}

const FinExpensesPage = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [category, setCategory] = useState("Other");
  const [amount, setAmount] = useState<number>(0);
  const [other, setOther] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchExpenses = async () => {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("date", selectedDate)
      .order("created_at", { ascending: true });
    if (error) { toast.error(error.message); return; }
    setExpenses(data || []);
  };

  useEffect(() => { fetchExpenses(); }, [selectedDate]);

  const handleAdd = async () => {
    if (amount <= 0) { toast.error("Enter a valid amount"); return; }
    setLoading(true);
    const { error } = await supabase.from("expenses").insert({
      date: selectedDate, category, amount, other: other || null,
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Expense added");
    setAmount(0); setOther("");
    fetchExpenses();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("expenses").delete().eq("id", id);
    fetchExpenses();
  };

  const dailyTotal = expenses.reduce((s, e) => s + Number(e.amount), 0);

  const categorySummary = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + Number(e.amount);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  const downloadPdf = () => {
    const rows = expenses.map((e) => [
      e.category, `₹${Number(e.amount).toLocaleString()}`, e.other || "-",
    ]);
    downloadTablePdf({
      title: "Expense Report",
      subtitle: selectedDate,
      headers: ["Category", "Amount", "Notes"],
      rows,
      filename: `expenses-${selectedDate}.pdf`,
      footerRow: ["Total", `₹${dailyTotal.toLocaleString()}`, ""],
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-header">Expense Management</h1>
          <p className="text-muted-foreground mt-1">Track daily expenses by category</p>
        </div>
        <div className="flex items-center gap-2">
          <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-auto" />
          <Button variant="outline" size="sm" onClick={downloadPdf} className="gap-1">
            <Download className="h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      {/* Add form */}
      <Card className="p-5">
        <h2 className="font-display text-lg font-semibold mb-4">Add Expense</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Amount ₹</label>
            <Input type="number" min={0} value={amount || ""} onChange={(e) => setAmount(Number(e.target.value))} className="w-28" placeholder="0" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Notes (optional)</label>
            <Input value={other} onChange={(e) => setOther(e.target.value)} className="w-40" placeholder="Details..." />
          </div>
          <Button onClick={handleAdd} disabled={loading} className="gap-1">
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
      </Card>

      {/* Daily total */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="stat-card border-primary/30">
          <p className="text-sm text-muted-foreground">Daily Total</p>
          <p className="text-2xl font-bold font-display mt-1 text-primary">₹{dailyTotal.toLocaleString()}</p>
        </div>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-2">Category Summary</p>
          <div className="space-y-1">
            {categorySummary.map(([cat, total]) => (
              <div key={cat} className="flex justify-between text-sm">
                <span>{cat}</span>
                <span className="font-semibold">₹{total.toLocaleString()}</span>
              </div>
            ))}
            {categorySummary.length === 0 && <p className="text-xs text-muted-foreground">No expenses</p>}
          </div>
        </Card>
      </div>

      {/* Expenses table */}
      <Card className="p-5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">{e.category}</TableCell>
                <TableCell className="text-right">₹{Number(e.amount).toLocaleString()}</TableCell>
                <TableCell className="text-muted-foreground">{e.other || "-"}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(e.id!)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {expenses.length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No expenses for this date</TableCell></TableRow>
            )}
          </TableBody>
          {expenses.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell className="font-bold">Total</TableCell>
                <TableCell className="text-right font-bold">₹{dailyTotal.toLocaleString()}</TableCell>
                <TableCell colSpan={2}></TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </Card>
    </div>
  );
};

export default FinExpensesPage;
