import { useState, useEffect, useMemo } from "react";
import { format, parse, getDaysInMonth } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  getEmployees,
  getExpenses,
  saveExpenses,
  EXPENSE_CATEGORIES,
  DailyExpense,
  Employee,
} from "@/lib/store";
import { Save, Download } from "lucide-react";
import { toast } from "sonner";
import { downloadTablePdf } from "@/lib/pdf";

const ExpensesPage = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [expenses, setExpenses] = useState<DailyExpense[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [salaries, setSalaries] = useState<Record<string, number>>({});
  const [costs, setCosts] = useState<Record<string, number>>({});

  useEffect(() => {
    setEmployees(getEmployees());
    setExpenses(getExpenses());
  }, []);

  // Load data when date changes
  useEffect(() => {
    const existing = expenses.find((e) => e.date === selectedDate);
    if (existing) {
      const salaryMap: Record<string, number> = {};
      existing.salaries.forEach((s) => (salaryMap[s.employeeId] = s.amount));
      setSalaries(salaryMap);
      setCosts(existing.costs);
    } else {
      setSalaries({});
      setCosts({});
    }
  }, [selectedDate, expenses]);

  const handleSave = () => {
    const salaryArr = Object.entries(salaries)
      .filter(([, amount]) => amount > 0)
      .map(([employeeId, amount]) => ({ employeeId, amount }));

    const filteredCosts: Record<string, number> = {};
    Object.entries(costs).forEach(([key, val]) => {
      if (val > 0) filteredCosts[key] = val;
    });

    const newExpense: DailyExpense = {
      date: selectedDate,
      salaries: salaryArr,
      costs: filteredCosts,
    };

    const updated = [...expenses.filter((e) => e.date !== selectedDate), newExpense].sort((a, b) =>
      a.date.localeCompare(b.date)
    );
    setExpenses(updated);
    saveExpenses(updated);
    toast.success("Expenses saved");
  };

  const totalSalary = Object.values(salaries).reduce((a, b) => a + (b || 0), 0);
  const totalCosts = Object.values(costs).reduce((a, b) => a + (b || 0), 0);
  const grandTotal = totalSalary + totalCosts;

  // Monthly totals
  const currentMonth = selectedDate.substring(0, 7);
  const monthlyStats = useMemo(() => {
    const monthExpenses = expenses.filter((e) => e.date.startsWith(currentMonth));
    let monthlySalaries = 0;
    let monthlyCosts = 0;
    const costBreakdown: Record<string, number> = {};

    monthExpenses.forEach((e) => {
      monthlySalaries += e.salaries.reduce((s, sal) => s + sal.amount, 0);
      Object.entries(e.costs).forEach(([key, val]) => {
        monthlyCosts += val;
        costBreakdown[key] = (costBreakdown[key] || 0) + val;
      });
    });

    return {
      totalSalaries: monthlySalaries,
      totalCosts: monthlyCosts,
      grandTotal: monthlySalaries + monthlyCosts,
      daysEntered: monthExpenses.length,
      costBreakdown,
    };
  }, [expenses, currentMonth]);

  const downloadExpensesPdf = () => {
    const salaryRows = employees
      .filter((emp) => salaries[emp.id] > 0)
      .map((emp) => [emp.name, `₹${(salaries[emp.id] || 0).toLocaleString()}`]);
    const costRows = EXPENSE_CATEGORIES
      .filter((cat) => costs[cat] > 0)
      .map((cat) => [cat, `₹${(costs[cat] || 0).toLocaleString()}`]);
    const rows = [
      ...salaryRows,
      ["--- Costs ---", ""],
      ...costRows,
    ];
    downloadTablePdf({
      title: "Daily Expenses",
      subtitle: selectedDate,
      headers: ["Item", "Amount"],
      rows,
      filename: `expenses-${selectedDate}.pdf`,
      footerRow: ["Grand Total", `₹${grandTotal.toLocaleString()}`],
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-header">Daily Expenses</h1>
          <p className="text-muted-foreground mt-1">Track salaries and daily costs</p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
          <Button variant="outline" size="sm" onClick={downloadExpensesPdf} className="gap-1">
            <Download className="h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      {/* Daily Summary Cards */}
      <div>
        <h2 className="font-display text-lg font-semibold mb-3">Today's Total</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="stat-card">
            <p className="text-sm text-muted-foreground">Salaries</p>
            <p className="text-2xl font-bold font-display mt-1">₹{totalSalary.toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground">Costs</p>
            <p className="text-2xl font-bold font-display mt-1">₹{totalCosts.toLocaleString()}</p>
          </div>
          <div className="stat-card border-primary/30">
            <p className="text-sm text-muted-foreground">Day Total</p>
            <p className="text-2xl font-bold font-display mt-1 text-primary">₹{grandTotal.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Monthly Summary Cards */}
      <div>
        <h2 className="font-display text-lg font-semibold mb-3">
          Monthly Total — {format(parse(currentMonth + "-01", "yyyy-MM-dd", new Date()), "MMMM yyyy")}
          <span className="text-sm font-normal text-muted-foreground ml-2">({monthlyStats.daysEntered} days entered)</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="stat-card">
            <p className="text-sm text-muted-foreground">Month Salaries</p>
            <p className="text-2xl font-bold font-display mt-1">₹{monthlyStats.totalSalaries.toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground">Month Costs</p>
            <p className="text-2xl font-bold font-display mt-1">₹{monthlyStats.totalCosts.toLocaleString()}</p>
          </div>
          <div className="stat-card border-primary/30">
            <p className="text-sm text-muted-foreground">Month Grand Total</p>
            <p className="text-2xl font-bold font-display mt-1 text-primary">₹{monthlyStats.grandTotal.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Salaries */}
      <Card className="p-5">
        <h2 className="font-display text-lg font-semibold mb-4">Employee Salaries</h2>
        <div className="grid gap-3">
          {employees.map((emp) => (
            <div key={emp.id} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs shrink-0">
                  {emp.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium truncate">{emp.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">₹</span>
                <Input
                  type="number"
                  min={0}
                  value={salaries[emp.id] || ""}
                  onChange={(e) =>
                    setSalaries({ ...salaries, [emp.id]: Number(e.target.value) })
                  }
                  placeholder="0"
                  className="w-28"
                />
              </div>
            </div>
          ))}
          {employees.length === 0 && (
            <p className="text-muted-foreground text-sm">Add employees in the Attendance page first.</p>
          )}
        </div>
      </Card>

      {/* Cost Categories */}
      <Card className="p-5">
        <h2 className="font-display text-lg font-semibold mb-4">Cost Categories</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {EXPENSE_CATEGORIES.map((cat) => (
            <div key={cat} className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium truncate">{cat}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">₹</span>
                <Input
                  type="number"
                  min={0}
                  value={costs[cat] || ""}
                  onChange={(e) => setCosts({ ...costs, [cat]: Number(e.target.value) })}
                  placeholder="0"
                  className="w-28"
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg" className="gap-2">
          <Save className="h-4 w-4" /> Save Expenses
        </Button>
      </div>
    </div>
  );
};

export default ExpensesPage;
