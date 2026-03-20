import { NavLink, Outlet } from "react-router-dom";
import {
  Users, Calendar, Receipt, LayoutDashboard, ShoppingCart, FileText, CalendarDays,
  LogOut, Landmark, CalendarCheck, BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/AuthGate";
import { Button } from "@/components/ui/button";

const staffItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/attendance", icon: Users, label: "Attendance" },
  { to: "/leaves", icon: Calendar, label: "Company Leaves" },
  { to: "/expenses", icon: Receipt, label: "Daily Expenses" },
  { to: "/products", icon: ShoppingCart, label: "Product Sales" },
  { to: "/report", icon: FileText, label: "Daily Report" },
  { to: "/monthly-report", icon: CalendarDays, label: "Monthly Report" },
];

const finItems = [
  { to: "/fin-dashboard", icon: BarChart3, label: "Fin Dashboard" },
  { to: "/fin-expenses", icon: Receipt, label: "Fin Expenses" },
  { to: "/fin-sales", icon: ShoppingCart, label: "Fin Sales" },
  { to: "/bank-transactions", icon: Landmark, label: "Bank Txns" },
  { to: "/calendar", icon: CalendarCheck, label: "Calendar" },
  { to: "/fin-reports", icon: FileText, label: "Fin Reports" },
];

const NavItem = ({ item }: { item: typeof staffItems[0] }) => (
  <NavLink
    to={item.to}
    end={item.to === "/"}
    className={({ isActive }) =>
      cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-sidebar-accent text-sidebar-primary"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )
    }
  >
    <item.icon className="h-4 w-4" />
    {item.label}
  </NavLink>
);

const AppLayout = () => {
  const { logout } = useAuth();
  return (
    <div className="flex min-h-screen">
      <aside className="hidden md:flex w-64 flex-col bg-sidebar border-r border-sidebar-border overflow-y-auto">
        <div className="p-6">
          <h1 className="font-display text-xl font-bold text-sidebar-primary">StaffTrack</h1>
          <p className="text-xs text-sidebar-foreground mt-1">Company Management</p>
        </div>
        <nav className="flex-1 px-3 space-y-0.5">
          <p className="text-[10px] uppercase tracking-wider text-sidebar-foreground/50 px-3 pt-2 pb-1">Staff</p>
          {staffItems.map((item) => <NavItem key={item.to} item={item} />)}
          <div className="my-3 border-t border-sidebar-border" />
          <p className="text-[10px] uppercase tracking-wider text-sidebar-foreground/50 px-3 pt-1 pb-1">Finance</p>
          {finItems.map((item) => <NavItem key={item.to} item={item} />)}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <Button variant="ghost" size="sm" onClick={logout} className="w-full justify-start gap-2 text-sidebar-foreground">
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        </div>
      </aside>

      {/* Mobile nav - scrollable */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden bg-card border-t overflow-x-auto">
        {[...staffItems.slice(0, 2), ...finItems.slice(0, 4)].map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1 py-2 px-3 text-[10px] font-medium transition-colors shrink-0",
                isActive ? "text-primary" : "text-muted-foreground"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </div>

      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        <div className="p-6 md:p-8 max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
