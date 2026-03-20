import { useState, useEffect } from "react";
import { format, startOfMonth, getDaysInMonth } from "date-fns";
import { getEmployees, getAttendance, getLeaves, getExpenses } from "@/lib/store";
import { Users, UserCheck, CalendarOff, Receipt } from "lucide-react";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    companyLeaves: 0,
    monthExpenses: 0,
  });

  useEffect(() => {
    const employees = getEmployees();
    const attendance = getAttendance();
    const leaves = getLeaves();
    const expenses = getExpenses();
    const today = format(new Date(), "yyyy-MM-dd");
    const currentMonth = format(new Date(), "yyyy-MM");

    const todayAttendance = attendance.filter((a) => a.date === today);
    const monthExpenses = expenses
      .filter((e) => e.date.startsWith(currentMonth))
      .reduce((sum, e) => {
        const salaryTotal = e.salaries.reduce((s, sal) => s + sal.amount, 0);
        const costTotal = Object.values(e.costs).reduce((s, c) => s + c, 0);
        return sum + salaryTotal + costTotal;
      }, 0);

    setStats({
      totalEmployees: employees.length,
      presentToday: todayAttendance.filter((a) => a.status === "present").length,
      absentToday: todayAttendance.filter((a) => a.status === "absent").length,
      companyLeaves: leaves.length,
      monthExpenses: monthExpenses,
    });
  }, []);

  const cards = [
    { label: "Total Employees", value: stats.totalEmployees, icon: Users, color: "text-primary" },
    { label: "Present Today", value: stats.presentToday, icon: UserCheck, color: "text-success" },
    { label: "Absent Today", value: stats.absentToday, icon: Users, color: "text-destructive" },
    { label: "Company Leaves", value: stats.companyLeaves, icon: CalendarOff, color: "text-accent-foreground" },
    { label: "This Month Expenses", value: `₹${stats.monthExpenses.toLocaleString()}`, icon: Receipt, color: "text-primary" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="page-header">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          {format(new Date(), "EEEE, dd MMMM yyyy")}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="stat-card">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <p className="text-3xl font-bold font-display mt-2">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
