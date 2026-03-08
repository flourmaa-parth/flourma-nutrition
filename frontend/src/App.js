import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "@/App.css";
import CustomerLookup from "@/pages/CustomerLookup";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import SKUManagement from "@/pages/SKUManagement";
import SupplementManagement from "@/pages/SupplementManagement";
import OrderManagement from "@/pages/OrderManagement";
import RDASettings from "@/pages/RDASettings";
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CustomerLookup />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/skus" element={<SKUManagement />} />
          <Route path="/admin/supplements" element={<SupplementManagement />} />
          <Route path="/admin/orders" element={<OrderManagement />} />
          <Route path="/admin/rda-settings" element={<RDASettings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
