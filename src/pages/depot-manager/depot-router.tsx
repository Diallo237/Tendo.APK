import { Navigate, Route, Routes } from 'react-router-dom';
import DepotManagerLayout from './layout';
import DepotManagerDashboard from './dashboard';
import DepotManagerShipments from './shipments';
import DepotManagerSettings from './settings';

export default function DepotManagerRouter() {
    return (
        <Routes>
            <Route element={<DepotManagerLayout />}>
                <Route index element={<DepotManagerDashboard />} />
                <Route path="dashboard" element={<DepotManagerDashboard />} />
                <Route path="shipments" element={<DepotManagerShipments />} />
                <Route path="settings" element={<DepotManagerSettings />} />
                <Route path="*" element={<Navigate to="/depot-manager" replace />} />
            </Route>
        </Routes>
    );
}
