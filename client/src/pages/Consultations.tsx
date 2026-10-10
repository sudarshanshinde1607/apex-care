import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { consultationsApi, appointmentsApi, pharmacyApi } from '../lib/services';
import { formatDate } from '../lib/utils';
import { Plus, X, Stethoscope, Trash2 } from 'lucide-react';

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
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                          {c.prescription.items.length} medicine(s)
                        </span>
                      ) : '—'}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{formatDate(c.followUpDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
