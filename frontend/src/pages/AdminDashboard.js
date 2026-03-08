import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { getOrders, getSKUs, getSupplements } from "@/lib/api";
import { Package, Leaf, FileText, TrendingUp } from "lucide-react";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSKUs: 0,
    totalSupplements: 0,
    recentOrders: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [orders, skus, supplements] = await Promise.all([
          getOrders(),
          getSKUs(),
          getSupplements()
        ]);
        
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const recentOrders = orders.filter(o => new Date(o.created_at) > sevenDaysAgo).length;

        setStats({
          totalOrders: orders.length,
          totalSKUs: skus.length,
          totalSupplements: supplements.length,
          recentOrders
        });
      } catch (error) {
        console.error("Failed to load stats", error);
      }
    };
    loadStats();
  }, []);

  const statCards = [
    { label: "Total Orders", value: stats.totalOrders, icon: FileText, color: "bg-[#5D4037]", testId: "stat-total-orders" },
    { label: "SKUs", value: stats.totalSKUs, icon: Package, color: "bg-[#8A9A5B]", testId: "stat-total-skus" },
    { label: "Supplements", value: stats.totalSupplements, icon: Leaf, color: "bg-[#795548]", testId: "stat-total-supplements" },
    { label: "Recent (7d)", value: stats.recentOrders, icon: TrendingUp, color: "bg-[#A1887F]", testId: "stat-recent-orders" }
  ];

  return (
    <AdminLayout>
      <div data-testid="admin-dashboard">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#5D4037] mb-2">Dashboard</h1>
          <p className="text-[#795548]">Overview of your nutrition management system</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                data-testid={stat.testId}
                className="bg-white rounded-xl shadow-sm border border-[#D7CCC8]/50 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-[#5D4037] mb-1">{stat.value}</p>
                <p className="text-sm text-[#795548] uppercase tracking-wide">{stat.label}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            data-testid="quick-link-skus"
            onClick={() => navigate("/admin/skus")}
            className="bg-white rounded-xl shadow-sm border border-[#D7CCC8]/50 p-6 hover:shadow-md transition-all hover:-translate-y-1 text-left"
          >
            <Package className="w-8 h-8 text-[#5D4037] mb-3" />
            <h3 className="text-xl font-semibold text-[#5D4037] mb-2">Manage SKUs</h3>
            <p className="text-sm text-[#795548]">View and edit your product SKUs</p>
          </button>

          <button
            data-testid="quick-link-supplements"
            onClick={() => navigate("/admin/supplements")}
            className="bg-white rounded-xl shadow-sm border border-[#D7CCC8]/50 p-6 hover:shadow-md transition-all hover:-translate-y-1 text-left"
          >
            <Leaf className="w-8 h-8 text-[#8A9A5B] mb-3" />
            <h3 className="text-xl font-semibold text-[#5D4037] mb-2">Manage Supplements</h3>
            <p className="text-sm text-[#795548]">Add and edit supplement add-ons</p>
          </button>

          <button
            data-testid="quick-link-orders"
            onClick={() => navigate("/admin/orders")}
            className="bg-white rounded-xl shadow-sm border border-[#D7CCC8]/50 p-6 hover:shadow-md transition-all hover:-translate-y-1 text-left"
          >
            <FileText className="w-8 h-8 text-[#795548] mb-3" />
            <h3 className="text-xl font-semibold text-[#5D4037] mb-2">Manage Orders</h3>
            <p className="text-sm text-[#795548]">Create and track customer orders</p>
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
