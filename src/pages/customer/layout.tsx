import { Outlet } from 'react-router-dom';
import { CustomerHeader } from './customer-header';

export default function CustomerLayout() {
  return (
    <div className="min-h-screen">
      <CustomerHeader />
      <Outlet />
      {/* <CartModal /> */}
    </div>
  );
}
