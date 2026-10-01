import { Navigate, Route, Routes } from 'react-router-dom';
import SupplierLayout from './layout';
import SupplierDashboard from './supplier-dashboard';
import SupplierProducts from './products';
import SupplierProductView from './product-view';
import SupplierOrders from './orders';
import SupplierStatistics from './statistics';
import SupplierReports from './reports';
import SupplierProductReviews from './product-reviews';
import SupplierSettings from './settings';
import SupplierMessages from './messages';
import SupplierCategories from './categories';
export default function SupplierRouter() {
    return (
        <Routes>
            {/* Layout de l'administration */}
            <Route element={<SupplierLayout />}>
                <Route index element={<SupplierDashboard/>}/>
                <Route path="dashboard" element={<SupplierDashboard/>}/>
                <Route path="categories" element={<SupplierCategories />} />
                <Route path="products" element={<SupplierProducts />} />
                <Route path="products/:id" element={<SupplierProductView />} />
                <Route path="orders" element={<SupplierOrders />} />
                <Route path="statistics" element={<SupplierStatistics />} />
                <Route path="reports" element={<SupplierReports />} />
                <Route path="reviews" element={<SupplierProductReviews />} />
                <Route path="settings" element={<SupplierSettings />} />
                <Route path="messages" element={<SupplierMessages />} />
                <Route path="profile" element={<Navigate to="/supplier/settings" replace />} />

                {/* Redirection par défaut */}
                <Route path="*" element={<Navigate to="/" replace />} />

            </Route>
        </Routes>
    )
}