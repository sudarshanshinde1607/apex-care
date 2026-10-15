import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { pharmacyApi } from '../lib/services';
import { formatDate, formatCurrency } from '../lib/utils';
import { Plus, X, Pill, AlertTriangle, Package } from 'lucide-react';

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

export const Pharmacy: React.FC = () => {
  const [showMedModal, setShowMedModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedMedId, setSelectedMedId] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['medicines', search],
    queryFn: () => pharmacyApi.getMedicines({ search }),
  });

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers'],
    queryFn: pharmacyApi.getSuppliers,
  });

  const { register: regMed, handleSubmit: handleMed, reset: resetMed } = useForm();
  const { register: regBatch, handleSubmit: handleBatch, reset: resetBatch } = useForm();

  const medMutation = useMutation({
    mutationFn: pharmacyApi.createMedicine,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['medicines'] }); setShowMedModal(false); resetMed(); },
  });

  const batchMutation = useMutation({
    mutationFn: pharmacyApi.addBatch,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['medicines'] }); setShowBatchModal(false); resetBatch(); },
  });

  const medicines = data?.medicines ?? [];
  const lowStock = medicines.filter((m: any) => m.totalStock < 50);
  const nearExpiry = medicines.filter((m: any) => m.nearExpiry);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pharmacy Management</h1>
          <p className="text-muted-foreground mt-1">{medicines.length} medicines in catalog</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowBatchModal(true)} className="inline-flex items-center gap-2 rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10">
            <Package className="h-4 w-4" /> Add Stock
          </button>
          <button onClick={() => setShowMedModal(true)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Add Medicine
          </button>
        </div>
      </div>

      {/* Alerts */}
      {(lowStock.length > 0 || nearExpiry.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lowStock.length > 0 && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-orange-50 border border-orange-200">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-orange-900">Low Stock Alert</p>
                <p className="text-sm text-orange-700">{lowStock.length} medicine(s) running low: {lowStock.slice(0, 3).map((m: any) => m.name).join(', ')}{lowStock.length > 3 ? '...' : ''}</p>
              </div>
            </div>
          )}
          {nearExpiry.length > 0 && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-900">Expiry Alert</p>
                <p className="text-sm text-red-700">{nearExpiry.length} medicine(s) expiring within 90 days</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="p-4 border-b border-border">
          <input
            type="text"
            placeholder="Search medicines..."
            className="h-9 w-full max-w-sm rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Medicine</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Generic Name</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Unit Price</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Available Quantity</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {medicines.map((m: any) => (
                  <tr key={m.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 font-medium">{m.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{m.genericName ?? '—'}</td>
                    <td className="py-3 px-4">
                      <span className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 px-2 py-0.5 rounded">{m.category}</span>
                    </td>
                    <td className="py-3 px-4">{formatCurrency(m.unitPrice)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-baseline gap-1.5">
                        <span className={`text-sm font-bold ${
                          m.totalStock === 0 ? 'text-destructive' : m.totalStock < 50 ? 'text-amber-600' : 'text-foreground'
                        }`}>
                          {m.totalStock}
                        </span>
                        <span className="text-xs text-muted-foreground font-medium">
                          {m.totalStock === 1 ? 'unit available' : 'units available'}
                        </span>
                      </div>
                      {m.batches && m.batches.length > 0 && (
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {m.batches.length} {m.batches.length === 1 ? 'batch' : 'batches'} in stock
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {m.totalStock === 0 ? (
                          <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300">Out of Stock</span>
                        ) : m.totalStock < 50 ? (
                          <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300">Low Stock</span>
                        ) : (
                          <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300">In Stock</span>
                        )}
                        {m.nearExpiry && (
                          <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">Near Expiry</span>
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

      {/* Add Medicine Modal */}
      <Modal open={showMedModal} onClose={() => { setShowMedModal(false); resetMed(); }} title="Add Medicine to Catalog">
        <form onSubmit={handleMed((d) => medMutation.mutate(d))} className="space-y-4">
          {[
            { name: 'name', label: 'Medicine Name', required: true },
            { name: 'genericName', label: 'Generic Name' },
            { name: 'category', label: 'Category', required: true },
            { name: 'manufacturer', label: 'Manufacturer' },
            { name: 'unitPrice', label: 'Unit Price (₹)', type: 'number', required: true },
          ].map(f => (
            <div key={f.name}>
              <label className="block text-sm font-medium mb-1">{f.label}{f.required && ' *'}</label>
              <input type={f.type ?? 'text'} step="0.01" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary" {...regMed(f.name as any, { required: f.required })} />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setShowMedModal(false); resetMed(); }} className="flex-1 h-10 rounded-lg border border-border text-sm font-medium hover:bg-muted">Cancel</button>
            <button type="submit" disabled={medMutation.isPending} className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
              {medMutation.isPending ? 'Adding...' : 'Add Medicine'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Batch Modal */}
      <Modal open={showBatchModal} onClose={() => { setShowBatchModal(false); resetBatch(); }} title="Add Medicine Stock (Batch)">
        <form onSubmit={handleBatch((d) => batchMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Medicine *</label>
            <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary" {...regBatch('medicineId', { required: true })}>
              <option value="">Select medicine</option>
              {data?.medicines?.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Supplier *</label>
            <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary" {...regBatch('supplierId', { required: true })}>
              <option value="">Select supplier</option>
              {suppliersData?.suppliers?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          {[
            { name: 'batchNo', label: 'Batch Number', required: true },
            { name: 'quantity', label: 'Quantity', type: 'number', required: true },
            { name: 'manufactureDate', label: 'Manufacture Date', type: 'date', required: true },
            { name: 'expiryDate', label: 'Expiry Date', type: 'date', required: true },
          ].map(f => (
            <div key={f.name}>
              <label className="block text-sm font-medium mb-1">{f.label}{f.required && ' *'}</label>
              <input type={f.type ?? 'text'} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary" {...regBatch(f.name as any, { required: f.required })} />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setShowBatchModal(false); resetBatch(); }} className="flex-1 h-10 rounded-lg border border-border text-sm font-medium hover:bg-muted">Cancel</button>
            <button type="submit" disabled={batchMutation.isPending} className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
              {batchMutation.isPending ? 'Adding...' : 'Add Stock'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
