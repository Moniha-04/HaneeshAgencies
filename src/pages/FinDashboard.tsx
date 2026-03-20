import { useState, useEffect } from "react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Landmark, ArrowDownCircle, ArrowUpCircle, Receipt, ShoppingCart } from "lucide-react";

const FinDashboard = () => {
  const [stats, setStats] = useState({
    totalDebited: 0, totalDeposited: 0,
    indianDebited: 0, indianDeposited: 0,
    hdfcDebited: 0, hdfcDeposited: 0,
    totalExpenses: 0, totalSalesAmount: 0,
    salesDebited: 0, salesDeposited: 0,
  });

  useEffect(() => {
    const fetchAll = async () => {
      const [bankRes, expRes, salesRes] = await Promise.all([
        supabase.from("bank_transactions").select("bank_name, cash_debited, cash_deposited"),
        supabase.from("expenses").select("amount"),
        supabase.from("sales").select("amount, cash_debited, cash_deposited"),
      ]);

      const bankData = bankRes.data || [];
      const expData = expRes.data || [];
      const salesData = salesRes.data || [];

      const indianTxns = bankData.filter((t) => t.bank_name === "Indian Bank");
      const hdfcTxns = bankData.filter((t) => t.bank_name === "HDFC Bank");

      const sum = (arr: any[], key: string) => arr.reduce((s, r) => s + Number(r[key] || 0), 0);

      const indianDebited = sum(indianTxns, "cash_debited");
      const indianDeposited = sum(indianTxns, "cash_deposited");
      const hdfcDebited = sum(hdfcTxns, "cash_debited");
      const hdfcDeposited = sum(hdfcTxns, "cash_deposited");
      const salesDebited = sum(salesData, "cash_debited");
      const salesDeposited = sum(salesData, "cash_deposited");

      setStats({
        totalDebited: indianDebited + hdfcDebited + salesDebited,
        totalDeposited: indianDeposited + hdfcDeposited + salesDeposited,
        indianDebited, indianDeposited,
        hdfcDebited, hdfcDeposited,
        totalExpenses: sum(expData, "amount"),
        totalSalesAmount: sum(salesData, "amount"),
        salesDebited, salesDeposited,
      });
    };
    fetchAll();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="page-header">Financial Dashboard</h1>
        <p className="text-muted-foreground mt-1">{format(new Date(), "EEEE, dd MMMM yyyy")}</p>
      </div>

      {/* Top summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="stat-card border-destructive/30">
          <div className="flex items-center gap-2">
            <ArrowUpCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-muted-foreground">Total Cash Debited</p>
          </div>
          <p className="text-3xl font-bold font-display mt-2 text-destructive">₹{stats.totalDebited.toLocaleString()}</p>
        </div>
        <div className="stat-card border-success/30">
          <div className="flex items-center gap-2">
            <ArrowDownCircle className="h-5 w-5 text-success" />
            <p className="text-sm text-muted-foreground">Total Cash Deposited</p>
          </div>
          <p className="text-3xl font-bold font-display mt-2 text-success">₹{stats.totalDeposited.toLocaleString()}</p>
        </div>
      </div>

      {/* Bank-wise */}
      <div>
        <h2 className="font-display text-lg font-semibold mb-3">Bank-wise Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Landmark className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Indian Bank</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Cash Debited</span>
                <span className="font-semibold text-destructive">₹{stats.indianDebited.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Cash Deposited</span>
                <span className="font-semibold text-success">₹{stats.indianDeposited.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-sm font-medium">Net</span>
                <span className={`font-bold ${(stats.indianDeposited - stats.indianDebited) >= 0 ? "text-success" : "text-destructive"}`}>
                  ₹{(stats.indianDeposited - stats.indianDebited).toLocaleString()}
                </span>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Landmark className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">HDFC Bank</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Cash Debited</span>
                <span className="font-semibold text-destructive">₹{stats.hdfcDebited.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Cash Deposited</span>
                <span className="font-semibold text-success">₹{stats.hdfcDeposited.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-sm font-medium">Net</span>
                <span className={`font-bold ${(stats.hdfcDeposited - stats.hdfcDebited) >= 0 ? "text-success" : "text-destructive"}`}>
                  ₹{(stats.hdfcDeposited - stats.hdfcDebited).toLocaleString()}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Other totals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            <p className="text-sm text-muted-foreground">Total Expenses</p>
          </div>
          <p className="text-2xl font-bold font-display mt-2">₹{stats.totalExpenses.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <p className="text-sm text-muted-foreground">Total Sales Amount</p>
          </div>
          <p className="text-2xl font-bold font-display mt-2">₹{stats.totalSalesAmount.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default FinDashboard;
