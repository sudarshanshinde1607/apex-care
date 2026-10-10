import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { billingApi, patientsApi } from '../lib/services';
import { formatDate, formatCurrency, getStatusBadgeColor } from '../lib/utils';
import { Plus, X, FileText, CreditCard, Trash2 } from 'lucide-react';

const Modal: React.FC<{ open: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl rounded-xl bg-card border border-border shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export const Billing: React.FC = () => {
  const [showInvModal, setShowInvModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([{ description: '', quantity: 1, unitPrice: 0 }]);
  const queryClient = useQueryClient();

  const params: Record<string, string> = { page: String(page), limit: '20' };
  if (statusFilter) params.status = statusFilter;

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', params],
    queryFn: () => billingApi.getInvoices(params),
    placeholderData: (p) => p,
  });

  const { data: patientsData } = useQuery({
    queryKey: ['patients-list'],
    queryFn: () => patientsApi.getAll({ limit: '200' }),
    enabled: showInvModal,
  });

  const { register: regInv, handleSubmit: handleInv, reset: resetInv, watch } = useForm({
    defaultValues: { patientId: '', taxRate: 0, discount: 0, dueDate: '' }
  });

  const { register: regPay, handleSubmit: handlePay, reset: resetPay } = useForm({
    defaultValues: { amount: 0, paymentMethod: 'CASH', transactionId: '' }
  });

  const invMutation = useMutation({
    mutationFn: billingApi.create,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['invoices'] }); setShowInvModal(false); resetInv(); setItems([{ description: '', quantity: 1, unitPrice: 0 }]); },
  });

  const payMutation = useMutation({
    mutationFn: billingApi.recordPayment,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['invoices'] }); setShowPayModal(null); resetPay(); },
  });

  const invoices = data?.invoices ?? [];
  const total = data?.total ?? 0;

  const totalAmount = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const taxAmt = totalAmount * ((watch('taxRate') ?? 0) / 100);
  const netAmt = totalAmount + taxAmt - (watch('discount') ?? 0);

  const addItem = () => setItems(prev => [...prev, { description: '', quantity: 1, unitPrice: 0 }]);
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Billing & Invoicing</h1>
          <p className="text-muted-foreground mt-1">{total} invoices</p>
        </div>
        <button onClick={() => setShowInvModal(true)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Create Invoice
        </button>
      </div>

      {/* Revenue Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Billed', value: invoices.reduce((s: number, inv: any) => s + inv.netAmount, 0), color: 'bg-blue-50 text-blue-700' },
          { label: 'Collected', value: invoices.filter((i: any) => i.status === 'PAID').reduce((s: number, inv: any) => s + inv.netAmount, 0), color: 'bg-green-50 text-green-700' },
          { label: 'Outstanding', value: invoices.filter((i: any) => i.status !== 'PAID' && i.status !== 'CANCELLED').reduce((s: number, inv: any) => s + inv.netAmount - inv.payments.reduce((ps: number, p: any) => ps + p.amount, 0), 0), color: 'bg-red-50 text-red-700' },
        ].map(c => (
          <div key={c.label} className={`rounded-xl p-4 border ${c.color.replace('text-', 'border-').replace('-700', '-200')}`}>
            <p className="text-xs font-medium mb-1 text-muted-foreground">{c.label}</p>
            <p className={`text-2xl font-bold ${c.color}`}>{formatCurrency(c.value)}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3 p-4 rounded-xl border border-border bg-card shadow-sm">
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary">
          <option value="">All Status</option>
          {['UNPAID', 'PARTIAL', 'PAID', 'CANCELLED'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : invoices.length === 0 ? (
          <div className="p-16 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No invoices found</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Invoice #</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Patient</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Paid</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Balance</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv: any) => {
                  const paid = inv.payments.reduce((s: number, p: any) => s + p.amount, 0);
                  const balance = inv.netAmount - paid;
                  return (
                    <tr key={inv.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-primary">{inv.invoiceNo}</td>
                      <td className="py-3 px-4 font-medium">{inv.patient.user.firstName} {inv.patient.user.lastName}</td>
                      <td className="py-3 px-4 text-muted-foreground">{formatDate(inv.issueDate)}</td>
                      <td className="py-3 px-4 font-medium">{formatCurrency(inv.netAmount)}</td>
                      <td className="py-3 px-4 text-green-700">{formatCurrency(paid)}</td>
                      <td className="py-3 px-4 text-red-700">{formatCurrency(balance)}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusBadgeColor(inv.status)}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && (
                          <button onClick={() => setShowPayModal(inv.id)} className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100 flex items-center gap-1">
                            <CreditCard className="h-3 w-3" /> Pay
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Invoice Modal */}
      <Modal open={showInvModal} onClose={() => { setShowInvModal(false); resetInv(); }} title="Create Invoice">
        <form onSubmit={handleInv((d) => invMutation.mutate({ ...d, items: items.filter(i => i.description) }))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Patient *</label>
            <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary" {...regInv('patientId', { required: true })}>
              <option value="">Select patient</option>
              {patientsData?.patients?.map((p: any) => <option key={p.id} value={p.id}>{p.user.firstName} {p.user.lastName} ({p.patientId})</option>)}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Invoice Items *</label>
              <button type="button" onClick={addItem} className="text-xs text-primary hover:underline flex items-center gap-1"><Plus className="h-3 w-3" />Add Item</button>
            </div>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <input type="text" placeholder="Description" className="col-span-5 h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                    value={item.description} onChange={e => setItems(prev => prev.map((i, n) => n === idx ? { ...i, description: e.target.value } : i))} />
                  <input type="number" placeholder="Qty" className="col-span-2 h-9 rounded-md border border-input bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                    value={item.quantity} onChange={e => setItems(prev => prev.map((i, n) => n === idx ? { ...i, quantity: parseInt(e.target.value) || 1 } : i))} />
                  <input type="number" step="0.01" placeholder="Price" className="col-span-3 h-9 rounded-md border border-input bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                    value={item.unitPrice} onChange={e => setItems(prev => prev.map((i, n) => n === idx ? { ...i, unitPrice: parseFloat(e.target.value) || 0 } : i))} />
                  <span className="col-span-1 text-xs text-right font-medium">{formatCurrency(item.quantity * item.unitPrice)}</span>
                  <button type="button" onClick={() => removeItem(idx)} className="col-span-1 text-destructive hover:bg-destructive/10 p-1 rounded"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tax Rate (%)</label>
              <input type="number" step="0.01" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary" {...regInv('taxRate')} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Discount (₹)</label>
              <input type="number" step="0.01" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary" {...regInv('discount')} />
            </div>
          </div>

          <div className="p-3 bg-muted/50 rounded-lg text-sm">
            <div className="flex justify-between mb-1"><span>Subtotal:</span><span>{formatCurrency(totalAmount)}</span></div>
            <div className="flex justify-between mb-1"><span>Tax:</span><span>{formatCurrency(taxAmt)}</span></div>
            <div className="flex justify-between mb-1"><span>Discount:</span><span>-{formatCurrency(watch('discount') ?? 0)}</span></div>
            <div className="flex justify-between font-bold border-t border-border mt-2 pt-2"><span>Net Amount:</span><span>{formatCurrency(netAmt)}</span></div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setShowInvModal(false); resetInv(); }} className="flex-1 h-10 rounded-lg border border-border text-sm font-medium hover:bg-muted">Cancel</button>
            <button type="submit" disabled={invMutation.isPending} className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
              {invMutation.isPending ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Payment Modal */}
      <Modal open={!!showPayModal} onClose={() => { setShowPayModal(null); resetPay(); }} title="Record Payment">
        <form onSubmit={handlePay((d) => payMutation.mutate({ ...d, invoiceId: showPayModal }))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Amount (₹) *</label>
            <input type="number" step="0.01" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary" {...regPay('amount', { required: true })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Payment Method *</label>
            <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary" {...regPay('paymentMethod', { required: true })}>
              {['CASH', 'CARD', 'UPI', 'INSURANCE', 'BANK_TRANSFER'].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Transaction ID</label>
            <input type="text" placeholder="Optional" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary" {...regPay('transactionId')} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setShowPayModal(null); resetPay(); }} className="flex-1 h-10 rounded-lg border border-border text-sm font-medium hover:bg-muted">Cancel</button>
            <button type="submit" disabled={payMutation.isPending} className="flex-1 h-10 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50">
              {payMutation.isPending ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
