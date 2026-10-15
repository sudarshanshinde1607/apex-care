import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { labApi, patientsApi } from '../lib/services';
import { formatDate, formatCurrency, getStatusBadgeColor } from '../lib/utils';
import { Plus, X, FlaskConical, CheckCircle, Eye, Printer, ExternalLink, Activity } from 'lucide-react';

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
  const [viewResultOrder, setViewResultOrder] = useState<any | null>(null);
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
                    <td className="py-3 px-4">
                      {order.result ? (
                        <button
                          type="button"
                          onClick={() => setViewResultOrder(order)}
                          className="inline-flex items-center gap-1.5 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 dark:text-emerald-300 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800 transition-colors font-medium cursor-pointer"
                          title="Click to view lab report"
                        >
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          Available
                        </button>
                      ) : (
                        <span className="text-muted-foreground text-xs">Pending</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {order.result && (
                          <button
                            type="button"
                            onClick={() => setViewResultOrder(order)}
                            className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary font-medium rounded-lg transition-colors cursor-pointer"
                            title="View test report"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View Report
                          </button>
                        )}
                        {order.status === 'PENDING' && (
                          <button
                            type="button"
                            onClick={() => statusMutation.mutate({ id: order.id, status: 'SAMPLE_COLLECTED' })}
                            className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 rounded-md font-medium transition-colors cursor-pointer"
                          >
                            Collect Sample
                          </button>
                        )}
                        {order.status === 'SAMPLE_COLLECTED' && (
                          <button
                            type="button"
                            onClick={() => setShowResultModal(order.id)}
                            className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-md font-medium transition-colors cursor-pointer"
                          >
                            <CheckCircle className="h-3.5 w-3.5" /> Enter Result
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

      {/* View Lab Report Modal */}
      <Modal
        open={!!viewResultOrder}
        onClose={() => setViewResultOrder(null)}
        title="Diagnostic Laboratory Report"
      >
        {viewResultOrder && (() => {
          let parsedData: any = null;
          try {
            parsedData = JSON.parse(viewResultOrder.result?.resultData || '');
          } catch {
            parsedData = null;
          }

          return (
            <div className="space-y-5">
              {/* Patient & Test Overview */}
              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <div className="grid grid-cols-2 gap-4 pb-3 border-b border-border">
                  <div>
                    <span className="text-[11px] uppercase font-semibold text-muted-foreground block">Patient</span>
                    <p className="font-bold text-foreground text-sm">
                      {viewResultOrder.patient?.user?.firstName} {viewResultOrder.patient?.user?.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">{viewResultOrder.patient?.patientId || '—'}</p>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase font-semibold text-muted-foreground block">Test Name</span>
                    <p className="font-bold text-foreground text-sm flex items-center gap-1.5">
                      <FlaskConical className="h-4 w-4 text-primary" />
                      {viewResultOrder.test?.name}
                    </p>
                    <span className="text-xs text-muted-foreground">Price: {formatCurrency(viewResultOrder.test?.price)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 text-xs">
                  <div>
                    <span className="text-muted-foreground">Order Date:</span>{' '}
                    <span className="font-medium text-foreground">{formatDate(viewResultOrder.orderDate)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Report Status:</span>{' '}
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">Verified & Available</span>
                  </div>
                </div>
              </div>

              {/* Lab Result Details */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5 flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-primary" />
                  Test Results & Findings
                </h4>

                {parsedData && typeof parsedData === 'object' ? (
                  <div className="rounded-xl border border-border overflow-hidden bg-card">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                        <tr>
                          <th className="py-2.5 px-3 text-left">Test Parameter</th>
                          <th className="py-2.5 px-3 text-left">Observed Value</th>
                          <th className="py-2.5 px-3 text-left">Reference Range</th>
                          <th className="py-2.5 px-3 text-left">Interpretation</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border/60">
                          <td className="py-3 px-3 font-medium text-foreground">{viewResultOrder.test?.name}</td>
                          <td className="py-3 px-3 font-mono font-bold text-sm text-foreground">
                            {parsedData.value || '—'}
                          </td>
                          <td className="py-3 px-3 text-muted-foreground">
                            {parsedData.normalRange || '—'}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full font-medium text-xs ${
                              parsedData.interpretation?.toLowerCase().includes('abnormal') || parsedData.interpretation?.toLowerCase().includes('high')
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}>
                              {parsedData.interpretation || 'Normal'}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">Result Findings</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                      {viewResultOrder.result?.resultData || 'No specific text observations recorded.'}
                    </p>
                  </div>
                )}
              </div>

              {/* External Report Link if present */}
              {viewResultOrder.result?.reportUrl && (
                <div className="p-3 rounded-lg border border-border bg-muted/30 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">External Attachment / PDF:</span>
                  <a
                    href={viewResultOrder.result.reportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                  >
                    Open Full PDF <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print Report
                </button>
                <button
                  type="button"
                  onClick={() => setViewResultOrder(null)}
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>

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
