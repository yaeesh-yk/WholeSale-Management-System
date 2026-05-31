import { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';
import { fmtCurrency, fmtDate } from '../lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, Search, Edit2, Trash2, Package, Loader2, X, AlertTriangle } from 'lucide-react';

const schema = z.object({
  name:              z.string().min(1, 'Product name is required'),
  category:          z.string().optional(),
  price:             z.coerce.number().min(0, 'Price must be ≥ 0'),
  stock:             z.coerce.number().int().min(0, 'Stock must be ≥ 0'),
  lowStockThreshold: z.coerce.number().int().min(0).optional(),
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

function ConfirmModal({ open, onClose, onConfirm, loading }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box animate-slide-in max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Trash2 size={22} className="text-red-500" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-2">Archive Product</h3>
          <p className="text-sm text-slate-500 mb-6">This hides the product from active lists while keeping old invoice history.</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button onClick={onConfirm} disabled={loading} className="btn-danger flex-1 justify-center">
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Archive'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Products() {
  const [products, setProducts]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [modalOpen, setModalOpen]     = useState(false);
  const [editing, setEditing]         = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]       = useState(false);
  const [saving, setSaving]           = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { lowStockThreshold: 10 },
  });

  const fetchProducts = useCallback(() => {
    setLoading(true);
    api.getProducts(search)
      .then(setProducts)
      .catch(() => toast.error('Failed to load products'))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const openAdd = () => {
    setEditing(null);
    reset({ name: '', category: '', price: '', stock: '', lowStockThreshold: 10 });
    setModalOpen(true);
  };
  const openEdit = (p) => {
    setEditing(p);
    reset({ name: p.name, category: p.category, price: p.price, stock: p.stock, lowStockThreshold: p.lowStockThreshold });
    setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setEditing(null); };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      if (editing) {
        await api.updateProduct(editing._id, data);
        toast.success('Product updated!');
      } else {
        await api.createProduct(data);
        toast.success('Product added!');
      }
      closeModal();
      fetchProducts();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.deleteProduct(deleteTarget._id);
      toast.success('Product archived');
      setDeleteTarget(null);
      fetchProducts();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const lowStockCount = products.filter(p => p.stock <= p.lowStockThreshold).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Products</h1>
          <p className="text-slate-500 text-sm mt-1">
            {products.length} products
            {lowStockCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-amber-600 font-medium">
                <AlertTriangle size={12} /> {lowStockCount} low stock
              </span>
            )}
          </p>
        </div>
        <button id="add-product-btn" onClick={openAdd} className="btn-primary">
          <Plus size={17} /> Add Product
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          id="product-search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input pl-10"
          placeholder="Search by name or category..."
        />
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-primary-500" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <Package size={40} className="mx-auto mb-3 text-slate-200" />
            <p className="text-slate-500 font-medium">No products yet</p>
            <p className="text-slate-400 text-sm mt-1">Add your first product to get started</p>
            <button onClick={openAdd} className="btn-primary mt-4 mx-auto"><Plus size={16} /> Add Product</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Name', 'Category', 'Price', 'Stock', 'Threshold', 'Added', 'Actions'].map(h => (
                    <th key={h} className="table-header">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {products.map(p => {
                  const isLow = p.stock <= p.lowStockThreshold;
                  return (
                    <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                      <td className="table-cell font-semibold text-slate-800">{p.name}</td>
                      <td className="table-cell">
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{p.category}</span>
                      </td>
                      <td className="table-cell font-semibold text-primary-600">{fmtCurrency(p.price)}</td>
                      <td className="table-cell">
                        <span className={`font-bold ${isLow ? 'text-red-500' : 'text-slate-700'}`}>
                          {p.stock}
                          {isLow && <AlertTriangle size={12} className="inline ml-1 text-red-400" />}
                        </span>
                      </td>
                      <td className="table-cell text-slate-400 text-xs">{p.lowStockThreshold}</td>
                      <td className="table-cell text-slate-400 text-xs">{fmtDate(p.createdAt)}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <button
                            id={`edit-prod-${p._id}`}
                            onClick={() => openEdit(p)}
                            className="p-1.5 rounded-lg hover:bg-primary-50 text-slate-400 hover:text-primary-600 transition-colors"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            id={`del-prod-${p._id}`}
                            onClick={() => setDeleteTarget(p)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Edit Product' : 'Add Product'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Product Name *</label>
              <input id="prod-name" {...register('name')} className="input" placeholder="e.g. Basmati Rice 5kg" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="label">Category</label>
              <input id="prod-cat" {...register('category')} className="input" placeholder="e.g. Grains" />
            </div>
            <div>
              <label className="label">Price (Rs.) *</label>
              <input id="prod-price" type="number" step="0.01" {...register('price')} className="input" placeholder="0.00" />
              {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
            </div>
            <div>
              <label className="label">Stock *</label>
              <input id="prod-stock" type="number" {...register('stock')} className="input" placeholder="0" />
              {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock.message}</p>}
            </div>
            <div>
              <label className="label">Low Stock Threshold</label>
              <input id="prod-threshold" type="number" {...register('lowStockThreshold')} className="input" placeholder="10" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={closeModal} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button id="prod-save-btn" type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              {saving ? 'Saving...' : editing ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
