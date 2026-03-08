import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Package, Leaf, FileText, LogOut, Menu, X, Settings } from "lucide-react";

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      navigate("/admin/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("admin_email");
    navigate("/admin/login");
  };

  const menuItems = [
    { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard, testId: "nav-dashboard" },
    { label: "SKUs", path: "/admin/skus", icon: Package, testId: "nav-skus" },
    { label: "Supplements", path: "/admin/supplements", icon: Leaf, testId: "nav-supplements" },
    { label: "Orders", path: "/admin/orders", icon: FileText, testId: "nav-orders" },
    { label: "RDA Settings", path: "/admin/rda-settings", icon: Settings, testId: "nav-rda-settings" }
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          data-testid="mobile-menu-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-[#5D4037] text-white p-2"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-[#D7CCC8] shadow-lg z-40 transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="p-6 border-b border-[#D7CCC8]">
          <h2 className="text-2xl font-bold text-[#5D4037]">Nutrition Admin</h2>
          <p className="text-xs text-[#795548] mt-1">{localStorage.getItem("admin_email")}</p>
        </div>

        <nav className="p-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                data-testid={item.testId}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all ${
                  isActive
                    ? "bg-[#5D4037] text-white"
                    : "text-[#5D4037] hover:bg-[#EFEBE9]"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#D7CCC8]">
          <Button
            data-testid="logout-button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-[#D32F2F] text-white hover:bg-[#B71C1C]"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 p-6 md:p-8 lg:p-12">
        {children}
      </main>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminLayout;
