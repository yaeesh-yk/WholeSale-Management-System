import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { fmtCurrency, fmtDate, statusBadge } from '../lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, Users, Package, AlertTriangle,
  DollarSign, ArrowUpRight, Loader2, ShoppingCart
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className="card flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <p className="text-lg sm:text-xl font-bold text-slate-800 mt-0.5 leading-tight break-words">
          {value}
        </p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-slate-800 text-white px-3 py-2 rounded-xl text-sm shadow-xl">
        <p className="font-medium">{label}</p>
        <p className="text-primary-300">{fmtCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.dashboard()
      .then(setData)
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 size={32} className="animate-spin text-primary-500" />
    </div>
  );

  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Overview of your wholesale business</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Today's Sales"    value={fmtCurrency(data.todaySales)}       icon={DollarSign}     color="bg-primary-500" />
        <StatCard label="Monthly Sales"    value={fmtCurrency(data.monthlySales)}      icon={TrendingUp}     color="bg-emerald-500" />
        <StatCard label="Total Outstanding" value={fmtCurrency(data.totalOutstanding)} icon={Users}          color="bg-amber-500"   />
        <StatCard label="Low Stock Items"  value={data.lowStockCount}                  icon={AlertTriangle}  color="bg-red-500" sub="items below threshold" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="card xl:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-800">Sales — Last 7 Days</h2>
              <p className="text-xs text-slate-400 mt-0.5">Daily revenue overview</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.weeklySales} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => `Rs. ${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc', radius: 6 }} />
              <Bar dataKey="sales" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Low Stock Alert */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center">
              <AlertTriangle size={16} className="text-red-500" />
            </div>
            <h2 className="text-base font-bold text-slate-800">Low Stock</h2>
          </div>
          {data.lowStockProducts.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Package size={32} className="mx-auto mb-2 text-slate-300" />
              <p className="text-sm">All products are well-stocked!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.lowStockProducts.slice(0, 6).map(p => (
                <div key={p._id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.category}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.stock === 0 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                    {p.stock} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Lists Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Shopkeepers */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-800">Top Shopkeepers</h2>
            <Link to="/shopkeepers" className="text-xs text-primary-600 font-semibold flex items-center gap-1 hover:underline">
              View all <ArrowUpRight size={12} />
            </Link>
          </div>
          {data.topShopkeepers.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No data yet</p>
          ) : (
            <div className="space-y-3">
              {data.topShopkeepers.map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-700">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{s.name}</p>
                  </div>
                  <span className="text-sm font-bold text-primary-600">{fmtCurrency(s.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-800">Top Products</h2>
            <Link to="/products" className="text-xs text-primary-600 font-semibold flex items-center gap-1 hover:underline">
              View all <ArrowUpRight size={12} />
            </Link>
          </div>
          {data.topProducts.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No data yet</p>
          ) : (
            <div className="space-y-3">
              {data.topProducts.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{p.name}</p>
                  </div>
                  <span className="text-sm font-bold text-emerald-600">{p.qty} units</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-800">Recent Orders</h2>
          <Link to="/orders" className="text-xs text-primary-600 font-semibold flex items-center gap-1 hover:underline">
            View all <ArrowUpRight size={12} />
          </Link>
        </div>
        {data.recentOrders.length === 0 ? (
          <div className="text-center py-10">
            <ShoppingCart size={36} className="mx-auto mb-2 text-slate-200" />
            <p className="text-slate-400 text-sm">No orders yet. <Link to="/orders/new" className="text-primary-600 hover:underline">Create your first order</Link></p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full">
              <thead className="bg-slate-50 border-y border-slate-100">
                <tr>
                  {['Bill No.', 'Shopkeeper', 'Date', 'Total', 'Paid', 'Status'].map(h => (
                    <th key={h} className="table-header">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.recentOrders.map(o => (
                  <tr key={o._id} className="hover:bg-slate-50 transition-colors">
                    <td className="table-cell font-mono text-xs font-semibold text-primary-600">{o.billNo}</td>
                    <td className="table-cell font-medium">{o.shopkeeperId?.name || '—'}</td>
                    <td className="table-cell text-slate-500">{fmtDate(o.date)}</td>
                    <td className="table-cell font-semibold">{fmtCurrency(o.total)}</td>
                    <td className="table-cell">{fmtCurrency(o.amountPaid)}</td>
                    <td className="table-cell">
                      <span className={statusBadge(o.paymentStatus)}>{o.paymentStatus}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
