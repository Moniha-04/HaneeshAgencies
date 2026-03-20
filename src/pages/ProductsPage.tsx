import { useState, useEffect, useMemo } from "react";
import { format, startOfWeek, endOfWeek, addDays, isSameDay, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter,
} from "@/components/ui/table";
import {
  PRODUCT_NAMES,
  ProductDayEntry,
  getProductSales,
  saveProductSales,
} from "@/lib/store";
import { Save, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { toast } from "sonner";
import { downloadTablePdf } from "@/lib/pdf";

const ProductsPage = () => {
  const [allEntries, setAllEntries] = useState<ProductDayEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));

  // Daily form state
  const [purchases, setPurchases] = useState<Record<string, number>>({});
  const [sales, setSales] = useState<Record<string, number>>({});

  useEffect(() => {
    setAllEntries(getProductSales());
  }, []);

  // Load day data when date changes
  useEffect(() => {
    const existing = allEntries.find((e) => e.date === selectedDate);
    if (existing) {
      const p: Record<string, number> = {};
      const s: Record<string, number> = {};
      existing.products.forEach((prod) => {
        p[prod.name] = prod.purchase;
        s[prod.name] = prod.sold;
      });
      setPurchases(p);
      setSales(s);
    } else {
      setPurchases({});
      setSales({});
    }
  }, [selectedDate, allEntries]);

  const handleSave = () => {
    const products = PRODUCT_NAMES.map((name) => ({
      name,
      purchase: purchases[name] || 0,
      sold: sales[name] || 0,
    })).filter((p) => p.purchase > 0 || p.sold > 0);

    const entry: ProductDayEntry = { date: selectedDate, products };
    const updated = [...allEntries.filter((e) => e.date !== selectedDate), entry].sort(
      (a, b) => a.date.localeCompare(b.date)
    );
    setAllEntries(updated);
    saveProductSales(updated);
    toast.success("Product details saved");
  };

  // Weekly summary (Sun–Sat)
  const weekStart = startOfWeek(parseISO(selectedDate), { weekStartsOn: 0 });
  const weekEnd = endOfWeek(parseISO(selectedDate), { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const weeklyTotals = useMemo(() => {
    const weekEntries = allEntries.filter((e) => {
      const d = parseISO(e.date);
      return d >= weekStart && d <= weekEnd;
    });

    return PRODUCT_NAMES.map((name) => {
      let totalPurchase = 0;
      let totalSold = 0;
      weekEntries.forEach((entry) => {
        const prod = entry.products.find((p) => p.name === name);
        if (prod) {
          totalPurchase += prod.purchase;
          totalSold += prod.sold;
        }
      });
      return { name, totalPurchase, totalSold, profit: totalSold - totalPurchase };
    });
  }, [allEntries, weekStart, weekEnd]);

  const grandPurchase = weeklyTotals.reduce((s, r) => s + r.totalPurchase, 0);
  const grandSold = weeklyTotals.reduce((s, r) => s + r.totalSold, 0);
  const grandProfit = grandSold - grandPurchase;

  const navigateWeek = (dir: number) => {
    setSelectedDate(format(addDays(parseISO(selectedDate), dir * 7), "yyyy-MM-dd"));
  };

  const downloadProductsPdf = () => {
    const rows = weeklyTotals.map((r) => [
      r.name,
      `₹${r.totalPurchase.toLocaleString()}`,
      `₹${r.totalSold.toLocaleString()}`,
      `₹${r.profit.toLocaleString()}`,
    ]);
    downloadTablePdf({
      title: "Product Sales — Weekly Summary",
      subtitle: `${format(weekStart, "dd MMM")} – ${format(weekEnd, "dd MMM yyyy")}`,
      headers: ["Product", "Total Purchase", "Total Sold", "Profit / Loss"],
      rows,
      filename: `products-${format(weekStart, "yyyy-MM-dd")}.pdf`,
      footerRow: [
        "Grand Total",
        `₹${grandPurchase.toLocaleString()}`,
        `₹${grandSold.toLocaleString()}`,
        `₹${grandProfit.toLocaleString()}`,
      ],
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-header">Product Sales</h1>
          <p className="text-muted-foreground mt-1">
            Track purchase &amp; selling price for products
          </p>
        </div>
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-auto"
        />
      </div>

      {/* Daily Entry */}
      <Card className="p-5">
        <h2 className="font-display text-lg font-semibold mb-4">
          Daily Entry — {format(parseISO(selectedDate), "dd MMM yyyy")}
        </h2>
        <div className="grid gap-3">
          {PRODUCT_NAMES.map((name) => (
            <div key={name} className="flex flex-wrap items-center gap-4">
              <span className="font-medium w-36 shrink-0">{name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-16">Purchase ₹</span>
                <Input
                  type="number"
                  min={0}
                  value={purchases[name] || ""}
                  onChange={(e) =>
                    setPurchases({ ...purchases, [name]: Number(e.target.value) })
                  }
                  placeholder="0"
                  className="w-28"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-16">Sold ₹</span>
                <Input
                  type="number"
                  min={0}
                  value={sales[name] || ""}
                  onChange={(e) =>
                    setSales({ ...sales, [name]: Number(e.target.value) })
                  }
                  placeholder="0"
                  className="w-28"
                />
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-5">
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" /> Save
          </Button>
        </div>
      </Card>

      {/* Weekly Summary */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="font-display text-lg font-semibold">
            Weekly Summary
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateWeek(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              {format(weekStart, "dd MMM")} – {format(weekEnd, "dd MMM yyyy")}
            </span>
            <Button variant="outline" size="icon" onClick={() => navigateWeek(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={downloadProductsPdf} className="gap-1 ml-2">
              <Download className="h-4 w-4" /> PDF
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Total Purchase</TableHead>
              <TableHead className="text-right">Total Sold</TableHead>
              <TableHead className="text-right">Profit / Loss</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {weeklyTotals.map((row) => (
              <TableRow key={row.name}>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell className="text-right">₹{row.totalPurchase.toLocaleString()}</TableCell>
                <TableCell className="text-right">₹{row.totalSold.toLocaleString()}</TableCell>
                <TableCell
                  className={`text-right font-semibold ${
                    row.profit >= 0 ? "text-success" : "text-destructive"
                  }`}
                >
                  ₹{row.profit.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="font-bold">Grand Total</TableCell>
              <TableCell className="text-right font-bold">₹{grandPurchase.toLocaleString()}</TableCell>
              <TableCell className="text-right font-bold">₹{grandSold.toLocaleString()}</TableCell>
              <TableCell
                className={`text-right font-bold ${
                  grandProfit >= 0 ? "text-success" : "text-destructive"
                }`}
              >
                ₹{grandProfit.toLocaleString()}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </Card>
    </div>
  );
};

export default ProductsPage;
