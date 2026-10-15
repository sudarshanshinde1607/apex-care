import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { consultationsApi, appointmentsApi, pharmacyApi } from '../lib/services';
import { formatDate } from '../lib/utils';
import { Plus, X, Stethoscope, Trash2, Eye, Pill, FileText, Printer, Calendar, User, AlertCircle } from 'lucide-react';

const Modal: React.FC<{ open: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-3xl rounded-xl bg-card border border-border shadow-2xl max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export const Consultations: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [viewPrescription, setViewPrescription] = useState<any | null>(null);
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data: consultData, isLoading } = useQuery({
    queryKey: ['consultations', page],
    queryFn: () => consultationsApi.getAll({ page: String(page), limit: '20' }),
  });

  // Only fetch CHECKED_IN appointments for new consultation
  const { data: apptData } = useQuery({
    queryKey: ['appointments-checked-in'],
    queryFn: () => appointmentsApi.getAll({ status: 'CHECKED_IN', limit: '100' }),
    enabled: showModal,
  });

  const { data: medsData } = useQuery({
    queryKey: ['medicines-list'],
    queryFn: () => pharmacyApi.getMedicines(),
    enabled: showModal,
  });

  const { register, handleSubmit, control, reset, watch, formState: { errors } } = useForm({
    defaultValues: {
      appointmentId: '',
      symptoms: '',
      diagnosis: '',
      notes: '',
      followUpDate: '',
      vitals: { bloodPressure: '', pulse: '', temperature: '', spO2: '', weight: '', height: '' },
      prescription: { instructions: '', items: [] as { medicineId: string; dosage: string; duration: string; instructions: string }[] }
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'prescription.items' });

  const createMutation = useMutation({
    mutationFn: consultationsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultations'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setShowModal(false);
      reset();
    },
  });

  const consultations = consultData?.consultations ?? [];
  const total = consultData?.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Consultations & EMR</h1>
          <p className="text-muted-foreground mt-1">{total} consultation records</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Consultation
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : consultations.length === 0 ? (
          <div className="p-16 text-center">
            <Stethoscope className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No consultations yet</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Patient</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Doctor</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Diagnosis</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Prescription</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Follow-up</th>
                </tr>
              </thead>
              <tbody>
                {consultations.map((c: any) => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 font-medium">{c.patient.user.firstName} {c.patient.user.lastName}</td>
                    <td className="py-3 px-4 text-muted-foreground">Dr. {c.doctor.user.firstName} {c.doctor.user.lastName}</td>
                    <td className="py-3 px-4">{c.diagnosis ?? '—'}</td>
                    <td className="py-3 px-4">
                      {c.prescription?.items?.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setViewPrescription(c)}
                          className="inline-flex items-center gap-1.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 dark:text-blue-300 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-800 transition-colors font-medium cursor-pointer"
                          title="Click to view full prescription"
                        >
                          <Pill className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                          {c.prescription.items.length} medicine(s)
                        </button>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{formatDate(c.followUpDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Prescription Modal */}
      <Modal
        open={!!viewPrescription}
        onClose={() => setViewPrescription(null)}
        title="Patient Prescription Details"
      >
        {viewPrescription && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="rounded-xl border border-border bg-muted/20 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Patient</span>
                    <h3 className="text-base font-bold text-foreground">
                      {viewPrescription.patient?.user?.firstName} {viewPrescription.patient?.user?.lastName}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                    <Stethoscope className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Attending Doctor</span>
                    <h3 className="text-base font-bold text-foreground">
                      Dr. {viewPrescription.doctor?.user?.firstName} {viewPrescription.doctor?.user?.lastName}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Diagnosis & Follow-up */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-sm">
                <div>
                  <span className="text-xs font-medium text-muted-foreground block mb-1">Diagnosis</span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-primary/10 text-primary font-medium text-xs">
                    {viewPrescription.diagnosis || 'General Consultation'}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground block mb-1">Follow-up Date</span>
                  <span className="flex items-center gap-1.5 font-medium text-foreground">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {formatDate(viewPrescription.followUpDate)}
                  </span>
                </div>
              </div>

              {/* Symptoms if any */}
              {viewPrescription.symptoms && (
                <div className="pt-3 border-t border-border mt-3 text-sm">
                  <span className="text-xs font-medium text-muted-foreground block mb-0.5">Symptoms / Chief Complaint</span>
                  <p className="text-muted-foreground">{viewPrescription.symptoms}</p>
                </div>
              )}
            </div>

            {/* Prescribed Medicines Table */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Pill className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Prescribed Medicines ({viewPrescription.prescription?.items?.length || 0})
                </h4>
              </div>

              {viewPrescription.prescription?.items?.length > 0 ? (
                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 border-b border-border text-xs text-muted-foreground font-semibold">
                      <tr>
                        <th className="py-2.5 px-3 text-left">#</th>
                        <th className="py-2.5 px-3 text-left">Medicine</th>
                        <th className="py-2.5 px-3 text-left">Dosage</th>
                        <th className="py-2.5 px-3 text-left">Duration</th>
                        <th className="py-2.5 px-3 text-left">Instructions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {viewPrescription.prescription.items.map((item: any, idx: number) => (
                        <tr key={item.id || idx} className="hover:bg-muted/20">
                          <td className="py-3 px-3 text-muted-foreground text-xs">{idx + 1}</td>
                          <td className="py-3 px-3 font-medium text-foreground">
                            {item.medicine?.name || 'Medicine'}
                            {item.medicine?.category && (
                              <span className="block text-[11px] text-muted-foreground font-normal">
                                {item.medicine.category}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-mono font-medium text-primary text-xs">
                            {item.dosage || '—'}
                          </td>
                          <td className="py-3 px-3 text-muted-foreground">
                            {item.duration ? `${item.duration} days` : '—'}
                          </td>
                          <td className="py-3 px-3 text-muted-foreground text-xs">
                            {item.instructions || 'As directed'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center text-muted-foreground border border-dashed border-border rounded-xl">
                  No medicines prescribed.
                </div>
              )}
            </div>

            {/* Doctor Instructions & Clinical Notes */}
            {(viewPrescription.prescription?.instructions || viewPrescription.notes) && (
              <div className="space-y-3">
                {viewPrescription.prescription?.instructions && (
                  <div className="rounded-lg bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40 p-3.5 text-sm">
                    <div className="flex items-center gap-1.5 font-semibold text-blue-900 dark:text-blue-300 text-xs mb-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Doctor's Instructions
                    </div>
                    <p className="text-blue-800 dark:text-blue-200 text-xs leading-relaxed">
                      {viewPrescription.prescription.instructions}
                    </p>
                  </div>
                )}
                {viewPrescription.notes && (
                  <div className="rounded-lg bg-muted/40 border border-border p-3.5 text-sm">
                    <div className="text-xs font-semibold text-muted-foreground mb-1">Doctor's Clinical Notes</div>
                    <p className="text-foreground text-xs leading-relaxed">{viewPrescription.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                Print Prescription
              </button>
              <button
                type="button"
                onClick={() => setViewPrescription(null)}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={showModal} onClose={() => { setShowModal(false); reset(); }} title="New Consultation / EMR Entry">
        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">Appointment (Checked-In)</label>
            <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary" {...register('appointmentId', { required: true })}>
              <option value="">Select appointment</option>
              {apptData?.appointments?.map((a: any) => (
                <option key={a.id} value={a.id}>
                  {a.patient.user.firstName} {a.patient.user.lastName} — Dr. {a.doctor.user.firstName} {a.doctor.user.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Symptoms / Chief Complaint</label>
              <textarea className="h-16 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary resize-none" placeholder="Describe symptoms..." {...register('symptoms')} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Diagnosis</label>
              <input type="text" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary" placeholder="Primary diagnosis" {...register('diagnosis')} />
            </div>
          </div>

          {/* Vitals */}
          <div>
            <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Vitals</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { name: 'vitals.bloodPressure', label: 'BP (e.g. 120/80)' },
                { name: 'vitals.pulse', label: 'Pulse (bpm)' },
                { name: 'vitals.temperature', label: 'Temp (°C)' },
                { name: 'vitals.spO2', label: 'SpO2 (%)' },
                { name: 'vitals.weight', label: 'Weight (kg)' },
                { name: 'vitals.height', label: 'Height (cm)' },
              ].map(f => (
                <div key={f.name}>
                  <label className="block text-xs text-muted-foreground mb-1">{f.label}</label>
                  <input type="text" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary" {...register(f.name as any)} />
                </div>
              ))}
            </div>
          </div>

          {/* Prescription */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Prescription</h4>
              <button
                type="button"
                onClick={() => append({ medicineId: '', dosage: '', duration: '', instructions: '' })}
                className="text-xs text-primary flex items-center gap-1 hover:underline"
              >
                <Plus className="h-3 w-3" /> Add Medicine
              </button>
            </div>
            <div className="space-y-3">
              {fields.map((field, idx) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-start p-3 bg-muted/30 rounded-lg">
                  <div className="col-span-4">
                    <select className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-primary" {...register(`prescription.items.${idx}.medicineId` as any)}>
                      <option value="">Medicine</option>
                      {medsData?.medicines?.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <input type="text" placeholder="Dosage (e.g. 1-0-1)" className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-primary" {...register(`prescription.items.${idx}.dosage` as any)} />
                  </div>
                  <div className="col-span-2">
                    <input type="number" placeholder="Days" className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-primary" {...register(`prescription.items.${idx}.duration` as any)} />
                  </div>
                  <div className="col-span-2">
                    <input type="text" placeholder="Note" className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-primary" {...register(`prescription.items.${idx}.instructions` as any)} />
                  </div>
                  <div className="col-span-1 flex justify-center pt-1">
                    <button type="button" onClick={() => remove(idx)} className="text-destructive hover:bg-destructive/10 p-1.5 rounded">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Doctor's Notes</label>
              <textarea className="h-16 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary resize-none" placeholder="Additional notes" {...register('notes')} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Follow-up Date</label>
              <input type="date" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary" {...register('followUpDate')} />
            </div>
          </div>

          {createMutation.isError && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {(createMutation.error as any)?.message}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setShowModal(false); reset(); }} className="flex-1 h-10 rounded-lg border border-border text-sm font-medium hover:bg-muted">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
              {createMutation.isPending ? 'Saving...' : 'Save Consultation'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
