import { useState, useEffect } from "react";
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
import { Plus, Trash2, Download, Landmark } from "lucide-react";
import { toast } from "sonner";
import { downloadTablePdf } from "@/lib/pdf";

const BANKS = ["Indian Bank", "HDFC Bank"] as const;

interface BankTransaction {
  id?: string;
  date: string;
  bank_name: string;
  cash_debited: number;
  cash_deposited: number;
}

const BankTransactionsPage = () => {
  const [txns, setTxns] = useState<BankTransaction[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [bankName, setBankName] = useState<string>("Indian Bank");
  const [cashDebited, setCashDebited] = useState<number>(0);
  const [cashDeposited, setCashDeposited] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const fetchTxns = async () => {
    const { data, error } = await supabase
      .from("bank_transactions")
      .select("*")
      .eq("date", selectedDate)
      .order("created_at", { ascending: true });
    if (error) { toast.error(error.message); return; }
    setTxns(data || []);
  };

  useEffect(() => { fetchTxns(); }, [selectedDate]);

  const handleAdd = async () => {
    if (cashDebited <= 0 && cashDeposited <= 0) { toast.error("Enter debit or deposit amount"); return; }
    setLoading(true);
    const { error } = await supabase.from("bank_transactions").insert({
      date: selectedDate, bank_name: bankName, cash_debited: cashDebited, cash_deposited: cashDeposited,
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Transaction added");
    setCashDebited(0); setCashDeposited(0);
    fetchTxns();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("bank_transactions").delete().eq("id", id);
    fetchTxns();
  };

  const bankTotals = (bank: string) => {
    const filtered = txns.filter((t) => t.bank_name === bank);
    return {
      debited: filtered.reduce((s, t) => s + Number(t.cash_debited), 0),
      deposited: filtered.reduce((s, t) => s + Number(t.cash_deposited), 0),
    };
  };

  const indianBank = bankTotals("Indian Bank");
  const hdfcBank = bankTotals("HDFC Bank");
  const totalDebited = indianBank.debited + hdfcBank.debited;
  const totalDeposited = indianBank.deposited + hdfcBank.deposited;

  const downloadPdf = () => {
    const rows = txns.map((t) => [
      t.bank_name, `₹${Number(t.cash_debited).toLocaleString()}`, `₹${Number(t.cash_deposited).toLocaleString()}`,
    ]);
    downloadTablePdf({
      title: "Bank Transactions",
      subtitle: `Date: ${selectedDate}\nTotal Debited: ₹${totalDebited.toLocaleString()}  |  Total Deposited: ₹${totalDeposited.toLocaleString()}`,
      headers: ["Bank", "Cash Debited", "Cash Deposited"],
      rows,
      filename: `bank-txns-${selectedDate}.pdf`,
      footerRow: ["Total", `₹${totalDebited.toLocaleString()}`, `₹${totalDeposited.toLocaleString()}`],
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-header">Bank Transactions</h1>
          <p className="text-muted-foreground mt-1">Track cash flow for Indian Bank & HDFC Bank</p>
        </div>
        <div className="flex items-center gap-2">
          <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-auto" />
          <Button variant="outline" size="sm" onClick={downloadPdf} className="gap-1">
            <Download className="h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      {/* Bank summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Landmark className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium">Indian Bank</p>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Debited:</span>
            <span className="font-semibold text-destructive">₹{indianBank.debited.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Deposited:</span>
            <span className="font-semibold text-success">₹{indianBank.deposited.toLocaleString()}</span>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Landmark className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium">HDFC Bank</p>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Debited:</span>
            <span className="font-semibold text-destructive">₹{hdfcBank.debited.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Deposited:</span>
            <span className="font-semibold text-success">₹{hdfcBank.deposited.toLocaleString()}</span>
          </div>
        </Card>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Total Debited</p>
          <p className="text-2xl font-bold font-display mt-1 text-destructive">₹{totalDebited.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Total Deposited</p>
          <p className="text-2xl font-bold font-display mt-1 text-success">₹{totalDeposited.toLocaleString()}</p>
        </div>
      </div>

      {/* Add form */}
      <Card className="p-5">
        <h2 className="font-display text-lg font-semibold mb-4">Add Transaction</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Bank</label>
            <Select value={bankName} onValueChange={setBankName}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {BANKS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Cash Debited ₹</label>
            <Input type="number" min={0} value={cashDebited || ""} onChange={(e) => setCashDebited(Number(e.target.value))} className="w-28" placeholder="0" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Cash Deposited ₹</label>
            <Input type="number" min={0} value={cashDeposited || ""} onChange={(e) => setCashDeposited(Number(e.target.value))} className="w-28" placeholder="0" />
          </div>
          <Button onClick={handleAdd} disabled={loading} className="gap-1">
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card className="p-5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bank</TableHead>
              <TableHead className="text-right">Cash Debited</TableHead>
              <TableHead className="text-right">Cash Deposited</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {txns.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.bank_name}</TableCell>
                <TableCell className="text-right text-destructive">₹{Number(t.cash_debited).toLocaleString()}</TableCell>
                <TableCell className="text-right text-success">₹{Number(t.cash_deposited).toLocaleString()}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id!)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {txns.length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No transactions for this date</TableCell></TableRow>
            )}
          </TableBody>
          {txns.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell className="font-bold">Total</TableCell>
                <TableCell className="text-right font-bold text-destructive">₹{totalDebited.toLocaleString()}</TableCell>
                <TableCell className="text-right font-bold text-success">₹{totalDeposited.toLocaleString()}</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </Card>
    </div>
  );
};

export default BankTransactionsPage;
