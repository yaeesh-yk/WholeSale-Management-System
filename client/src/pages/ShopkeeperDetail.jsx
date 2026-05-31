import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { fmtCurrency, fmtDate, statusBadge } from '../lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Phone, MapPin, DollarSign,
  CreditCard, FileText, Loader2, X, Plus
} from 'lucide-react';

const paySchema = z.object({
  orderId:    z.string().min(1, 'Select an order'),
  amountPaid: z.coerce.number().positive('Amount must be > 0'),
  note:       z.string().optional(),
});

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box animate-slide-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={16} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function ShopkeeperDetail() {
  const { id } = useParams();
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [payModal, setPayModal] = useState(false);
  const [saving, setSaving]     = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(paySchema) });

  const load = useCallback(() => {
    setLoading(true);
    api.getShopkeeperHistory(id)
      .then(setData)
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const unpaidOrders = data?.orders.filter(o => o.paymentStatus !== 'Paid') || [];

  const onPaySubmit = async (vals) => {
    setSaving(true);
    try {
      await api.createPayment({ ...vals, shopkeeperId: id });
      toast.success('Payment recorded!');
      setPayModal(false);
      reset();
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 size={32} className="animate-spin text-primary-500" />
    </div>
  );

  if (!data) return null;
  const { shopkeeper, orders, payments } = data;

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link to="/shopkeepers" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary-600 transition-colors font-medium">
        <ArrowLeft size={16} /> Back to Shopkeepers
      </Link>

      {/* Profile Card */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-700 text-xl font-bold flex-shrink-0">
              {shopkeeper.name[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">{shopkeeper.name}</h1>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-500">
                <span className="flex items-center gap-1.5"><Phone size={14} />{shopkeeper.phone}</span>
                {shopkeeper.address && (
                  <span className="flex items-center gap-1.5"><MapPin size={14} />{shopkeeper.address}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-2">
            <div className="text-right">
              <p className="text-xs text-slate-400 font-medium">Total Outstanding</p>
              <p className={`text-2xl font-bold ${shopkeeper.totalOutstanding > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                {fmtCurrency(shopkeeper.totalOutstanding)}
              </p>
            </div>
            {unpaidOrders.length > 0 && (
              <button id="record-payment-btn" onClick={() => { reset(); setPayModal(true); }} className="btn-primary">
                <Plus size={16} /> Record Payment
              </button>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-800">{orders.length}</p>
            <p className="text-xs text-slate-400 mt-0.5">Total Orders</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">
              {orders.filter(o => o.paymentStatus === 'Paid').length}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Paid Orders</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary-600">
              {fmtCurrency(orders.reduce((s, o) => s + o.total, 0))}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Total Business</p>
          </div>
        </div>
      </div>

      {/* Order History */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <FileText size={18} className="text-slate-400" />
          <h2 className="text-base font-bold text-slate-800">Order History</h2>
          <span className="ml-auto text-xs text-slate-400">{orders.length} orders</span>
        </div>
        {orders.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <FileText size={32} className="mx-auto mb-2 text-slate-200" />
            <p className="text-sm">No orders yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Bill No.', 'Date', 'Total', 'Paid', 'Outstanding', 'Status', ''].map(h => (
                    <th key={h} className="table-header">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {orders.map(o => (
                  <tr key={o._id} className="hover:bg-slate-50 transition-colors">
                    <td className="table-cell font-mono text-xs font-semibold text-primary-600">{o.billNo}</td>
                    <td className="table-cell text-slate-500">{fmtDate(o.date)}</td>
                    <td className="table-cell font-semibold">{fmtCurrency(o.total)}</td>
                    <td className="table-cell text-emerald-600 font-medium">{fmtCurrency(o.amountPaid)}</td>
                    <td className="table-cell text-red-500 font-medium">{fmtCurrency(o.outstanding)}</td>
                    <td className="table-cell"><span className={statusBadge(o.paymentStatus)}>{o.paymentStatus}</span></td>
                    <td className="table-cell">
                      <Link to={`/orders/${o._id}/bill`} className="text-xs text-primary-600 hover:underline font-medium">View Bill</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment History */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <CreditCard size={18} className="text-slate-400" />
          <h2 className="text-base font-bold text-slate-800">Payment History</h2>
          <span className="ml-auto text-xs text-slate-400">{payments.length} payments</span>
        </div>
        {payments.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <CreditCard size={32} className="mx-auto mb-2 text-slate-200" />
            <p className="text-sm">No payments recorded</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Date', 'Amount', 'Note'].map(h => (
                    <th key={h} className="table-header">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {payments.map(p => (
                  <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                    <td className="table-cell text-slate-500">{fmtDate(p.date)}</td>
                    <td className="table-cell font-semibold text-emerald-600">{fmtCurrency(p.amountPaid)}</td>
                    <td className="table-cell text-slate-500">{p.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      <Modal open={payModal} onClose={() => setPayModal(false)} title="Record Payment">
        <form onSubmit={handleSubmit(onPaySubmit)} className="space-y-4">
          <div>
            <label className="label">Select Order *</label>
            <select id="pay-order-select" {...register('orderId')} className="input">
              <option value="">Choose an order...</option>
              {unpaidOrders.map(o => (
                <option key={o._id} value={o._id}>
                  {o.billNo} — Due: {fmtCurrency(o.outstanding)}
                </option>
              ))}
            </select>
            {errors.orderId && <p className="text-red-500 text-xs mt-1">{errors.orderId.message}</p>}
          </div>
          <div>
            <label className="label">Amount Paid *</label>
            <input id="pay-amount" type="number" step="0.01" {...register('amountPaid')} className="input" placeholder="0.00" />
            {errors.amountPaid && <p className="text-red-500 text-xs mt-1">{errors.amountPaid.message}</p>}
          </div>
          <div>
            <label className="label">Note</label>
            <input id="pay-note" {...register('note')} className="input" placeholder="Optional note" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setPayModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button id="pay-save-btn" type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <DollarSign size={16} />}
              {saving ? 'Saving...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
