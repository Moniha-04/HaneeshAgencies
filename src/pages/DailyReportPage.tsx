import { useState, useEffect } from "react";
import { format } from "date-fns";
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
  Download, Users, UserCheck, UserX, CalendarOff, Receipt, ShoppingCart, FileText,
} from "lucide-react";
import { toast } from "sonner";
import { downloadTablePdf } from "@/lib/pdf";

const DailyReportPage = () => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
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

  const dateLabel = format(new Date(selectedDate + "T00:00:00"), "EEEE, dd MMMM yyyy");

  // --- Attendance for selected date ---
  const dayAttendance = attendance.filter((a) => a.date === selectedDate);
  const presentCount = dayAttendance.filter((a) => a.status === "present").length;
  const absentCount = dayAttendance.filter((a) => a.status === "absent").length;
  const leaveCount = dayAttendance.filter((a) => a.status === "leave").length;

  const getEmployeeName = (id: string) => employees.find((e) => e.id === id)?.name || "Unknown";

  const downloadAttendancePdf = () => {
    const rows = dayAttendance.map((a) => [
      getEmployeeName(a.employeeId),
      a.status.charAt(0).toUpperCase() + a.status.slice(1),
    ]);
    downloadTablePdf({
      title: "Daily Attendance Report",
      subtitle: dateLabel,
      headers: ["Employee", "Status"],
      rows,
      filename: `attendance-${selectedDate}.pdf`,
      footerRow: ["Total", `P:${presentCount} A:${absentCount} L:${leaveCount}`],
    });
  };

  // --- Company Leave for selected date ---
  const dayLeave = leaves.find((l) => l.date === selectedDate);

  const downloadLeavesPdf = () => {
    const leavesForMonth = leaves.filter((l) => l.date.startsWith(selectedDate.substring(0, 7)));
    const rows = leavesForMonth.map((l) => [
      format(new Date(l.date + "T00:00:00"), "dd MMM yyyy (EEEE)"),
      l.reason,
    ]);
    downloadTablePdf({
      title: "Company Leaves",
      subtitle: format(new Date(selectedDate + "T00:00:00"), "MMMM yyyy"),
      headers: ["Date", "Reason"],
      rows,
      filename: `leaves-${selectedDate.substring(0, 7)}.pdf`,
    });
  };

  // --- Expenses for selected date ---
  const dayExpense = expenses.find((e) => e.date === selectedDate);
  const totalSalary = dayExpense?.salaries.reduce((s, sal) => s + sal.amount, 0) || 0;
  const totalCosts = dayExpense ? Object.values(dayExpense.costs).reduce((s, c) => s + c, 0) : 0;
  const expenseGrandTotal = totalSalary + totalCosts;

  const downloadExpensesPdf = () => {
    if (!dayExpense) return;
    const salaryRows = dayExpense.salaries
      .filter((s) => s.amount > 0)
      .map((s) => [getEmployeeName(s.employeeId), `₹${s.amount.toLocaleString()}`]);
    const costRows = Object.entries(dayExpense.costs)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => [k, `₹${v.toLocaleString()}`]);
    const rows = [...salaryRows, ["--- Costs ---", ""], ...costRows];
    downloadTablePdf({
      title: "Daily Expenses",
      subtitle: dateLabel,
      headers: ["Item", "Amount"],
      rows,
      filename: `expenses-${selectedDate}.pdf`,
      footerRow: ["Grand Total", `₹${expenseGrandTotal.toLocaleString()}`],
    });
  };

  // --- Product Sales for selected date ---
  const dayProducts = productSales.find((p) => p.date === selectedDate);
  const productTotal = dayProducts?.products.reduce((s, p) => s + (p.sold - p.purchase), 0) || 0;

  const downloadProductsPdf = () => {
    if (!dayProducts) return;
    const rows = dayProducts.products.map((p) => [
      p.name,
      `₹${p.purchase.toLocaleString()}`,
      `₹${p.sold.toLocaleString()}`,
      `₹${(p.sold - p.purchase).toLocaleString()}`,
    ]);
    const totalPurchase = dayProducts.products.reduce((s, p) => s + p.purchase, 0);
    const totalSold = dayProducts.products.reduce((s, p) => s + p.sold, 0);
    downloadTablePdf({
      title: "Product Sales Report",
      subtitle: dateLabel,
      headers: ["Product", "Purchase", "Sold", "Profit/Loss"],
      rows,
      filename: `products-${selectedDate}.pdf`,
      footerRow: ["Total", `₹${totalPurchase.toLocaleString()}`, `₹${totalSold.toLocaleString()}`, `₹${productTotal.toLocaleString()}`],
    });
  };

  // --- Download All ---
  const downloadAllPdf = () => {
    downloadAttendancePdf();
    if (dayExpense) downloadExpensesPdf();
    if (dayProducts) downloadProductsPdf();
    downloadLeavesPdf();
    toast.success("All PDFs downloaded");
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-header">Daily Report</h1>
          <p className="text-muted-foreground mt-1">View all details for a specific date</p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
          <Button variant="outline" size="sm" onClick={downloadAllPdf} className="gap-1">
            <Download className="h-4 w-4" /> All PDFs
          </Button>
        </div>
      </div>

      <p className="text-lg font-display font-semibold">{dateLabel}</p>

      {/* Attendance Section */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-semibold">Attendance</h2>
          </div>
          <Button variant="outline" size="sm" onClick={downloadAttendancePdf} className="gap-1">
            <Download className="h-4 w-4" /> PDF
          </Button>
        </div>
        {dayAttendance.length > 0 ? (
          <>
            <div className="flex gap-4 mb-4">
              <Badge className="bg-success text-success-foreground">Present: {presentCount}</Badge>
              <Badge variant="destructive">Absent: {absentCount}</Badge>
              <Badge variant="secondary">Leave: {leaveCount}</Badge>
            </div>
            <div className="grid gap-2">
              {dayAttendance.map((a) => (
                <div key={a.employeeId} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                  <span className="font-medium text-sm">{getEmployeeName(a.employeeId)}</span>
                  <Badge
                    variant={a.status === "present" ? "default" : a.status === "absent" ? "destructive" : "secondary"}
                    className={a.status === "present" ? "bg-success text-success-foreground" : ""}
                  >
                    {a.status}
                  </Badge>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-muted-foreground text-sm">No attendance records for this date.</p>
        )}
      </Card>

      {/* Company Leave Section */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarOff className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-semibold">Company Leave</h2>
          </div>
          <Button variant="outline" size="sm" onClick={downloadLeavesPdf} className="gap-1">
            <Download className="h-4 w-4" /> PDF
          </Button>
        </div>
        {dayLeave ? (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-accent">
            <CalendarOff className="h-5 w-5 text-accent-foreground" />
            <div>
              <p className="font-medium">Company Leave</p>
              <p className="text-sm text-muted-foreground">{dayLeave.reason}</p>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No company leave on this date.</p>
        )}
      </Card>

      {/* Expenses Section */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-semibold">Daily Expenses</h2>
          </div>
          {dayExpense && (
            <Button variant="outline" size="sm" onClick={downloadExpensesPdf} className="gap-1">
              <Download className="h-4 w-4" /> PDF
            </Button>
          )}
        </div>
        {dayExpense ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="stat-card">
                <p className="text-sm text-muted-foreground">Salaries</p>
                <p className="text-xl font-bold font-display mt-1">₹{totalSalary.toLocaleString()}</p>
              </div>
              <div className="stat-card">
                <p className="text-sm text-muted-foreground">Costs</p>
                <p className="text-xl font-bold font-display mt-1">₹{totalCosts.toLocaleString()}</p>
              </div>
              <div className="stat-card border-primary/30">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-xl font-bold font-display mt-1 text-primary">₹{expenseGrandTotal.toLocaleString()}</p>
              </div>
            </div>
            {dayExpense.salaries.filter(s => s.amount > 0).length > 0 && (
              <div className="mb-3">
                <p className="text-sm font-medium mb-2">Salaries</p>
                {dayExpense.salaries.filter(s => s.amount > 0).map((s) => (
                  <div key={s.employeeId} className="flex justify-between py-1.5 px-3 text-sm rounded bg-muted/50 mb-1">
                    <span>{getEmployeeName(s.employeeId)}</span>
                    <span className="font-medium">₹{s.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
            {Object.entries(dayExpense.costs).filter(([,v]) => v > 0).length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Costs</p>
                {Object.entries(dayExpense.costs).filter(([,v]) => v > 0).map(([k, v]) => (
                  <div key={k} className="flex justify-between py-1.5 px-3 text-sm rounded bg-muted/50 mb-1">
                    <span>{k}</span>
                    <span className="font-medium">₹{v.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="text-muted-foreground text-sm">No expenses recorded for this date.</p>
        )}
      </Card>

      {/* Product Sales Section */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-semibold">Product Sales</h2>
          </div>
          {dayProducts && (
            <Button variant="outline" size="sm" onClick={downloadProductsPdf} className="gap-1">
              <Download className="h-4 w-4" /> PDF
            </Button>
          )}
        </div>
        {dayProducts && dayProducts.products.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Purchase</TableHead>
                <TableHead className="text-right">Sold</TableHead>
                <TableHead className="text-right">Profit/Loss</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dayProducts.products.map((p) => (
                <TableRow key={p.name}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-right">₹{p.purchase.toLocaleString()}</TableCell>
                  <TableCell className="text-right">₹{p.sold.toLocaleString()}</TableCell>
                  <TableCell className={`text-right font-semibold ${(p.sold - p.purchase) >= 0 ? "text-success" : "text-destructive"}`}>
                    ₹{(p.sold - p.purchase).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="font-bold">Total</TableCell>
                <TableCell className="text-right font-bold">₹{dayProducts.products.reduce((s, p) => s + p.purchase, 0).toLocaleString()}</TableCell>
                <TableCell className="text-right font-bold">₹{dayProducts.products.reduce((s, p) => s + p.sold, 0).toLocaleString()}</TableCell>
                <TableCell className={`text-right font-bold ${productTotal >= 0 ? "text-success" : "text-destructive"}`}>
                  ₹{productTotal.toLocaleString()}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        ) : (
          <p className="text-muted-foreground text-sm">No product sales recorded for this date.</p>
        )}
      </Card>
    </div>
  );
};

export default DailyReportPage;
