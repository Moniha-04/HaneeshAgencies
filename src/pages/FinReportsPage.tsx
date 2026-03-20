import { useState, useEffect, useMemo } from "react";
import { format, startOfMonth, endOfMonth, getDaysInMonth } from "date-fns";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter,
} from "@/components/ui/table";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { downloadTablePdf } from "@/lib/pdf";

const FinReportsPage = () => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [dayExpenses, setDayExpenses] = useState<any[]>([]);
  const [daySales, setDaySales] = useState<any[]>([]);
  const [dayBank, setDayBank] = useState<any[]>([]);
  const [monthExpenses, setMonthExpenses] = useState<any[]>([]);
  const [monthSales, setMonthSales] = useState<any[]>([]);
  const [monthBank, setMonthBank] = useState<any[]>([]);

  // Fetch day data
  useEffect(() => {
    const fetch = async () => {
      const [e, s, b] = await Promise.all([
        supabase.from("expenses").select("*").eq("date", selectedDate),
        supabase.from("sales").select("*").eq("date", selectedDate),
        supabase.from("bank_transactions").select("*").eq("date", selectedDate),
      ]);
      setDayExpenses(e.data || []);
      setDaySales(s.data || []);
      setDayBank(b.data || []);
    };
    fetch();
  }, [selectedDate]);

  // Fetch month data
  useEffect(() => {
    const fetch = async () => {
      const from = `${selectedMonth}-01`;
      const to = `${selectedMonth}-${getDaysInMonth(new Date(selectedMonth + "-01"))}`;
      const [e, s, b] = await Promise.all([
        supabase.from("expenses").select("*").gte("date", from).lte("date", to),
        supabase.from("sales").select("*").gte("date", from).lte("date", to),
        supabase.from("bank_transactions").select("*").gte("date", from).lte("date", to),
      ]);
      setMonthExpenses(e.data || []);
      setMonthSales(s.data || []);
      setMonthBank(b.data || []);
    };
    fetch();
  }, [selectedMonth]);

  const sum = (arr: any[], key: string) => arr.reduce((s, r) => s + Number(r[key] || 0), 0);

  const downloadDayPdf = () => {
    const totalDebited = sum(dayBank, "cash_debited") + sum(daySales, "cash_debited");
    const totalDeposited = sum(dayBank, "cash_deposited") + sum(daySales, "cash_deposited");
    const rows = [
      ["--- EXPENSES ---", "", ""],
      ...dayExpenses.map((e: any) => [e.category, `₹${Number(e.amount).toLocaleString()}`, e.other || ""]),
      ["Expense Total", `₹${sum(dayExpenses, "amount").toLocaleString()}`, ""],
      ["", "", ""],
      ["--- SALES ---", "", ""],
      ...daySales.map((s: any) => [s.product_name, `₹${Number(s.amount).toLocaleString()}`, `Qty: ${s.quantity}`]),
      ["Sales Total", `₹${sum(daySales, "amount").toLocaleString()}`, ""],
      ["", "", ""],
      ["--- BANK ---", "", ""],
      ...dayBank.map((t: any) => [t.bank_name, `Deb: ₹${Number(t.cash_debited).toLocaleString()}`, `Dep: ₹${Number(t.cash_deposited).toLocaleString()}`]),
    ];
    downloadTablePdf({
      title: "Daily Report",
      subtitle: `Date: ${selectedDate}\nTotal Cash Debited: ₹${totalDebited.toLocaleString()}  |  Total Cash Deposited: ₹${totalDeposited.toLocaleString()}`,
      headers: ["Item", "Amount", "Details"],
      rows,
      filename: `daily-report-${selectedDate}.pdf`,
    });
  };

  const downloadMonthPdf = () => {
    const totalDebited = sum(monthBank, "cash_debited") + sum(monthSales, "cash_debited");
    const totalDeposited = sum(monthBank, "cash_deposited") + sum(monthSales, "cash_deposited");
    const catMap: Record<string, number> = {};
    monthExpenses.forEach((e: any) => { catMap[e.category] = (catMap[e.category] || 0) + Number(e.amount); });
    const rows = [
      ["--- EXPENSES BY CATEGORY ---", "", ""],
      ...Object.entries(catMap).map(([cat, amt]) => [cat, `₹${amt.toLocaleString()}`, ""]),
      ["Expense Total", `₹${sum(monthExpenses, "amount").toLocaleString()}`, ""],
      ["", "", ""],
      ["--- BANK SUMMARY ---", "", ""],
      ["Indian Bank Debited", `₹${sum(monthBank.filter((t: any) => t.bank_name === "Indian Bank"), "cash_debited").toLocaleString()}`, ""],
      ["Indian Bank Deposited", `₹${sum(monthBank.filter((t: any) => t.bank_name === "Indian Bank"), "cash_deposited").toLocaleString()}`, ""],
      ["HDFC Bank Debited", `₹${sum(monthBank.filter((t: any) => t.bank_name === "HDFC Bank"), "cash_debited").toLocaleString()}`, ""],
      ["HDFC Bank Deposited", `₹${sum(monthBank.filter((t: any) => t.bank_name === "HDFC Bank"), "cash_deposited").toLocaleString()}`, ""],
      ["", "", ""],
      ["--- SALES ---", "", ""],
      ["Total Sales Amount", `₹${sum(monthSales, "amount").toLocaleString()}`, ""],
      ["Sales Cash Debited", `₹${sum(monthSales, "cash_debited").toLocaleString()}`, ""],
      ["Sales Cash Deposited", `₹${sum(monthSales, "cash_deposited").toLocaleString()}`, ""],
    ];
    downloadTablePdf({
      title: "Monthly Report",
      subtitle: `Month: ${selectedMonth}\nTotal Cash Debited: ₹${totalDebited.toLocaleString()}  |  Total Cash Deposited: ₹${totalDeposited.toLocaleString()}`,
      headers: ["Item", "Amount", "Details"],
      rows,
      filename: `monthly-report-${selectedMonth}.pdf`,
    });
  };

  // Day tab content helper
  const DayContent = () => {
    const tExp = sum(dayExpenses, "amount");
    const tSalesAmt = sum(daySales, "amount");
    const tBankDeb = sum(dayBank, "cash_debited");
    const tBankDep = sum(dayBank, "cash_deposited");
    const tSalesDeb = sum(daySales, "cash_debited");
    const tSalesDep = sum(daySales, "cash_deposited");

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-end gap-3">
          <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-auto" />
          <Button variant="outline" size="sm" onClick={downloadDayPdf} className="gap-1"><Download className="h-4 w-4" /> PDF</Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="stat-card"><p className="text-xs text-muted-foreground">Expenses</p><p className="text-lg font-bold font-display">₹{tExp.toLocaleString()}</p></div>
          <div className="stat-card"><p className="text-xs text-muted-foreground">Sales</p><p className="text-lg font-bold font-display">₹{tSalesAmt.toLocaleString()}</p></div>
          <div className="stat-card"><p className="text-xs text-muted-foreground">Total Debited</p><p className="text-lg font-bold font-display text-destructive">₹{(tBankDeb + tSalesDeb).toLocaleString()}</p></div>
          <div className="stat-card"><p className="text-xs text-muted-foreground">Total Deposited</p><p className="text-lg font-bold font-display text-success">₹{(tBankDep + tSalesDep).toLocaleString()}</p></div>
        </div>
        {dayExpenses.length > 0 && (
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Expenses</h3>
            <Table><TableHeader><TableRow><TableHead>Category</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
              <TableBody>{dayExpenses.map((e: any) => (<TableRow key={e.id}><TableCell>{e.category}</TableCell><TableCell className="text-right">₹{Number(e.amount).toLocaleString()}</TableCell></TableRow>))}</TableBody>
              <TableFooter><TableRow><TableCell className="font-bold">Total</TableCell><TableCell className="text-right font-bold">₹{tExp.toLocaleString()}</TableCell></TableRow></TableFooter>
            </Table>
          </Card>
        )}
        {dayBank.length > 0 && (
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Bank Transactions</h3>
            <Table><TableHeader><TableRow><TableHead>Bank</TableHead><TableHead className="text-right">Debited</TableHead><TableHead className="text-right">Deposited</TableHead></TableRow></TableHeader>
              <TableBody>{dayBank.map((t: any) => (<TableRow key={t.id}><TableCell>{t.bank_name}</TableCell><TableCell className="text-right text-destructive">₹{Number(t.cash_debited).toLocaleString()}</TableCell><TableCell className="text-right text-success">₹{Number(t.cash_deposited).toLocaleString()}</TableCell></TableRow>))}</TableBody>
            </Table>
          </Card>
        )}
        {daySales.length > 0 && (
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Sales</h3>
            <Table><TableHeader><TableRow><TableHead>Product</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
              <TableBody>{daySales.map((s: any) => (<TableRow key={s.id}><TableCell>{s.product_name}</TableCell><TableCell className="text-right">{s.quantity}</TableCell><TableCell className="text-right">₹{Number(s.amount).toLocaleString()}</TableCell></TableRow>))}</TableBody>
            </Table>
          </Card>
        )}
      </div>
    );
  };

  // Month tab content helper
  const MonthContent = () => {
    const tExp = sum(monthExpenses, "amount");
    const tBankDeb = sum(monthBank, "cash_debited");
    const tBankDep = sum(monthBank, "cash_deposited");
    const tSalesDeb = sum(monthSales, "cash_debited");
    const tSalesDep = sum(monthSales, "cash_deposited");
    const catMap: Record<string, number> = {};
    monthExpenses.forEach((e: any) => { catMap[e.category] = (catMap[e.category] || 0) + Number(e.amount); });
    const indianDeb = sum(monthBank.filter((t: any) => t.bank_name === "Indian Bank"), "cash_debited");
    const indianDep = sum(monthBank.filter((t: any) => t.bank_name === "Indian Bank"), "cash_deposited");
    const hdfcDeb = sum(monthBank.filter((t: any) => t.bank_name === "HDFC Bank"), "cash_debited");
    const hdfcDep = sum(monthBank.filter((t: any) => t.bank_name === "HDFC Bank"), "cash_deposited");

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-end gap-3">
          <Input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-auto" />
          <Button variant="outline" size="sm" onClick={downloadMonthPdf} className="gap-1"><Download className="h-4 w-4" /> PDF</Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="stat-card"><p className="text-xs text-muted-foreground">Month Expenses</p><p className="text-lg font-bold font-display">₹{tExp.toLocaleString()}</p></div>
          <div className="stat-card"><p className="text-xs text-muted-foreground">Month Sales</p><p className="text-lg font-bold font-display">₹{sum(monthSales, "amount").toLocaleString()}</p></div>
          <div className="stat-card"><p className="text-xs text-muted-foreground">Total Debited</p><p className="text-lg font-bold font-display text-destructive">₹{(tBankDeb + tSalesDeb).toLocaleString()}</p></div>
          <div className="stat-card"><p className="text-xs text-muted-foreground">Total Deposited</p><p className="text-lg font-bold font-display text-success">₹{(tBankDep + tSalesDep).toLocaleString()}</p></div>
        </div>
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Expense by Category</h3>
          <div className="space-y-1">
            {Object.entries(catMap).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
              <div key={cat} className="flex justify-between text-sm"><span>{cat}</span><span className="font-semibold">₹{amt.toLocaleString()}</span></div>
            ))}
            {Object.keys(catMap).length === 0 && <p className="text-sm text-muted-foreground">No expenses</p>}
          </div>
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Bank-wise Summary</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="font-medium text-sm">Indian Bank</p>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Debited</span><span className="text-destructive font-semibold">₹{indianDeb.toLocaleString()}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Deposited</span><span className="text-success font-semibold">₹{indianDep.toLocaleString()}</span></div>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-sm">HDFC Bank</p>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Debited</span><span className="text-destructive font-semibold">₹{hdfcDeb.toLocaleString()}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Deposited</span><span className="text-success font-semibold">₹{hdfcDep.toLocaleString()}</span></div>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="page-header">Financial Reports</h1>
      <p className="text-muted-foreground">Day-wise and month-wise reports with PDF export</p>

      <Tabs defaultValue="day">
        <TabsList>
          <TabsTrigger value="day">Day Report</TabsTrigger>
          <TabsTrigger value="month">Month Report</TabsTrigger>
        </TabsList>
        <TabsContent value="day" className="mt-4"><DayContent /></TabsContent>
        <TabsContent value="month" className="mt-4"><MonthContent /></TabsContent>
      </Tabs>
    </div>
  );
};

export default FinReportsPage;
