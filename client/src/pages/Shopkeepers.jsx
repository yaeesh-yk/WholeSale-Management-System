import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { fmtCurrency, fmtDate } from '../lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  Plus, Search, Edit2, Trash2, ChevronRight,
  Users, Loader2, X
} from 'lucide-react';

const schema = z.object({
  name:    z.string().min(1, 'Name is required'),
  phone:   z.string().min(1, 'Phone is required'),
  address: z.string().optional(),
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
          <h3 className="text-base font-bold text-slate-800 mb-2">Delete Shopkeeper</h3>
          <p className="text-sm text-slate-500 mb-6">This action cannot be undone. All associated data will remain but the shopkeeper record will be deleted.</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button onClick={onConfirm} disabled={loading} className="btn-danger flex-1 justify-center">
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Shopkeepers() {
  const [shopkeepers, setShopkeepers] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [modalOpen, setModalOpen]     = useState(false);
  const [editing, setEditing]         = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]       = useState(false);
  const [saving, setSaving]           = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const fetchShopkeepers = useCallback(() => {
    setLoading(true);
    api.getShopkeepers(search)
      .then(setShopkeepers)
      .catch(() => toast.error('Failed to load shopkeepers'))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { fetchShopkeepers(); }, [fetchShopkeepers]);

  const openAdd = () => { setEditing(null); reset({ name:'', phone:'', address:'' }); setModalOpen(true); };
  const openEdit = (sk) => { setEditing(sk); reset({ name: sk.name, phone: sk.phone, address: sk.address || '' }); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); reset(); };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      if (editing) {
        await api.updateShopkeeper(editing._id, data);
        toast.success('Shopkeeper updated!');
      } else {
        await api.createShopkeeper(data);
        toast.success('Shopkeeper added!');
      }
      closeModal();
      fetchShopkeepers();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.deleteShopkeeper(deleteTarget._id);
      toast.success('Shopkeeper deleted');
      setDeleteTarget(null);
      fetchShopkeepers();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Shopkeepers</h1>
          <p className="text-slate-500 text-sm mt-1">{shopkeepers.length} shopkeepers registered</p>
        </div>
        <button id="add-shopkeeper-btn" onClick={openAdd} className="btn-primary">
          <Plus size={17} /> Add Shopkeeper
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          id="shopkeeper-search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input pl-10"
          placeholder="Search by name or phone..."
        />
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-primary-500" />
          </div>
        ) : shopkeepers.length === 0 ? (
          <div className="text-center py-20">
            <Users size={40} className="mx-auto mb-3 text-slate-200" />
            <p className="text-slate-500 font-medium">No shopkeepers yet</p>
            <p className="text-slate-400 text-sm mt-1">Add your first shopkeeper to get started</p>
            <button onClick={openAdd} className="btn-primary mt-4 mx-auto">
              <Plus size={16} /> Add Shopkeeper
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Name', 'Phone', 'Address', 'Outstanding', 'Since', 'Actions'].map(h => (
                    <th key={h} className="table-header">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {shopkeepers.map(sk => (
                  <tr key={sk._id} className="hover:bg-slate-50 transition-colors group">
                    <td className="table-cell">
                      <Link
                        to={`/shopkeepers/${sk._id}`}
                        className="font-semibold text-primary-600 hover:underline flex items-center gap-1"
                      >
                        {sk.name}
                        <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </td>
                    <td className="table-cell text-slate-500">{sk.phone}</td>
                    <td className="table-cell text-slate-500">{sk.address || '—'}</td>
                    <td className="table-cell">
                      <span className={`font-semibold ${sk.totalOutstanding > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {fmtCurrency(sk.totalOutstanding)}
                      </span>
                    </td>
                    <td className="table-cell text-slate-400 text-xs">{fmtDate(sk.createdAt)}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <button
                          id={`edit-sk-${sk._id}`}
                          onClick={() => openEdit(sk)}
                          className="p-1.5 rounded-lg hover:bg-primary-50 text-slate-400 hover:text-primary-600 transition-colors"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          id={`del-sk-${sk._id}`}
                          onClick={() => setDeleteTarget(sk)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Edit Shopkeeper' : 'Add Shopkeeper'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Name *</label>
            <input id="sk-name" {...register('name')} className="input" placeholder="Shopkeeper name" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="label">Phone *</label>
            <input id="sk-phone" {...register('phone')} className="input" placeholder="Phone number" />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
          </div>
          <div>
            <label className="label">Address</label>
            <textarea id="sk-address" {...register('address')} className="input resize-none" rows={2} placeholder="Address (optional)" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={closeModal} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button id="sk-save-btn" type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
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
