import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { fmtCurrency } from '../lib/utils';
import toast from 'react-hot-toast';
import {
  Search, Plus, Minus, Trash2, ChevronRight,
  ShoppingCart, Loader2, CheckCircle2
} from 'lucide-react';

const STEPS = ['Shopkeeper', 'Products', 'Summary', 'Payment'];

export default function NewOrder() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 0
  const [shopkeepers, setShopkeepers] = useState([]);
  const [skSearch, setSkSearch]       = useState('');
  const [selectedSk, setSelectedSk]  = useState(null);

  // Step 1
  const [products, setProducts]  = useState([]);
  const [prodSearch, setProdSearch] = useState('');
  const [orderItems, setOrderItems] = useState([]);

  // Step 2
  const [discount, setDiscount] = useState(0);

  // Step 3
  const [amountPaid, setAmountPaid] = useState(0);

  // Fetch shopkeepers on search
  useEffect(() => {
    api.getShopkeepers(skSearch).then(setShopkeepers).catch(() => {});
  }, [skSearch]);

  // Fetch products on search
  useEffect(() => {
    if (step === 1) api.getProducts(prodSearch).then(setProducts).catch(() => {});
  }, [prodSearch, step]);

  const subtotal = orderItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const total    = Math.max(0, subtotal - discount);
  const outstanding = Math.max(0, total - amountPaid);
  const paymentStatus = amountPaid >= total ? 'Paid' : amountPaid > 0 ? 'Partial' : 'Unpaid';

  const addProduct = (product) => {
    setOrderItems(prev => {
      const existing = prev.find(i => i.productId === product._id);
      if (existing) return prev.map(i => i.productId === product._id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { productId: product._id, productName: product.name, unitPrice: product.price, quantity: 1, stock: product.stock }];
    });
  };

  const updateQty = (productId, qty) => {
    if (qty <= 0) { removeItem(productId); return; }
    setOrderItems(prev => prev.map(i => i.productId === productId ? { ...i, quantity: qty } : i));
  };

  const removeItem = (productId) => setOrderItems(prev => prev.filter(i => i.productId !== productId));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const order = await api.createOrder({
        shopkeeperId: selectedSk._id,
        items: orderItems.map(i => ({ productId: i.productId, quantity: i.quantity })),
        discount,
        amountPaid,
      });
      toast.success('Order created!');
      navigate(`/orders/${order._id}/bill`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const canNext = [
    !!selectedSk,
    orderItems.length > 0,
    true,
    true,
  ][step];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">New Order</h1>
        <p className="text-slate-500 text-sm mt-1">Create a new wholesale order</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className={`flex flex-col items-center gap-1`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                ${i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-primary-600 text-white shadow-md shadow-primary-200' : 'bg-slate-100 text-slate-400'}`}>
                {i < step ? <CheckCircle2 size={16} /> : i + 1}
              </div>
              <span className={`text-xs font-medium ${i === step ? 'text-primary-600' : 'text-slate-400'}`}>{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-4 rounded ${i < step ? 'bg-emerald-400' : 'bg-slate-100'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="card animate-fade-in">

        {/* Step 0: Select Shopkeeper */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-800">Select Shopkeeper</h2>
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="order-sk-search"
                value={skSearch}
                onChange={e => setSkSearch(e.target.value)}
                className="input pl-10"
                placeholder="Search shopkeeper..."
              />
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {shopkeepers.length === 0 && (
                <p className="text-center py-8 text-slate-400 text-sm">No shopkeepers found</p>
              )}
              {shopkeepers.map(sk => (
                <button
                  key={sk._id}
                  id={`select-sk-${sk._id}`}
                  onClick={() => setSelectedSk(sk)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all text-left
                    ${selectedSk?._id === sk._id
                      ? 'border-primary-400 bg-primary-50 shadow-sm'
                      : 'border-slate-100 hover:border-primary-200 hover:bg-slate-50'}`}
                >
                  <div>
                    <p className="font-semibold text-slate-800">{sk.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{sk.phone} · {sk.address || 'No address'}</p>
                  </div>
                  {selectedSk?._id === sk._id && (
                    <CheckCircle2 size={20} className="text-primary-500 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Add Products */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <h2 className="text-base font-bold text-slate-800">Add Products</h2>
              <span className="text-xs text-slate-400 font-medium">{orderItems.length} item(s) added</span>
            </div>
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="order-prod-search"
                value={prodSearch}
                onChange={e => setProdSearch(e.target.value)}
                className="input pl-10"
                placeholder="Search products..."
              />
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-100 rounded-xl p-2">
              {products.filter(p => !orderItems.find(i => i.productId === p._id)).map(p => (
                <button
                  key={p._id}
                  id={`add-prod-${p._id}`}
                  onClick={() => addProduct(p)}
                  disabled={p.stock === 0}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors text-left disabled:opacity-40"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.category} · Stock: {p.stock}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-primary-600">{fmtCurrency(p.price)}</span>
                    <Plus size={16} className="text-primary-500" />
                  </div>
                </button>
              ))}
              {products.length === 0 && <p className="text-center py-4 text-sm text-slate-400">No products found</p>}
            </div>

            {/* Added Items */}
            {orderItems.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Added Items</p>
                {orderItems.map(item => (
                  <div key={item.productId} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{item.productName}</p>
                      <p className="text-xs text-slate-400">{fmtCurrency(item.unitPrice)} × {item.quantity} = {fmtCurrency(item.unitPrice * item.quantity)}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => updateQty(item.productId, item.quantity - 1)}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors">
                        <Minus size={13} />
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={e => updateQty(item.productId, parseInt(e.target.value) || 0)}
                        min={1} max={item.stock}
                        className="w-12 text-center text-sm font-bold border border-slate-200 rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-primary-400"
                      />
                      <button onClick={() => updateQty(item.productId, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors disabled:opacity-40">
                        <Plus size={13} />
                      </button>
                      <button onClick={() => removeItem(item.productId)}
                        className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-slate-300 hover:text-red-400 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-end pt-1">
                  <p className="text-sm font-bold text-slate-700">Subtotal: <span className="text-primary-600">{fmtCurrency(subtotal)}</span></p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Summary */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-800">Order Summary</h2>
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Shopkeeper</span>
                <span className="font-semibold text-slate-800">{selectedSk?.name}</span>
              </div>
              <div className="border-t border-slate-100 pt-2 mt-2 space-y-1.5">
                {orderItems.map(item => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <span className="text-slate-600">{item.productName} × {item.quantity}</span>
                    <span className="font-medium text-slate-800">{fmtCurrency(item.unitPrice * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-100 pt-2 flex justify-between text-sm font-semibold">
                <span className="text-slate-600">Subtotal</span>
                <span>{fmtCurrency(subtotal)}</span>
              </div>
            </div>
            <div>
              <label className="label">Discount (Rs.)</label>
              <input
                id="order-discount"
                type="number"
                min={0}
                max={subtotal}
                value={discount}
                onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                className="input"
                placeholder="0"
              />
            </div>
            <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 flex justify-between">
              <span className="font-bold text-slate-700">Grand Total</span>
              <span className="text-xl font-bold text-primary-700">{fmtCurrency(total)}</span>
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-800">Payment</h2>
            <div className="bg-slate-50 rounded-xl p-4 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Grand Total</span>
                <span className="font-bold">{fmtCurrency(total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Paid Now</span>
                <span className="font-bold text-emerald-600">{fmtCurrency(amountPaid)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1.5">
                <span className="text-slate-500">Outstanding</span>
                <span className={`font-bold ${outstanding > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{fmtCurrency(outstanding)}</span>
              </div>
            </div>
            <div>
              <label className="label">Amount Paid Now (Rs.)</label>
              <input
                id="order-amount-paid"
                type="number"
                min={0}
                max={total}
                step="0.01"
                value={amountPaid}
                onChange={e => setAmountPaid(parseFloat(e.target.value) || 0)}
                className="input"
                placeholder="0 for full credit"
              />
              <p className="text-xs text-slate-400 mt-1">Leave 0 to create a fully unpaid (credit) order</p>
            </div>
            <div className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 bg-white">
              <div className={`w-3 h-3 rounded-full ${paymentStatus === 'Paid' ? 'bg-emerald-500' : paymentStatus === 'Partial' ? 'bg-amber-400' : 'bg-red-400'}`} />
              <span className="text-sm font-semibold text-slate-700">Status: {paymentStatus}</span>
            </div>
          </div>
        )}
      </div>

      {/* Nav Buttons */}
      <div className="flex gap-3">
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} className="btn-secondary flex-1 justify-center">
            Back
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button
            id={`next-step-${step}`}
            onClick={() => setStep(s => s + 1)}
            disabled={!canNext}
            className="btn-primary flex-1 justify-center"
          >
            Next <ChevronRight size={16} />
          </button>
        ) : (
          <button
            id="create-order-btn"
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary flex-1 justify-center"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <ShoppingCart size={16} />}
            {loading ? 'Creating...' : 'Generate Bill'}
          </button>
        )}
      </div>
    </div>
  );
}
