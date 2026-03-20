import { useState, useEffect } from "react";
import { format, getDaysInMonth, startOfMonth, parse } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getEmployees,
  saveEmployees,
  getAttendance,
  saveAttendance,
  getLeaves,
  Employee,
  AttendanceRecord,
} from "@/lib/store";
import { Plus, Trash2, UserCheck, UserX, CalendarOff, Download } from "lucide-react";
import { toast } from "sonner";
import { downloadTablePdf } from "@/lib/pdf";

const AttendancePage = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [companyLeaves, setCompanyLeaves] = useState<string[]>([]);
  const [newName, setNewName] = useState("");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));

  // Sync: when date changes, update month to match
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    if (date.length >= 7) setSelectedMonth(date.substring(0, 7));
  };

  // Sync: when month changes, set date to 1st of that month
  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    setSelectedDate(month + "-01");
  };

  useEffect(() => {
    setEmployees(getEmployees());
    setAttendance(getAttendance());
    setCompanyLeaves(getLeaves().map((l) => l.date));
  }, []);

  const addEmployee = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const updated = [...employees, { id: crypto.randomUUID(), name: trimmed }];
    setEmployees(updated);
    saveEmployees(updated);
    setNewName("");
    toast.success(`${trimmed} added`);
  };

  const removeEmployee = (id: string) => {
    const updated = employees.filter((e) => e.id !== id);
    setEmployees(updated);
    saveEmployees(updated);
    const updatedAtt = attendance.filter((a) => a.employeeId !== id);
    setAttendance(updatedAtt);
    saveAttendance(updatedAtt);
    toast.success("Employee removed");
  };

  const markAttendance = (employeeId: string, status: AttendanceRecord["status"]) => {
    const existing = attendance.filter(
      (a) => !(a.employeeId === employeeId && a.date === selectedDate)
    );
    const updated = [...existing, { employeeId, date: selectedDate, status }];
    setAttendance(updated);
    saveAttendance(updated);
  };

  const getStatus = (employeeId: string, date: string) => {
    return attendance.find((a) => a.employeeId === employeeId && a.date === date)?.status;
  };

  const isCompanyLeave = (date: string) => companyLeaves.includes(date);

  // Monthly summary
  const monthDate = parse(selectedMonth + "-01", "yyyy-MM-dd", new Date());
  const daysInMonth = getDaysInMonth(monthDate);

  const getMonthlySummary = (employeeId: string) => {
    let present = 0;
    let absent = 0;
    let leave = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = format(new Date(monthDate.getFullYear(), monthDate.getMonth(), d), "yyyy-MM-dd");
      const status = getStatus(employeeId, dateStr);
      if (status === "present") present++;
      else if (status === "absent") absent++;
      else if (status === "leave" || isCompanyLeave(dateStr)) leave++;
    }
    return { present, absent, leave };
  };

  const downloadAttendancePdf = () => {
    const rows = employees.map((emp) => {
      const s = getMonthlySummary(emp.id);
      return [emp.name, s.present, s.absent, s.leave, daysInMonth];
    });
    downloadTablePdf({
      title: "Attendance Summary",
      subtitle: format(monthDate, "MMMM yyyy"),
      headers: ["Employee", "Present", "Absent", "Leave", "Total Days"],
      rows,
      filename: `attendance-${selectedMonth}.pdf`,
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="page-header">Attendance</h1>
        <p className="text-muted-foreground mt-1">Mark daily attendance and view monthly summary</p>
      </div>

      {/* Add Employee */}
      <Card className="p-4">
        <div className="flex gap-3">
          <Input
            placeholder="Enter employee name..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addEmployee()}
            className="max-w-xs"
          />
          <Button onClick={addEmployee} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Add Employee
          </Button>
        </div>
      </Card>

      {/* Mark Attendance */}
      <div>
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <h2 className="font-display text-xl font-semibold">Mark Attendance</h2>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-auto"
          />
        </div>

        {isCompanyLeave(selectedDate) && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-accent p-3 text-accent-foreground text-sm">
            <CalendarOff className="h-4 w-4" />
            This date is a company leave.
          </div>
        )}

        <div className="grid gap-3">
          {employees.map((emp) => {
            const status = getStatus(emp.id, selectedDate);
            return (
              <Card key={emp.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                    {emp.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium">{emp.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={status === "present" ? "default" : "outline"}
                    onClick={() => markAttendance(emp.id, "present")}
                    className="gap-1"
                  >
                    <UserCheck className="h-3.5 w-3.5" /> Present
                  </Button>
                  <Button
                    size="sm"
                    variant={status === "absent" ? "destructive" : "outline"}
                    onClick={() => markAttendance(emp.id, "absent")}
                    className="gap-1"
                  >
                    <UserX className="h-3.5 w-3.5" /> Absent
                  </Button>
                  <Button
                    size="sm"
                    variant={status === "leave" ? "secondary" : "outline"}
                    onClick={() => markAttendance(emp.id, "leave")}
                    className="gap-1"
                  >
                    <CalendarOff className="h-3.5 w-3.5" /> Leave
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeEmployee(emp.id)}
                    className="text-destructive ml-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
          {employees.length === 0 && (
            <p className="text-muted-foreground text-center py-8">No employees added yet. Add one above.</p>
          )}
        </div>
      </div>

      {/* Monthly Summary */}
      <div>
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <h2 className="font-display text-xl font-semibold">Monthly Summary</h2>
          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="w-auto"
          />
          <Button variant="outline" size="sm" onClick={downloadAttendancePdf} className="gap-1 ml-auto">
            <Download className="h-4 w-4" /> PDF
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold">Employee</th>
                <th className="text-center py-3 px-4 font-semibold">Present</th>
                <th className="text-center py-3 px-4 font-semibold">Absent</th>
                <th className="text-center py-3 px-4 font-semibold">Leave</th>
                <th className="text-center py-3 px-4 font-semibold">Total Days</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => {
                const summary = getMonthlySummary(emp.id);
                return (
                  <tr key={emp.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4 font-medium">{emp.name}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="default" className="bg-success text-success-foreground">{summary.present}</Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="destructive">{summary.absent}</Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="secondary">{summary.leave}</Badge>
                    </td>
                    <td className="py-3 px-4 text-center text-muted-foreground">{daysInMonth}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {employees.length === 0 && (
            <p className="text-muted-foreground text-center py-8">No employees to show.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;
