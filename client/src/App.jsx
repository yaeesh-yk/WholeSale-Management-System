import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Shopkeepers from './pages/Shopkeepers';
import ShopkeeperDetail from './pages/ShopkeeperDetail';
import Products from './pages/Products';
import NewOrder from './pages/NewOrder';
import Orders from './pages/Orders';
import Payments from './pages/Payments';
import BillView from './pages/BillView';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes inside App Layout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/shopkeepers" element={<Shopkeepers />} />
            <Route path="/shopkeepers/:id" element={<ShopkeeperDetail />} />
            <Route path="/products" element={<Products />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/new" element={<NewOrder />} />
            <Route path="/orders/:id/bill" element={<BillView />} />
            <Route path="/payments" element={<Payments />} />
          </Route>
        </Route>

        {/* Redirect Root & Fallback */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
