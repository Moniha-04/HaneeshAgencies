import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { getLeaves, saveLeaves, CompanyLeave } from "@/lib/store";
import { CalendarPlus, Trash2, CalendarOff, Download } from "lucide-react";
import { toast } from "sonner";
import { downloadTablePdf } from "@/lib/pdf";

const LeavesPage = () => {
  const [leaves, setLeaves] = useState<CompanyLeave[]>([]);
  const [newDate, setNewDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [newReason, setNewReason] = useState("");

  useEffect(() => {
    setLeaves(getLeaves());
  }, []);

  const addLeave = () => {
    if (!newDate) return;
    if (leaves.some((l) => l.date === newDate)) {
      toast.error("Leave already exists for this date");
      return;
    }
    const updated = [...leaves, { date: newDate, reason: newReason.trim() || "Company Leave" }].sort(
      (a, b) => a.date.localeCompare(b.date)
    );
    setLeaves(updated);
    saveLeaves(updated);
    setNewReason("");
    toast.success("Company leave added");
  };

  const removeLeave = (date: string) => {
    const updated = leaves.filter((l) => l.date !== date);
    setLeaves(updated);
    saveLeaves(updated);
    toast.success("Leave removed");
  };

  const downloadLeavesPdf = () => {
    const rows = leaves.map((l) => [
      format(new Date(l.date + "T00:00:00"), "dd MMM yyyy (EEEE)"),
      l.reason,
    ]);
    downloadTablePdf({
      title: "Company Leaves",
      subtitle: `Total: ${leaves.length} leaves`,
      headers: ["Date", "Reason"],
      rows,
      filename: "company-leaves.pdf",
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-header">Company Leaves</h1>
          <p className="text-muted-foreground mt-1">Manage company-wide holidays and leave dates</p>
        </div>
        <Button variant="outline" size="sm" onClick={downloadLeavesPdf} className="gap-1">
          <Download className="h-4 w-4" /> Download PDF
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-sm font-medium mb-1 block">Date</label>
            <Input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-auto"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-1 block">Reason</label>
            <Input
              placeholder="e.g., Diwali, Pongal..."
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addLeave()}
            />
          </div>
          <Button onClick={addLeave}>
            <CalendarPlus className="h-4 w-4 mr-1" /> Add Leave
          </Button>
        </div>
      </Card>

      <div className="grid gap-3">
        {leaves.map((leave) => (
          <Card key={leave.date} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
                <CalendarOff className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="font-medium">
                  {format(new Date(leave.date + "T00:00:00"), "EEEE, dd MMMM yyyy")}
                </p>
                <p className="text-sm text-muted-foreground">{leave.reason}</p>
              </div>
            </div>
            <Button size="icon" variant="ghost" onClick={() => removeLeave(leave.date)} className="text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </Card>
        ))}
        {leaves.length === 0 && (
          <p className="text-muted-foreground text-center py-12">No company leaves added yet.</p>
        )}
      </div>
    </div>
  );
};

export default LeavesPage;
