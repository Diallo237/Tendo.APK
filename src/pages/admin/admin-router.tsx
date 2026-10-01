import { Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "./layout";
import Dashboard from "./dashboard";
import Products from "./products";
import ProductView from "./product-view";
import Categories from "./categories";
import Orders from "./orders";
import Customers from "./customers";
import Suppliers from "./suppliers";
import SupplierRequests from "./supplier-requests";
import ArchivedProducts from "./archived-products";
import Commissions from "./commissions";
import DepotManagersAdmin from "./depot-managers";
import Statistics from "./statistics";
import Reports from "./reports";
import Settings from "./settings";
import Messages from "./messages";
import Profile from "./profile";
import Depots from "./depots";

export default function AdminRouter() {
  return (
    
    <Routes>
     {/* Layout de l'administration */}
      <Route element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="products/:id" element={<ProductView />} />
        <Route path="categories" element={<Categories />} />
        <Route path="archived-products" element={<ArchivedProducts />} />
        <Route path="orders" element={<Orders />} />
        <Route path="customers" element={<Customers />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="supplier-requests" element={<SupplierRequests />} />
        <Route path="depot-managers" element={<DepotManagersAdmin />} />
        <Route path="depots" element={<Depots />} />
        <Route path="statistics" element={<Statistics />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
        <Route path="commissions" element={<Commissions />} />
        <Route path="messages" element={<Messages />} />

        {/* Redirection par défaut */}
        <Route path="*" element={<Navigate to="/" replace />} />
        
      </Route>
      {/* Fin du layout de l'administration */}

      <Route path="profile" element={<Profile />} />
    </Routes>
  );
}