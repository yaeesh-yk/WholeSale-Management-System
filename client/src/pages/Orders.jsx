import { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';
import { fmtCurrency, fmtDate, statusBadge } from '../lib/utils';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Search, FileText, ShoppingCart, Loader2, ArrowUpRight,
  Filter, Calendar, DollarSign, CreditCard, AlertCircle
} from 'lucide-react';

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="card flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold text-slate-800 mt-1">{value}</p>
      </div>
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const data = await api.getOrders(params);
      setOrders(data);
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Client-side search and status filtering
  const filteredOrders = orders.filter(o => {
    const matchesSearch =
      o.billNo.toLowerCase().includes(search.toLowerCase()) ||
      o.shopkeeperId?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.shopkeeperId?.phone?.includes(search);

    const matchesStatus = statusFilter === 'All' || o.paymentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate high-level metrics of filtered set
  const totalSales = filteredOrders.reduce((s, o) => s + o.total, 0);
  const totalPaid = filteredOrders.reduce((s, o) => s + o.amountPaid, 0);
  const totalOutstanding = filteredOrders.reduce((s, o) => s + o.outstanding, 0);
  const totalOrders = filteredOrders.length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Orders</h1>
          <p className="text-slate-500 text-sm mt-1">Manage and track all wholesale invoices</p>
        </div>
        <Link to="/orders/new" className="btn-primary">
          <ShoppingCart size={17} /> Create New Order
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Orders" value={totalOrders} icon={FileText} color="bg-primary-500" />
        <StatCard label="Total Sales" value={fmtCurrency(totalSales)} icon={DollarSign} color="bg-emerald-500" />
        <StatCard label="Total Collected" value={fmtCurrency(totalPaid)} icon={CreditCard} color="bg-cyan-500" />
        <StatCard label="Total Credit" value={fmtCurrency(totalOutstanding)} icon={AlertCircle} color="bg-red-500" />
      </div>

      {/* Filters Bar */}
      <div className="card grid grid-cols-1 md:grid-cols-4 gap-4 items-end p-4">
        {/* Search */}
        <div className="md:col-span-1 space-y-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Search</label>
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="orders-search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input pl-9"
              placeholder="Bill No. or Shopkeeper..."
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Payment Status</label>
          <div className="relative">
            <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              id="orders-status-filter"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="input pl-9"
            >
              <option value="All">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Partial">Partial</option>
              <option value="Unpaid">Unpaid</option>
            </select>
          </div>
        </div>

        {/* Start Date */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Start Date</label>
          <div className="relative">
            <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              id="orders-start-date"
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="input pl-9"
            />
          </div>
        </div>

        {/* End Date */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">End Date</label>
          <div className="relative">
            <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              id="orders-end-date"
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="input pl-9"
            />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-primary-500" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20">
            <FileText size={40} className="mx-auto mb-3 text-slate-200" />
            <p className="text-slate-500 font-medium">No orders found</p>
            <p className="text-slate-400 text-sm mt-1">Try relaxing your search or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Bill No.', 'Shopkeeper', 'Date', 'Total', 'Paid', 'Outstanding', 'Status', 'Actions'].map(h => (
                    <th key={h} className="table-header">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredOrders.map(o => (
                  <tr key={o._id} className="hover:bg-slate-50 transition-colors">
                    <td className="table-cell font-mono text-xs font-semibold text-primary-600">
                      {o.billNo}
                    </td>
                    <td className="table-cell font-medium text-slate-800">
                      {o.shopkeeperId ? (
                        <Link to={`/shopkeepers/${o.shopkeeperId._id}`} className="hover:underline hover:text-primary-600">
                          {o.shopkeeperId.name}
                        </Link>
                      ) : (
                        <span className="text-slate-400">Walk-in</span>
                      )}
                    </td>
                    <td className="table-cell text-slate-500">{fmtDate(o.date)}</td>
                    <td className="table-cell font-bold text-slate-800">{fmtCurrency(o.total)}</td>
                    <td className="table-cell text-emerald-600 font-semibold">{fmtCurrency(o.amountPaid)}</td>
                    <td className="table-cell text-red-500 font-semibold">{fmtCurrency(o.outstanding)}</td>
                    <td className="table-cell">
                      <span className={statusBadge(o.paymentStatus)}>{o.paymentStatus}</span>
                    </td>
                    <td className="table-cell">
                      <Link
                        to={`/orders/${o._id}/bill`}
                        className="inline-flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 font-bold hover:underline"
                      >
                        Bill View <ArrowUpRight size={13} />
                      </Link>
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
