import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  LayoutDashboard, Users, Package, ShoppingCart,
  CreditCard, FileText, LogOut, X, TrendingUp
} from 'lucide-react';

const links = [
  { to: '/dashboard',  label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/shopkeepers',label: 'Shopkeepers', icon: Users },
  { to: '/products',   label: 'Products',    icon: Package },
  { to: '/orders/new', label: 'New Order',   icon: ShoppingCart },
  { to: '/orders',     label: 'Orders',      icon: FileText },
  { to: '/payments',   label: 'Payments',    icon: CreditCard },
];

function SidebarContent({ username, onLogout, onNavigate }) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center shadow-md shadow-primary-200">
            <TrendingUp size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800 leading-none">WholeSale</h1>
            <p className="text-[10px] text-slate-400 mt-0.5">Management System</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-slate-100">
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-50 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-sm font-bold">
            {username?.[0]?.toUpperCase() || 'A'}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">{username || 'Admin'}</p>
            <p className="text-xs text-slate-400">Administrator</p>
          </div>
        </div>
        <button type="button" onClick={onLogout} className="sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600">
          <LogOut size={17} />
          Logout
        </button>
      </div>
    </div>
  );
}

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const { username, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-slate-100 h-screen sticky top-0">
        <SidebarContent
          username={username}
          onLogout={handleLogout}
          onNavigate={() => setMobileOpen?.(false)}
        />
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white shadow-2xl z-50 animate-fade-in">
            <div className="absolute top-4 right-4">
              <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg hover:bg-slate-100">
                <X size={18} className="text-slate-500" />
              </button>
            </div>
            <SidebarContent
              username={username}
              onLogout={handleLogout}
              onNavigate={() => setMobileOpen?.(false)}
            />
          </aside>
        </div>
      )}
    </>
  );
}
