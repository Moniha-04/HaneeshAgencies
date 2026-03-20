import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthGate } from "@/components/AuthGate";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import AttendancePage from "@/pages/AttendancePage";
import LeavesPage from "@/pages/LeavesPage";
import ExpensesPage from "@/pages/ExpensesPage";
import ProductsPage from "@/pages/ProductsPage";
import DailyReportPage from "@/pages/DailyReportPage";
import MonthlyReportPage from "@/pages/MonthlyReportPage";
import FinDashboard from "@/pages/FinDashboard";
import FinExpensesPage from "@/pages/FinExpensesPage";
import FinSalesPage from "@/pages/FinSalesPage";
import BankTransactionsPage from "@/pages/BankTransactionsPage";
import CalendarPage from "@/pages/CalendarPage";
import FinReportsPage from "@/pages/FinReportsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthGate>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/attendance" element={<AttendancePage />} />
              <Route path="/leaves" element={<LeavesPage />} />
              <Route path="/expenses" element={<ExpensesPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/report" element={<DailyReportPage />} />
              <Route path="/monthly-report" element={<MonthlyReportPage />} />
              <Route path="/fin-dashboard" element={<FinDashboard />} />
              <Route path="/fin-expenses" element={<FinExpensesPage />} />
              <Route path="/fin-sales" element={<FinSalesPage />} />
              <Route path="/bank-transactions" element={<BankTransactionsPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/fin-reports" element={<FinReportsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthGate>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
