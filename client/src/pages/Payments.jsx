import { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';
import { fmtCurrency, fmtDate } from '../lib/utils';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  CreditCard, Search, Loader2, ArrowUpRight,
  DollarSign, Calendar, TrendingUp, Info
} from 'lucide-react';

function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className="card flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold text-slate-800 mt-1 truncate">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getPayments();
      setPayments(data);
    } catch {
      toast.error('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const filteredPayments = payments.filter(p => {
    const matchesSearch =
      p.shopkeeperId?.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.shopkeeperId?.phone?.includes(search) ||
      p.orderId?.billNo?.toLowerCase().includes(search.toLowerCase());

    const matchesDate = !dateFilter || fmtDate(p.date) === fmtDate(dateFilter);

    return matchesSearch && matchesDate;
  });

  // Calculations
  const totalPaymentsCount = filteredPayments.length;
  const totalCollected = filteredPayments.reduce((s, p) => s + p.amountPaid, 0);
  const avgPayment = totalPaymentsCount > 0 ? totalCollected / totalPaymentsCount : 0;

  // Today's Collection
  const todayStr = fmtDate(new Date());
  const todayCollected = filteredPayments
    .filter(p => fmtDate(p.date) === todayStr)
    .reduce((s, p) => s + p.amountPaid, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Payments</h1>
        <p className="text-slate-500 text-sm mt-1">Track and audit payment collections from shopkeepers</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Collected" value={fmtCurrency(totalCollected)} icon={DollarSign} color="bg-emerald-500" />
        <StatCard label="Transactions" value={totalPaymentsCount} icon={CreditCard} color="bg-primary-500" />
        <StatCard label="Average Paid" value={fmtCurrency(avgPayment)} icon={TrendingUp} color="bg-cyan-500" />
        <StatCard label="Collected Today" value={fmtCurrency(todayCollected)} icon={Calendar} color="bg-amber-500" sub="transactions today" />
      </div>

      {/* Filter Options */}
      <div className="card grid grid-cols-1 md:grid-cols-3 gap-4 items-end p-4">
        {/* Search */}
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Search</label>
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="payments-search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input pl-9"
              placeholder="Search by shopkeeper name, phone or invoice number..."
            />
          </div>
        </div>

        {/* Date Filter */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Transaction Date</label>
          <div className="relative">
            <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              id="payments-date-filter"
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="input pl-9"
            />
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-primary-500" />
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-20">
            <CreditCard size={40} className="mx-auto mb-3 text-slate-200" />
            <p className="text-slate-500 font-medium">No payments found</p>
            <p className="text-slate-400 text-sm mt-1">Audit trail is currently empty or matches no filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Transaction Date', 'Shopkeeper', 'Ref Invoice', 'Note / Memo', 'Amount Paid'].map(h => (
                    <th key={h} className="table-header">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredPayments.map(p => (
                  <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                    <td className="table-cell text-slate-500 font-medium">{fmtDate(p.date)}</td>
                    <td className="table-cell">
                      {p.shopkeeperId ? (
                        <div>
                          <Link
                            to={`/shopkeepers/${p.shopkeeperId._id}`}
                            className="font-semibold text-slate-800 hover:text-primary-600 hover:underline"
                          >
                            {p.shopkeeperId.name}
                          </Link>
                          <p className="text-xs text-slate-400 font-medium">{p.shopkeeperId.phone}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400">Walk-in</span>
                      )}
                    </td>
                    <td className="table-cell font-mono text-xs">
                      {p.orderId ? (
                        <Link
                          to={`/orders/${p.orderId._id}/bill`}
                          className="font-bold text-primary-600 hover:underline inline-flex items-center gap-1"
                        >
                          {p.orderId.billNo}
                          <ArrowUpRight size={12} />
                        </Link>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="table-cell text-slate-500 text-sm italic">
                      {p.note ? (
                        <span className="inline-flex items-center gap-1">
                          <Info size={13} className="text-slate-300 flex-shrink-0" />
                          {p.note}
                        </span>
                      ) : (
                        <span className="text-slate-350">—</span>
                      )}
                    </td>
                    <td className="table-cell font-bold text-emerald-600 text-base">
                      {fmtCurrency(p.amountPaid)}
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
