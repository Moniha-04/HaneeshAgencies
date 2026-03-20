// Simple localStorage-based store for attendance, leaves, and expenses

export interface Employee {
  id: string;
  name: string;
}

export interface AttendanceRecord {
  employeeId: string;
  date: string; // YYYY-MM-DD
  status: "present" | "absent" | "leave";
}

export interface CompanyLeave {
  date: string; // YYYY-MM-DD
  reason: string;
}

export interface DailyExpense {
  date: string; // YYYY-MM-DD
  salaries: { employeeId: string; amount: number }[];
  costs: Record<string, number>;
}

const EXPENSE_CATEGORIES = [
  "Milk", "Auto", "Tea", "Water", "Petrol", "Gate", "Diesel",
  "Unloaded Packing (Britania)", "Unloaded Packing (Sakthi)",
  "Cup (Tape, Twine)", "Poojai", "A4 Sheet", "Lemon"
];

export { EXPENSE_CATEGORIES };

function getItem<T>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Employees
export const getEmployees = (): Employee[] => getItem("employees", []);
export const saveEmployees = (e: Employee[]) => setItem("employees", e);

// Attendance
export const getAttendance = (): AttendanceRecord[] => getItem("attendance", []);
export const saveAttendance = (a: AttendanceRecord[]) => setItem("attendance", a);

// Leaves
export const getLeaves = (): CompanyLeave[] => getItem("companyLeaves", []);
export const saveLeaves = (l: CompanyLeave[]) => setItem("companyLeaves", l);

// Expenses
export const getExpenses = (): DailyExpense[] => getItem("dailyExpenses", []);
export const saveExpenses = (e: DailyExpense[]) => setItem("dailyExpenses", e);

// Product Sales
export const PRODUCT_NAMES = [
  "Britania",
  "Sakthi Masala",
  "MGM Oil",
  "Gogulam Dates",
  "Dodla",
] as const;

export type ProductName = (typeof PRODUCT_NAMES)[number];

export interface ProductDayEntry {
  date: string; // YYYY-MM-DD
  products: {
    name: ProductName;
    purchase: number; // primary / purchase cost
    sold: number;     // secondary / sold price
  }[];
}

export const getProductSales = (): ProductDayEntry[] => getItem("productSales", []);
export const saveProductSales = (p: ProductDayEntry[]) => setItem("productSales", p);
