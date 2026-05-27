import { format } from 'date-fns';

export const fmtCurrency = (n) => {
  const num = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n ?? 0);
  return `Rs. ${num}`;
};

export const fmtDate = (d) => {
  if (!d) return '—';
  try { return format(new Date(d), 'dd MMM yyyy'); } catch { return '—'; }
};

export const fmtDateTime = (d) => {
  if (!d) return '—';
  try { return format(new Date(d), 'dd MMM yyyy, hh:mm a'); } catch { return '—'; }
};

export const statusBadge = (status) => {
  if (status === 'Paid')    return 'badge-paid';
  if (status === 'Partial') return 'badge-partial';
  return 'badge-unpaid';
};
