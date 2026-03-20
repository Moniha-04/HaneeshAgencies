import { useState, useEffect, useMemo } from "react";
import { format, parse, getDaysInMonth } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter,
} from "@/components/ui/table";
import {
  getEmployees, getAttendance, getLeaves, getExpenses, getProductSales,
  Employee, AttendanceRecord, CompanyLeave, DailyExpense, ProductDayEntry,
  EXPENSE_CATEGORIES, PRODUCT_NAMES,
} from "@/lib/store";
import {
  Download, Users, CalendarOff, Receipt, ShoppingCart, TrendingUp, TrendingDown,
} from "lucide-react";
import { downloadTablePdf } from "@/lib/pdf";
import { toast } from "sonner";

const MonthlyReportPage = () => {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<CompanyLeave[]>([]);
  const [expenses, setExpenses] = useState<DailyExpense[]>([]);
  const [productSales, setProductSales] = useState<ProductDayEntry[]>([]);

  useEffect(() => {
    setEmployees(getEmployees());
    setAttendance(getAttendance());
    setLeaves(getLeaves());
    setExpenses(getExpenses());
    setProductSales(getProductSales());
  }, []);

  const monthDate = parse(selectedMonth + "-01", "yyyy-MM-dd", new Date());
  const monthLabel = format(monthDate, "MMMM yyyy");
  const daysInMonth = getDaysInMonth(monthDate);
  const getEmployeeName = (id: string) => employees.find((e) => e.id === id)?.name || "Unknown";

  // --- Attendance ---
  const attendanceStats = useMemo(() => {
    const monthAtt = attendance.filter((a) => a.date.startsWith(selectedMonth));
    const perEmployee = employees.map((emp) => {
      const empAtt = monthAtt.filter((a) => a.employeeId === emp.id);
      return {
        name: emp.name,
        present: empAtt.filter((a) => a.status === "present").length,
        absent: empAtt.filter((a) => a.status === "absent").length,
        leave: empAtt.filter((a) => a.status === "leave").length,
      };
    });
    return {
      perEmployee,
      totalPresent: perEmployee.reduce((s, e) => s + e.present, 0),
      totalAbsent: perEmployee.reduce((s, e) => s + e.absent, 0),
      totalLeave: perEmployee.reduce((s, e) => s + e.leave, 0),
    };
  }, [attendance, employees, selectedMonth]);

  const downloadAttendancePdf = () => {
    const rows = attendanceStats.perEmployee.map((e) => [e.name, e.present, e.absent, e.leave, daysInMonth]);
    downloadTablePdf({
      title: "Monthly Attendance Report",
      subtitle: monthLabel,
      headers: ["Employee", "Present", "Absent", "Leave", "Total Days"],
      rows,
      filename: `attendance-${selectedMonth}.pdf`,
    });
  };

  // --- Company Leaves ---
  const monthLeaves = useMemo(() => leaves.filter((l) => l.date.startsWith(selectedMonth)), [leaves, selectedMonth]);

  const downloadLeavesPdf = () => {
    const rows = monthLeaves.map((l) => [
      format(new Date(l.date + "T00:00:00"), "dd MMM yyyy (EEEE)"),
      l.reason,
    ]);
    downloadTablePdf({
      title: "Company Leaves",
      subtitle: monthLabel,
      headers: ["Date", "Reason"],
      rows,
      filename: `leaves-${selectedMonth}.pdf`,
    });
  };

  // --- Expenses ---
  const expenseStats = useMemo(() => {
    const monthExp = expenses.filter((e) => e.date.startsWith(selectedMonth));
    let totalSalaries = 0;
    let totalCosts = 0;
    const costBreakdown: Record<string, number> = {};
    const salaryBreakdown: Record<string, number> = {};

    monthExp.forEach((e) => {
      e.salaries.forEach((s) => {
        totalSalaries += s.amount;
        salaryBreakdown[s.employeeId] = (salaryBreakdown[s.employeeId] || 0) + s.amount;
      });
      Object.entries(e.costs).forEach(([k, v]) => {
        totalCosts += v;
        costBreakdown[k] = (costBreakdown[k] || 0) + v;
      });
    });

    return { totalSalaries, totalCosts, grandTotal: totalSalaries + totalCosts, costBreakdown, salaryBreakdown, daysEntered: monthExp.length };
  }, [expenses, selectedMonth]);

  const downloadExpensesPdf = () => {
    const salaryRows = employees
      .filter((emp) => (expenseStats.salaryBreakdown[emp.id] || 0) > 0)
      .map((emp) => [emp.name, `₹${(expenseStats.salaryBreakdown[emp.id] || 0).toLocaleString()}`]);
    const costRows = Object.entries(expenseStats.costBreakdown)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => [k, `₹${v.toLocaleString()}`]);
    const rows = [...salaryRows, ["--- Costs ---", ""], ...costRows];
    downloadTablePdf({
      title: "Monthly Expenses Report",
      subtitle: `${monthLabel} (${expenseStats.daysEntered} days)`,
      headers: ["Item", "Amount"],
      rows,
      filename: `expenses-${selectedMonth}.pdf`,
      footerRow: ["Grand Total", `₹${expenseStats.grandTotal.toLocaleString()}`],
    });
  };

  // --- Product Sales ---
  const productStats = useMemo(() => {
    const monthProd = productSales.filter((p) => p.date.startsWith(selectedMonth));
    const perProduct = PRODUCT_NAMES.map((name) => {
      let totalPurchase = 0;
      let totalSold = 0;
      monthProd.forEach((entry) => {
        const prod = entry.products.find((p) => p.name === name);
        if (prod) {
          totalPurchase += prod.purchase;
          totalSold += prod.sold;
        }
      });
      return { name, totalPurchase, totalSold, profit: totalSold - totalPurchase };
    });
    return {
      perProduct,
      grandPurchase: perProduct.reduce((s, p) => s + p.totalPurchase, 0),
      grandSold: perProduct.reduce((s, p) => s + p.totalSold, 0),
      grandProfit: perProduct.reduce((s, p) => s + p.profit, 0),
      daysEntered: monthProd.length,
    };
  }, [productSales, selectedMonth]);

  const downloadProductsPdf = () => {
    const rows = productStats.perProduct.map((r) => [
      r.name, `₹${r.totalPurchase.toLocaleString()}`, `₹${r.totalSold.toLocaleString()}`, `₹${r.profit.toLocaleString()}`,
    ]);
    downloadTablePdf({
      title: "Monthly Product Sales Report",
      subtitle: `${monthLabel} (${productStats.daysEntered} days)`,
      headers: ["Product", "Total Purchase", "Total Sold", "Profit / Loss"],
      rows,
      filename: `products-${selectedMonth}.pdf`,
      footerRow: ["Grand Total", `₹${productStats.grandPurchase.toLocaleString()}`, `₹${productStats.grandSold.toLocaleString()}`, `₹${productStats.grandProfit.toLocaleString()}`],
    });
  };

  const downloadAllPdf = () => {
    downloadAttendancePdf();
    downloadLeavesPdf();
    downloadExpensesPdf();
    downloadProductsPdf();
    toast.success("All monthly PDFs downloaded");
  };

  // --- Overview numbers ---
  const netIncome = productStats.grandSold - expenseStats.grandTotal;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-header">Monthly Report</h1>
          <p className="text-muted-foreground mt-1">Consolidated monthly overview across all services</p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-auto"
          />
          <Button variant="outline" size="sm" onClick={downloadAllPdf} className="gap-1">
            <Download className="h-4 w-4" /> All PDFs
          </Button>
        </div>
      </div>

      <p className="text-lg font-display font-semibold">{monthLabel}</p>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Total Expenses</p>
          <p className="text-2xl font-bold font-display mt-1">₹{expenseStats.grandTotal.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Product Sales</p>
          <p className="text-2xl font-bold font-display mt-1">₹{productStats.grandSold.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Product Profit</p>
          <p className={`text-2xl font-bold font-display mt-1 ${productStats.grandProfit >= 0 ? "text-success" : "text-destructive"}`}>
            ₹{productStats.grandProfit.toLocaleString()}
          </p>
        </div>
        <div className="stat-card border-primary/30">
          <p className="text-sm text-muted-foreground">Company Leaves</p>
          <p className="text-2xl font-bold font-display mt-1">{monthLeaves.length}</p>
        </div>
      </div>

      {/* Attendance */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-semibold">Attendance Summary</h2>
          </div>
          <Button variant="outline" size="sm" onClick={downloadAttendancePdf} className="gap-1">
            <Download className="h-4 w-4" /> PDF
          </Button>
        </div>
        <div className="flex gap-4 mb-4">
          <Badge className="bg-success text-success-foreground">Present: {attendanceStats.totalPresent}</Badge>
          <Badge variant="destructive">Absent: {attendanceStats.totalAbsent}</Badge>
          <Badge variant="secondary">Leave: {attendanceStats.totalLeave}</Badge>
        </div>
        {attendanceStats.perEmployee.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead className="text-center">Present</TableHead>
                <TableHead className="text-center">Absent</TableHead>
                <TableHead className="text-center">Leave</TableHead>
                <TableHead className="text-center">Total Days</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceStats.perEmployee.map((e) => (
                <TableRow key={e.name}>
                  <TableCell className="font-medium">{e.name}</TableCell>
                  <TableCell className="text-center"><Badge className="bg-success text-success-foreground">{e.present}</Badge></TableCell>
                  <TableCell className="text-center"><Badge variant="destructive">{e.absent}</Badge></TableCell>
                  <TableCell className="text-center"><Badge variant="secondary">{e.leave}</Badge></TableCell>
                  <TableCell className="text-center text-muted-foreground">{daysInMonth}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-muted-foreground text-sm">No employees found.</p>
        )}
      </Card>

      {/* Company Leaves */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarOff className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-semibold">Company Leaves ({monthLeaves.length})</h2>
          </div>
          <Button variant="outline" size="sm" onClick={downloadLeavesPdf} className="gap-1">
            <Download className="h-4 w-4" /> PDF
          </Button>
        </div>
        {monthLeaves.length > 0 ? (
          <div className="grid gap-2">
            {monthLeaves.map((l) => (
              <div key={l.date} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                <span className="font-medium text-sm">{format(new Date(l.date + "T00:00:00"), "dd MMM yyyy (EEEE)")}</span>
                <span className="text-sm text-muted-foreground">{l.reason}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No company leaves this month.</p>
        )}
      </Card>

      {/* Expenses */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-semibold">
              Expenses Summary
              <span className="text-sm font-normal text-muted-foreground ml-2">({expenseStats.daysEntered} days entered)</span>
            </h2>
          </div>
          <Button variant="outline" size="sm" onClick={downloadExpensesPdf} className="gap-1">
            <Download className="h-4 w-4" /> PDF
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="stat-card">
            <p className="text-sm text-muted-foreground">Total Salaries</p>
            <p className="text-xl font-bold font-display mt-1">₹{expenseStats.totalSalaries.toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground">Total Costs</p>
            <p className="text-xl font-bold font-display mt-1">₹{expenseStats.totalCosts.toLocaleString()}</p>
          </div>
          <div className="stat-card border-primary/30">
            <p className="text-sm text-muted-foreground">Grand Total</p>
            <p className="text-xl font-bold font-display mt-1 text-primary">₹{expenseStats.grandTotal.toLocaleString()}</p>
          </div>
        </div>
        {Object.entries(expenseStats.costBreakdown).filter(([, v]) => v > 0).length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Cost Breakdown</p>
            {Object.entries(expenseStats.costBreakdown).filter(([, v]) => v > 0).map(([k, v]) => (
              <div key={k} className="flex justify-between py-1.5 px-3 text-sm rounded bg-muted/50 mb-1">
                <span>{k}</span>
                <span className="font-medium">₹{v.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Product Sales */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-semibold">
              Product Sales Summary
              <span className="text-sm font-normal text-muted-foreground ml-2">({productStats.daysEntered} days entered)</span>
            </h2>
          </div>
          <Button variant="outline" size="sm" onClick={downloadProductsPdf} className="gap-1">
            <Download className="h-4 w-4" /> PDF
          </Button>
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
            {productStats.perProduct.map((r) => (
              <TableRow key={r.name}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="text-right">₹{r.totalPurchase.toLocaleString()}</TableCell>
                <TableCell className="text-right">₹{r.totalSold.toLocaleString()}</TableCell>
                <TableCell className={`text-right font-semibold ${r.profit >= 0 ? "text-success" : "text-destructive"}`}>
                  ₹{r.profit.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="font-bold">Grand Total</TableCell>
              <TableCell className="text-right font-bold">₹{productStats.grandPurchase.toLocaleString()}</TableCell>
              <TableCell className="text-right font-bold">₹{productStats.grandSold.toLocaleString()}</TableCell>
              <TableCell className={`text-right font-bold ${productStats.grandProfit >= 0 ? "text-success" : "text-destructive"}`}>
                ₹{productStats.grandProfit.toLocaleString()}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </Card>
    </div>
  );
};

export default MonthlyReportPage;
