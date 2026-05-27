import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { fmtCurrency, fmtDate } from '../lib/utils';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  ArrowLeft, Printer, Download, FileText,
  Loader2, CheckCircle2, AlertTriangle, CreditCard
} from 'lucide-react';

export default function BillView() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getOrder(id)
      .then(setOrder)
      .catch(() => toast.error('Failed to load invoice'))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    if (!order) return;

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Colors
      const primaryColor = [59, 130, 246]; // #3b82f6 Primary Blue
      const darkColor = [30, 41, 59]; // #1e293b Slate 800
      const lightGray = [241, 245, 249]; // #f1f5f9 Slate 100

      // Header Brand
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, 210, 8, 'F');

      // Title & Inv No
      doc.setTextColor(...darkColor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('INVOICE', 15, 25);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Invoice No: ${order.billNo}`, 15, 31);
      doc.text(`Date: ${fmtDate(order.date)}`, 15, 36);

      // Wholesale Brand
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(...primaryColor);
      doc.text('WholeSale Inc.', 195, 25, { align: 'right' });
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('123 Warehouse St, Industrial Area', 195, 31, { align: 'right' });
      doc.text('Phone: +91 98765 43210', 195, 36, { align: 'right' });

      // Line separator
      doc.setDrawColor(...lightGray);
      doc.setLineWidth(0.5);
      doc.line(15, 43, 195, 43);

      // Customer Details (Bill To)
      doc.setTextColor(...darkColor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('BILL TO:', 15, 52);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(order.shopkeeperId?.name || 'Walk-in Customer', 15, 58);
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Phone: ${order.shopkeeperId?.phone || '—'}`, 15, 64);
      if (order.shopkeeperId?.address) {
        doc.text(`Address: ${order.shopkeeperId.address}`, 15, 69);
      }

      // Payment Status Badge Box
      const badgeText = order.paymentStatus.toUpperCase();
      let badgeBg = [239, 68, 68]; // Red
      if (order.paymentStatus === 'Paid') badgeBg = [16, 185, 129]; // Green
      else if (order.paymentStatus === 'Partial') badgeBg = [245, 158, 11]; // Orange

      doc.setFillColor(...badgeBg);
      doc.rect(145, 52, 50, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(badgeText, 170, 57.5, { align: 'center' });

      // Table of Items
      const tableHeaders = [['Item Name', 'Qty', 'Unit Price', 'Total']];
      const tableRows = order.items.map(item => [
        item.productName,
        item.quantity,
        `Rs. ${item.unitPrice.toFixed(2)}`,
        `Rs. ${item.subtotal.toFixed(2)}`,
      ]);

      const tableOptions = {
        head: tableHeaders,
        body: tableRows,
        startY: 78,
        margin: { left: 15, right: 15 },
        theme: 'striped',
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
        },
        bodyStyles: {
          fontSize: 9,
          textColor: darkColor,
        },
        columnStyles: {
          0: { cellWidth: 'auto' },
          1: { cellWidth: 20, halign: 'center' },
          2: { cellWidth: 35, halign: 'right' },
          3: { cellWidth: 35, halign: 'right' },
        },
      };

      // In some bundler setups, `jspdf-autotable` does not attach `autoTable` to `doc`.
      // Support both APIs.
      if (typeof doc.autoTable === 'function') {
        doc.autoTable(tableOptions);
      } else {
        autoTable(doc, tableOptions);
      }

      // Summary Calculations
      // `jsPDF-autotable` exposes the bottom position on `lastAutoTable`.
      // Using `previousAutoTable` can throw in newer versions.
      const finalY = (doc.lastAutoTable?.finalY ?? doc.previousAutoTable?.finalY ?? 88) + 10;
      doc.setTextColor(...darkColor);
      doc.setFontSize(9);

      // Subtotal line
      doc.setFont('helvetica', 'normal');
      doc.text('Subtotal:', 140, finalY);
      doc.text(`Rs. ${order.subtotal.toFixed(2)}`, 195, finalY, { align: 'right' });

      // Discount line
      doc.text('Discount:', 140, finalY + 5);
      doc.text(`Rs. ${order.discount.toFixed(2)}`, 195, finalY + 5, { align: 'right' });

      // Grand Total line
      doc.setFont('helvetica', 'bold');
      doc.text('Grand Total:', 140, finalY + 11);
      doc.text(`Rs. ${order.total.toFixed(2)}`, 195, finalY + 11, { align: 'right' });

      // Amount Paid & Outstanding
      doc.setFont('helvetica', 'normal');
      doc.text('Amount Paid:', 140, finalY + 17);
      doc.setTextColor(16, 185, 129); // Green
      doc.text(`Rs. ${order.amountPaid.toFixed(2)}`, 195, finalY + 17, { align: 'right' });

      doc.setTextColor(...darkColor);
      doc.text('Outstanding:', 140, finalY + 22);
      if (order.outstanding > 0) doc.setTextColor(239, 68, 68); // Red
      doc.text(`Rs. ${order.outstanding.toFixed(2)}`, 195, finalY + 22, { align: 'right' });

      // Footer Terms
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.text('Thank you for your business!', 105, 275, { align: 'center' });
      doc.text('Terms: All credit balances must be settled within 30 days.', 105, 280, { align: 'center' });

      doc.save(`Invoice_${order.billNo}.pdf`);
      toast.success('PDF downloaded successfully!');
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Error generating PDF');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 size={32} className="animate-spin text-primary-500" />
    </div>
  );

  if (!order) return null;

  const getStatusBadge = () => {
    if (order.paymentStatus === 'Paid') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold shadow-sm">
          <CheckCircle2 size={13} /> Paid
        </span>
      );
    }
    if (order.paymentStatus === 'Partial') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold shadow-sm">
          <CreditCard size={13} /> Partial Payment
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold shadow-sm">
        <AlertTriangle size={13} /> Unpaid (Credit)
      </span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Controls (Hidden on print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <Link
          to={order.shopkeeperId ? `/shopkeepers/${order.shopkeeperId._id}` : '/orders'}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary-600 transition-colors font-medium"
        >
          <ArrowLeft size={16} /> Back to History
        </Link>
        <div className="flex items-center gap-3">
          <button onClick={handlePrint} className="btn-secondary">
            <Printer size={16} /> Print
          </button>
          <button onClick={handleDownloadPDF} className="btn-primary">
            <Download size={16} /> Download PDF
          </button>
        </div>
      </div>

      {/* Invoice Card */}
      <div className="card bg-white p-8 lg:p-12 shadow-md border border-slate-100 rounded-2xl relative overflow-hidden print:shadow-none print:border-0 print:p-0">
        {/* Brand Bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary-500 to-primary-600 print:hidden" />

        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between items-start gap-6 border-b border-slate-100 pb-8 mt-2">
          <div>
            <div className="flex items-center gap-2 text-slate-400 font-mono text-xs uppercase tracking-wider">
              <FileText size={14} />
              <span>Tax Invoice</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mt-1">{order.billNo}</h1>
            <div className="flex flex-col gap-1 mt-3 text-sm text-slate-500">
              <p><span className="font-medium text-slate-600">Date:</span> {fmtDate(order.date)}</p>
              <p className="flex items-center gap-2 mt-1">
                <span className="font-medium text-slate-600">Status:</span>
                {getStatusBadge()}
              </p>
            </div>
          </div>

          <div className="sm:text-right">
            <h2 className="text-xl font-bold text-primary-600 tracking-tight">WholeSale Inc.</h2>
            <p className="text-slate-500 text-sm mt-1">123 Warehouse St, Industrial Area</p>
            <p className="text-slate-400 text-xs mt-0.5">Phone: +91 98765 43210</p>
            <p className="text-slate-450 text-xs">Email: billing@wholesale.com</p>
          </div>
        </div>

        {/* Billing Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Billed To</h3>
            {order.shopkeeperId ? (
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-800">{order.shopkeeperId.name}</h4>
                <p className="text-sm text-slate-500">Phone: {order.shopkeeperId.phone}</p>
                {order.shopkeeperId.address && (
                  <p className="text-sm text-slate-500">Address: {order.shopkeeperId.address}</p>
                )}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">Walk-in Customer</p>
            )}
          </div>

          <div className="md:text-right">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Payment Terms</h3>
            <p className="text-sm text-slate-800 font-medium">Due Upon Receipt</p>
            <p className="text-xs text-slate-400 mt-1">Method: Cash / Credit (Outstanding Balance Logged)</p>
          </div>
        </div>

        {/* Invoice Table */}
        <div className="py-8">
          <div className="overflow-x-auto -mx-8 sm:mx-0">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-100">
                  <th className="table-header w-12 text-center">#</th>
                  <th className="table-header">Item Description</th>
                  <th className="table-header text-center w-24">Qty</th>
                  <th className="table-header text-right w-36">Unit Price</th>
                  <th className="table-header text-right w-36">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                    <td className="table-cell text-center text-slate-400 font-mono text-xs">{index + 1}</td>
                    <td className="table-cell font-semibold text-slate-800">{item.productName}</td>
                    <td className="table-cell text-center font-bold text-slate-700">{item.quantity}</td>
                    <td className="table-cell text-right font-medium text-slate-500">{fmtCurrency(item.unitPrice)}</td>
                    <td className="table-cell text-right font-bold text-slate-800">{fmtCurrency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Block */}
        <div className="flex justify-end pt-4">
          <div className="w-full sm:w-80 space-y-3 bg-slate-50 rounded-2xl p-6 border border-slate-100">
            <div className="flex justify-between text-sm text-slate-500">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-700">{fmtCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-500">
              <span>Discount</span>
              <span className="font-semibold text-red-500">- {fmtCurrency(order.discount)}</span>
            </div>
            <div className="border-t border-slate-200 my-2" />
            <div className="flex justify-between text-base font-bold text-slate-800">
              <span>Grand Total</span>
              <span className="text-primary-600">{fmtCurrency(order.total)}</span>
            </div>
            <div className="border-t border-slate-200 my-2" />
            <div className="flex justify-between text-sm text-slate-500">
              <span>Amount Paid</span>
              <span className="font-bold text-emerald-600">{fmtCurrency(order.amountPaid)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-500">
              <span>Outstanding</span>
              <span className={`font-bold ${order.outstanding > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                {fmtCurrency(order.outstanding)}
              </span>
            </div>
          </div>
        </div>

        {/* Print Disclaimer */}
        <div className="text-center text-xs text-slate-400 mt-16 pt-6 border-t border-slate-100 hidden print:block">
          <p>Thank you for shopping with WholeSale Inc.!</p>
          <p className="mt-1">Computer Generated Invoice - No signature required</p>
        </div>
      </div>
    </div>
  );
}
