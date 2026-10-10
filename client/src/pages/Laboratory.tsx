import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { labApi, patientsApi } from '../lib/services';
import { formatDate, getStatusBadgeColor } from '../lib/utils';
import { Plus, X, FlaskConical, CheckCircle } from 'lucide-react';

const Modal: React.FC<{ open: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-xl rounded-xl bg-card border border-border shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export const Laboratory: React.FC = () => {
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['lab-orders', statusFilter],
    queryFn: () => labApi.getOrders(statusFilter ? { status: statusFilter } : undefined),
  });

  const { data: testsData } = useQuery({
    queryKey: ['lab-tests'],
    queryFn: labApi.getTests,
  });

  const { data: patientsData } = useQuery({
    queryKey: ['patients-list'],
    queryFn: () => patientsApi.getAll({ limit: '200' }),
    enabled: showOrderModal,
  });

  const { register: regOrder, handleSubmit: handleOrder, reset: resetOrder } = useForm();
  const { register: regResult, handleSubmit: handleResult, reset: resetResult } = useForm();

  const orderMutation = useMutation({
    mutationFn: labApi.createOrder,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['lab-orders'] }); setShowOrderModal(false); resetOrder(); },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => labApi.updateOrderStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lab-orders'] }),
  });

  const resultMutation = useMutation({
    mutationFn: labApi.enterResult,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['lab-orders'] }); setShowResultModal(null); resetResult(); },
  });

  const orders = data?.orders ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Laboratory</h1>
          <p className="text-muted-foreground mt-1">{orders.length} lab orders</p>
        </div>
        <button
          onClick={() => setShowOrderModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> New Lab Order
        </button>
      </div>

      {/* Tests Summary */}
      {testsData?.tests && (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Available Tests ({testsData.tests.length})</h3>
          <div className="flex flex-wrap gap-2">
            {testsData.tests.map((t: any) => (
              <span key={t.id} className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
                {t.name} — ₹{t.price}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 p-4 rounded-xl border border-border bg-card shadow-sm">
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Status</option>
          {['PENDING', 'SAMPLE_COLLECTED', 'COMPLETED', 'CANCELLED'].map(s => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : orders.length === 0 ? (
          <div className="p-16 text-center">
            <FlaskConical className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No lab orders found</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Patient</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Test</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Order Date</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Result</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order: any) => (
                  <tr key={order.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 font-medium">{order.patient.user.firstName} {order.patient.user.lastName}</td>
                    <td className="py-3 px-4">{order.test.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{formatDate(order.orderDate)}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusBadgeColor(order.status)}`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {order.result ? (
                        <span className="text-xs text-green-700 font-medium">Available</span>
                      ) : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        {order.status === 'PENDING' && (
                          <button
                            onClick={() => statusMutation.mutate({ id: order.id, status: 'SAMPLE_COLLECTED' })}
                            className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                          >
                            Collect Sample
                          </button>
                        )}
                        {order.status === 'SAMPLE_COLLECTED' && (
                          <button
                            onClick={() => setShowResultModal(order.id)}
                            className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100 flex items-center gap-1"
                          >
                            <CheckCircle className="h-3 w-3" /> Enter Result
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Order Modal */}
      <Modal open={showOrderModal} onClose={() => { setShowOrderModal(false); resetOrder(); }} title="New Lab Order">
        <form onSubmit={handleOrder((d) => orderMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Patient *</label>
            <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary" {...regOrder('patientId', { required: true })}>
              <option value="">Select patient</option>
              {patientsData?.patients?.map((p: any) => <option key={p.id} value={p.id}>{p.user.firstName} {p.user.lastName} ({p.patientId})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Lab Test *</label>
            <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary" {...regOrder('testId', { required: true })}>
              <option value="">Select test</option>
              {testsData?.tests?.map((t: any) => <option key={t.id} value={t.id}>{t.name} — ₹{t.price}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setShowOrderModal(false); resetOrder(); }} className="flex-1 h-10 rounded-lg border border-border text-sm font-medium hover:bg-muted">Cancel</button>
            <button type="submit" disabled={orderMutation.isPending} className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
              {orderMutation.isPending ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Enter Result Modal */}
      <Modal open={!!showResultModal} onClose={() => { setShowResultModal(null); resetResult(); }} title="Enter Lab Result">
        <form onSubmit={handleResult((d) => resultMutation.mutate({ ...d, orderId: showResultModal }))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Result Data *</label>
            <textarea
              className="h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Enter result details, values, observations..."
              {...regResult('resultData', { required: true })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Report URL (optional)</label>
            <input type="url" placeholder="https://..." className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary" {...regResult('reportUrl')} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setShowResultModal(null); resetResult(); }} className="flex-1 h-10 rounded-lg border border-border text-sm font-medium hover:bg-muted">Cancel</button>
            <button type="submit" disabled={resultMutation.isPending} className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
              {resultMutation.isPending ? 'Saving...' : 'Save Result'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
