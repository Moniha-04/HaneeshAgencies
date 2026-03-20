import { useState, useEffect } from "react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const CalendarPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [expenses, setExpenses] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [bankTxns, setBankTxns] = useState<any[]>([]);

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  useEffect(() => {
    const fetch = async () => {
      const [e, s, b] = await Promise.all([
        supabase.from("expenses").select("*").eq("date", dateStr).order("created_at"),
        supabase.from("sales").select("*").eq("date", dateStr).order("created_at"),
        supabase.from("bank_transactions").select("*").eq("date", dateStr).order("created_at"),
      ]);
      setExpenses(e.data || []);
      setSales(s.data || []);
      setBankTxns(b.data || []);
    };
    fetch();
  }, [dateStr]);

  const totalExp = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalSalesAmt = sales.reduce((s, e) => s + Number(e.amount), 0);
  const totalBankDebited = bankTxns.reduce((s, t) => s + Number(t.cash_debited), 0);
  const totalBankDeposited = bankTxns.reduce((s, t) => s + Number(t.cash_deposited), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="page-header">Calendar View</h1>
      <p className="text-muted-foreground">Click a date to see all transactions</p>

      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6">
        <Card className="p-4 w-fit">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(d) => d && setSelectedDate(d)}
            className="pointer-events-auto"
          />
        </Card>

        <div className="space-y-6">
          <h2 className="font-display text-lg font-semibold">
            {format(selectedDate, "dd MMMM yyyy")}
          </h2>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="stat-card">
              <p className="text-xs text-muted-foreground">Expenses</p>
              <p className="text-lg font-bold font-display mt-1">₹{totalExp.toLocaleString()}</p>
            </div>
            <div className="stat-card">
              <p className="text-xs text-muted-foreground">Sales</p>
              <p className="text-lg font-bold font-display mt-1">₹{totalSalesAmt.toLocaleString()}</p>
            </div>
            <div className="stat-card">
              <p className="text-xs text-muted-foreground">Bank Debited</p>
              <p className="text-lg font-bold font-display mt-1 text-destructive">₹{totalBankDebited.toLocaleString()}</p>
            </div>
            <div className="stat-card">
              <p className="text-xs text-muted-foreground">Bank Deposited</p>
              <p className="text-lg font-bold font-display mt-1 text-success">₹{totalBankDeposited.toLocaleString()}</p>
            </div>
          </div>

          {/* Expenses */}
          {expenses.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Expenses</h3>
              <Table>
                <TableHeader><TableRow><TableHead>Category</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Notes</TableHead></TableRow></TableHeader>
                <TableBody>
                  {expenses.map((e: any) => (
                    <TableRow key={e.id}>
                      <TableCell>{e.category}</TableCell>
                      <TableCell className="text-right">₹{Number(e.amount).toLocaleString()}</TableCell>
                      <TableCell className="text-muted-foreground">{e.other || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}

          {/* Sales */}
          {sales.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Sales</h3>
              <Table>
                <TableHeader><TableRow><TableHead>Product</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="text-right">Debited</TableHead><TableHead className="text-right">Deposited</TableHead></TableRow></TableHeader>
                <TableBody>
                  {sales.map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell>{s.product_name}</TableCell>
                      <TableCell className="text-right">{s.quantity}</TableCell>
                      <TableCell className="text-right">₹{Number(s.amount).toLocaleString()}</TableCell>
                      <TableCell className="text-right text-destructive">₹{Number(s.cash_debited).toLocaleString()}</TableCell>
                      <TableCell className="text-right text-success">₹{Number(s.cash_deposited).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}

          {/* Bank Transactions */}
          {bankTxns.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Bank Transactions</h3>
              <Table>
                <TableHeader><TableRow><TableHead>Bank</TableHead><TableHead className="text-right">Debited</TableHead><TableHead className="text-right">Deposited</TableHead></TableRow></TableHeader>
                <TableBody>
                  {bankTxns.map((t: any) => (
                    <TableRow key={t.id}>
                      <TableCell>{t.bank_name}</TableCell>
                      <TableCell className="text-right text-destructive">₹{Number(t.cash_debited).toLocaleString()}</TableCell>
                      <TableCell className="text-right text-success">₹{Number(t.cash_deposited).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}

          {expenses.length === 0 && sales.length === 0 && bankTxns.length === 0 && (
            <Card className="p-8 text-center text-muted-foreground">No data for this date</Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
