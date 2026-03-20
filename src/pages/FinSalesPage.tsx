import { useState, useEffect } from "react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter,
} from "@/components/ui/table";
import { Save, Plus, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import { downloadTablePdf } from "@/lib/pdf";

interface Sale {
  id?: string;
  date: string;
  product_name: string;
  quantity: number;
  amount: number;
  cash_debited: number;
  cash_deposited: number;
}

const FinSalesPage = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState<number>(0);
  const [amount, setAmount] = useState<number>(0);
  const [cashDebited, setCashDebited] = useState<number>(0);
  const [cashDeposited, setCashDeposited] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const fetchSales = async () => {
    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .eq("date", selectedDate)
      .order("created_at", { ascending: true });
    if (error) { toast.error(error.message); return; }
    setSales(data || []);
  };

  useEffect(() => { fetchSales(); }, [selectedDate]);

  const handleAdd = async () => {
    if (!productName.trim()) { toast.error("Enter product name"); return; }
    setLoading(true);
    const { error } = await supabase.from("sales").insert({
      date: selectedDate, product_name: productName, quantity, amount,
      cash_debited: cashDebited, cash_deposited: cashDeposited,
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Sale added");
    setProductName(""); setQuantity(0); setAmount(0); setCashDebited(0); setCashDeposited(0);
    fetchSales();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("sales").delete().eq("id", id);
    fetchSales();
  };

  const totalAmount = sales.reduce((s, e) => s + Number(e.amount), 0);
  const totalDebited = sales.reduce((s, e) => s + Number(e.cash_debited), 0);
  const totalDeposited = sales.reduce((s, e) => s + Number(e.cash_deposited), 0);

  const downloadPdf = () => {
    const rows = sales.map((s) => [
      s.product_name, String(s.quantity), `₹${Number(s.amount).toLocaleString()}`,
      `₹${Number(s.cash_debited).toLocaleString()}`, `₹${Number(s.cash_deposited).toLocaleString()}`,
    ]);
    downloadTablePdf({
      title: "Sales Report",
      subtitle: `Date: ${selectedDate}\nTotal Cash Debited: ₹${totalDebited.toLocaleString()}  |  Total Cash Deposited: ₹${totalDeposited.toLocaleString()}`,
      headers: ["Product", "Qty", "Amount", "Cash Debited", "Cash Deposited"],
      rows,
      filename: `sales-${selectedDate}.pdf`,
      footerRow: ["Total", "", `₹${totalAmount.toLocaleString()}`, `₹${totalDebited.toLocaleString()}`, `₹${totalDeposited.toLocaleString()}`],
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-header">Product Sales</h1>
          <p className="text-muted-foreground mt-1">Track sales with cash flow</p>
        </div>
        <div className="flex items-center gap-2">
          <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-auto" />
          <Button variant="outline" size="sm" onClick={downloadPdf} className="gap-1">
            <Download className="h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Total Amount</p>
          <p className="text-2xl font-bold font-display mt-1">₹{totalAmount.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Cash Debited</p>
          <p className="text-2xl font-bold font-display mt-1 text-destructive">₹{totalDebited.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Cash Deposited</p>
          <p className="text-2xl font-bold font-display mt-1 text-success">₹{totalDeposited.toLocaleString()}</p>
        </div>
      </div>

      {/* Add form */}
      <Card className="p-5">
        <h2 className="font-display text-lg font-semibold mb-4">Add Sale</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Product Name</label>
            <Input value={productName} onChange={(e) => setProductName(e.target.value)} className="w-40" placeholder="Product..." />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Qty</label>
            <Input type="number" min={0} value={quantity || ""} onChange={(e) => setQuantity(Number(e.target.value))} className="w-20" placeholder="0" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Amount ₹</label>
            <Input type="number" min={0} value={amount || ""} onChange={(e) => setAmount(Number(e.target.value))} className="w-28" placeholder="0" />
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
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Debited</TableHead>
              <TableHead className="text-right">Deposited</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.product_name}</TableCell>
                <TableCell className="text-right">{s.quantity}</TableCell>
                <TableCell className="text-right">₹{Number(s.amount).toLocaleString()}</TableCell>
                <TableCell className="text-right text-destructive">₹{Number(s.cash_debited).toLocaleString()}</TableCell>
                <TableCell className="text-right text-success">₹{Number(s.cash_deposited).toLocaleString()}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id!)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {sales.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No sales for this date</TableCell></TableRow>
            )}
          </TableBody>
          {sales.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell className="font-bold">Total</TableCell>
                <TableCell></TableCell>
                <TableCell className="text-right font-bold">₹{totalAmount.toLocaleString()}</TableCell>
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

export default FinSalesPage;
