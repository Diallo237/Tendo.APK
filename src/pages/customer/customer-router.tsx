import { Routes, Route, Navigate } from 'react-router-dom';
import CustomerLayout from './layout';
import { CustomerHome } from './home';
import { CustomerProductDetail } from './product-detail';
import SettingsPage from './settings';
import CheckoutPage from './checkout';
import CustomerOrdersPage from './orders';
import FavoritesPage from './favorites';

export default function CustomerRouter() {
  return (
    <Routes>
      <Route element={<CustomerLayout />}>
        <Route index element={<CustomerHome />} />
        <Route path="product/:slug" element={<CustomerProductDetail />} />
        <Route path="profile" element={<Navigate to="/customer/settings" replace />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="orders" element={<CustomerOrdersPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="favorites" element={<FavoritesPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
