import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Wheat, Lock } from "lucide-react";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await login(email, password);
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("admin_email", data.email);
      toast.success("Login successful!");
      navigate("/admin/dashboard");
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Invalid credentials");
      } else {
        toast.error("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-lg p-8 border border-[#D7CCC8]/50">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#5D4037] rounded-full mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-[#5D4037] mb-2">Admin Login</h1>
            <p className="text-sm text-[#795548]">Nutrition Management System</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-sm font-medium uppercase tracking-wider text-[#5D4037] mb-2 block">
                Email Address
              </Label>
              <Input
                id="email"
                data-testid="admin-email-input"
                type="email"
                placeholder="admin@nutrition.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-md border-[#D7CCC8] bg-white px-4 py-3 text-[#5D4037]"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-medium uppercase tracking-wider text-[#5D4037] mb-2 block">
                Password
              </Label>
              <Input
                id="password"
                data-testid="admin-password-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="rounded-md border-[#D7CCC8] bg-white px-4 py-3 text-[#5D4037]"
              />
            </div>

            <Button
              data-testid="admin-login-button"
              type="submit"
              disabled={loading}
              className="w-full rounded-md px-6 py-3 font-medium transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md bg-[#5D4037] text-white hover:bg-[#4E342E]"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-[#EFEBE9] rounded-md">
            <p className="text-xs text-[#795548] font-medium">Demo Credentials:</p>
            <p className="text-xs text-[#5D4037] mt-1">Email: admin@nutrition.com</p>
            <p className="text-xs text-[#5D4037]">Password: admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
