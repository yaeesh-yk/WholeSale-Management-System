import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { fmtCurrency } from '../lib/utils';
import toast from 'react-hot-toast';
import {
  ArrowLeft, CheckCircle2, Loader2, Minus, Plus, Save, Search, Trash2
} from 'lucide-react';

export default function EditOrder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shopkeepers, setShopkeepers] = useState([]);
  const [products, setProducts] = useState([]);
  const [shopkeeperId, setShopkeeperId] = useState('');
  const [orderItems, setOrderItems] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [skSearch, setSkSearch] = useState('');
  const [prodSearch, setProdSearch] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const [order, shopkeeperData, productData] = await Promise.all([
          api.getOrder(id),
          api.getShopkeepers(),
          api.getProducts(),
        ]);

        if (cancelled) return;

        const stockByProduct = new Map(productData.map(product => [product._id, product.stock]));
        const items = order.items.map(item => ({
          productId: item.productId,
          productName: item.productName,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          stock: (stockByProduct.get(item.productId) ?? 0) + item.quantity,
        }));

        setShopkeepers(shopkeeperData);
        setProducts(productData);
        setShopkeeperId(order.shopkeeperId?._id || '');
        setOrderItems(items);
        setDiscount(order.discount || 0);
        setAmountPaid(order.amountPaid || 0);
      } catch (err) {
        toast.error(err.message || 'Failed to load order');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const subtotal = orderItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const total = Math.max(0, subtotal - discount);
  const outstanding = Math.max(0, total - amountPaid);
  const paymentStatus = amountPaid >= total ? 'Paid' : amountPaid > 0 ? 'Partial' : 'Unpaid';

  const selectedShopkeeper = shopkeepers.find(shopkeeper => shopkeeper._id === shopkeeperId);
  const filteredShopkeepers = shopkeepers.filter(shopkeeper =>
    shopkeeper.name.toLowerCase().includes(skSearch.toLowerCase()) ||
    shopkeeper.phone.includes(skSearch)
  );
  const filteredProducts = products.filter(product =>
    !orderItems.find(item => item.productId === product._id) &&
    (
      product.name.toLowerCase().includes(prodSearch.toLowerCase()) ||
      product.category?.toLowerCase().includes(prodSearch.toLowerCase())
    )
  );

  const addProduct = (product) => {
    setOrderItems(prev => [
      ...prev,
      {
        productId: product._id,
        productName: product.name,
        unitPrice: product.price,
        quantity: 1,
        stock: product.stock,
      },
    ]);
  };

  const updateQty = (productId, qty) => {
    if (qty <= 0) {
      setOrderItems(prev => prev.filter(item => item.productId !== productId));
      return;
    }

    setOrderItems(prev => prev.map(item =>
      item.productId === productId ? { ...item, quantity: Math.min(item.stock, qty) } : item
    ));
  };

  const handleSubmit = async () => {
    if (!shopkeeperId || orderItems.length === 0) {
      toast.error('Select a shopkeeper and at least one product');
      return;
    }

    setSaving(true);
    try {
      const updated = await api.updateOrder(id, {
        shopkeeperId,
        items: orderItems.map(item => ({ productId: item.productId, quantity: item.quantity })),
        discount,
        amountPaid,
      });
      toast.success('Order updated');
      navigate(`/orders/${updated._id}/bill`);
    } catch (err) {
      toast.error(err.message || 'Failed to update order');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link to={`/orders/${id}/bill`} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary-600 font-medium mb-3">
            <ArrowLeft size={16} /> Back to Bill
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">Edit Order</h1>
          <p className="text-slate-500 text-sm mt-1">Correct order details before later payments are recorded</p>
        </div>
        <button onClick={handleSubmit} disabled={saving} className="btn-primary">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card space-y-4">
          <h2 className="text-base font-bold text-slate-800">Shopkeeper</h2>
          {selectedShopkeeper && (
            <div className="rounded-xl border border-primary-100 bg-primary-50 p-3">
              <p className="font-semibold text-slate-800">{selectedShopkeeper.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{selectedShopkeeper.phone}</p>
            </div>
          )}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={skSearch}
              onChange={e => setSkSearch(e.target.value)}
              className="input pl-10"
              placeholder="Search shopkeeper..."
            />
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filteredShopkeepers.map(shopkeeper => (
              <button
                key={shopkeeper._id}
                onClick={() => setShopkeeperId(shopkeeper._id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-colors ${
                  shopkeeperId === shopkeeper._id
                    ? 'border-primary-400 bg-primary-50'
                    : 'border-slate-100 hover:border-primary-200 hover:bg-slate-50'
                }`}
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800">{shopkeeper.name}</p>
                  <p className="text-xs text-slate-400">{shopkeeper.phone}</p>
                </div>
                {shopkeeperId === shopkeeper._id && <CheckCircle2 size={18} className="text-primary-500" />}
              </button>
            ))}
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="text-base font-bold text-slate-800">Add Products</h2>
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={prodSearch}
              onChange={e => setProdSearch(e.target.value)}
              className="input pl-10"
              placeholder="Search products..."
            />
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filteredProducts.map(product => (
              <button
                key={product._id}
                onClick={() => addProduct(product)}
                disabled={product.stock === 0}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 text-left hover:bg-slate-50 disabled:opacity-40"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800">{product.name}</p>
                  <p className="text-xs text-slate-400">{product.category} - Stock: {product.stock}</p>
                </div>
                <Plus size={16} className="text-primary-500" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card space-y-4">
        <h2 className="text-base font-bold text-slate-800">Order Items</h2>
        {orderItems.map(item => (
          <div key={item.productId} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl bg-slate-50">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 truncate">{item.productName}</p>
              <p className="text-xs text-slate-400">{fmtCurrency(item.unitPrice)} x {item.quantity} = {fmtCurrency(item.unitPrice * item.quantity)}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => updateQty(item.productId, item.quantity - 1)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                <Minus size={14} />
              </button>
              <input
                type="number"
                min={1}
                max={item.stock}
                value={item.quantity}
                onChange={e => updateQty(item.productId, parseInt(e.target.value) || 0)}
                className="w-16 text-center text-sm font-bold border border-slate-200 rounded-lg py-1.5"
              />
              <button
                onClick={() => updateQty(item.productId, item.quantity + 1)}
                disabled={item.quantity >= item.stock}
                className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center disabled:opacity-40"
              >
                <Plus size={14} />
              </button>
              <button onClick={() => updateQty(item.productId, 0)} className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="card space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Discount (Rs.)</label>
            <input
              type="number"
              min={0}
              max={subtotal}
              value={discount}
              onChange={e => setDiscount(Math.min(subtotal, Math.max(0, parseFloat(e.target.value) || 0)))}
              className="input"
            />
          </div>
          <div>
            <label className="label">Amount Paid (Rs.)</label>
            <input
              type="number"
              min={0}
              max={total}
              step="0.01"
              value={amountPaid}
              onChange={e => setAmountPaid(Math.min(total, Math.max(0, parseFloat(e.target.value) || 0)))}
              className="input"
            />
          </div>
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-2">
          <div className="flex justify-between text-sm"><span>Subtotal</span><strong>{fmtCurrency(subtotal)}</strong></div>
          <div className="flex justify-between text-sm"><span>Discount</span><strong>{fmtCurrency(discount)}</strong></div>
          <div className="flex justify-between text-base border-t border-slate-200 pt-2"><span>Grand Total</span><strong>{fmtCurrency(total)}</strong></div>
          <div className="flex justify-between text-sm"><span>Paid</span><strong className="text-emerald-600">{fmtCurrency(amountPaid)}</strong></div>
          <div className="flex justify-between text-sm"><span>Outstanding</span><strong className={outstanding > 0 ? 'text-red-500' : 'text-emerald-600'}>{fmtCurrency(outstanding)}</strong></div>
          <div className="text-xs font-semibold text-slate-500">Status: {paymentStatus}</div>
        </div>
      </div>
    </div>
  );
}
