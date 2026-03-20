import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { toast } from "sonner";

const APP_PASS_HASH = "a]9#kQ2$vLx7"; // obfuscated check token
const STORAGE_KEY = "stafftrack_auth";

function verifyPass(input: string): boolean {
  return input === "harshu@123";
}

const AuthContext = createContext<{ logout: () => void }>({ logout: () => {} });
export const useAuth = () => useContext(AuthContext);

export const AuthGate = ({ children }: { children: ReactNode }) => {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY) === APP_PASS_HASH) {
      setAuthed(true);
    }
    setLoading(false);
  }, []);

  const handleLogin = () => {
    if (verifyPass(password)) {
      sessionStorage.setItem(STORAGE_KEY, APP_PASS_HASH);
      setAuthed(true);
      toast.success("Welcome back!");
    } else {
      toast.error("Incorrect password");
    }
  };

  const logout = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setAuthed(false);
    setPassword("");
  };

  if (loading) return null;

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Lock className="h-7 w-7 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold">StaffTrack</h1>
            <p className="text-sm text-muted-foreground">Enter password to continue</p>
          </div>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              autoFocus
            />
            <Button onClick={handleLogin} className="w-full">
              Unlock
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ logout }}>
      {children}
    </AuthContext.Provider>
  );
};
