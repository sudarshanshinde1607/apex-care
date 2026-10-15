import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { appointmentsApi, doctorsApi, patientsApi } from '../lib/services';
import { formatDateTime } from '../lib/utils';
import { Plus, Calendar, X, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Modal: React.FC<{ open: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-xl rounded-xl bg-card border border-border shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

const apptSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  doctorId: z.string().min(1, 'Doctor is required'),
  appointmentDate: z.string().min(1, 'Date & time required'),
  reason: z.string().optional(),
});
type ApptForm = z.infer<typeof apptSchema>;

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-800',
  CHECKED_IN: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  NO_SHOW: 'bg-gray-100 text-gray-800',
};

export const Appointments: React.FC = () => {
  const { user } = useAuth();
  const isPatient = user?.role === 'PATIENT';
  const patientProfileId = user?.patient?.id;

  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const params: Record<string, string> = { page: String(page), limit: '20' };
  if (statusFilter) params.status = statusFilter;
  if (dateFilter) params.date = dateFilter;

  const { data, isLoading } = useQuery({
    queryKey: ['appointments', params, user?.id],
    queryFn: () => appointmentsApi.getAll(params),
    placeholderData: (prev) => prev,
  });

  const { data: patientsData } = useQuery({
    queryKey: ['patients-list'],
    queryFn: () => patientsApi.getAll({ limit: '200' }),
    enabled: !isPatient,
  });

  const { data: doctorsData } = useQuery({
    queryKey: ['doctors-list'],
    queryFn: () => doctorsApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: appointmentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setShowModal(false);
      reset();
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => appointmentsApi.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ApptForm>({
    resolver: zodResolver(apptSchema),
    defaultValues: {
      patientId: isPatient && patientProfileId ? patientProfileId : '',
    }
  });

  useEffect(() => {
    if (isPatient && patientProfileId) {
      setValue('patientId', patientProfileId);
    }
  }, [isPatient, patientProfileId, setValue, showModal]);

  const onSubmit = (formData: ApptForm) => {
    const finalPatientId = isPatient && patientProfileId ? patientProfileId : formData.patientId;
    createMutation.mutate({
      ...formData,
      patientId: finalPatientId,
      appointmentDate: new Date(formData.appointmentDate).toISOString(),
    });
  };

  const appointments = data?.appointments ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{isPatient ? 'My Appointments' : 'Appointments'}</h1>
          <p className="text-muted-foreground mt-1">
            {total} {isPatient ? 'appointment' : 'total appointment'}{total === 1 ? '' : 's'}
          </p>
        </div>
        <button
          onClick={() => {
            if (isPatient && patientProfileId) {
              setValue('patientId', patientProfileId);
            }
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Book Appointment
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 p-4 rounded-xl border border-border bg-card shadow-sm">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Filter by Status</label>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Statuses</option>
            {['SCHEDULED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].map(s => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Filter by Date</label>
          <input
            type="date"
            value={dateFilter}
            onChange={e => { setDateFilter(e.target.value); setPage(1); }}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        {(statusFilter || dateFilter) && (
          <div className="flex items-end">
            <button
              onClick={() => { setStatusFilter(''); setDateFilter(''); setPage(1); }}
              className="h-9 px-3 text-sm text-destructive border border-destructive/30 rounded-md hover:bg-destructive/10 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading appointments...</div>
        ) : appointments.length === 0 ? (
          <div className="p-16 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No appointments found</h3>
            {isPatient && (
              <p className="text-sm text-muted-foreground mb-4">You have not scheduled any appointments yet.</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {!isPatient && <th className="text-left py-3 px-4 font-medium text-muted-foreground">Patient</th>}
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Doctor</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Department</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date & Time</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Reason</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt: any) => (
                  <tr key={appt.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    {!isPatient && (
                      <td className="py-3 px-4">
                        <p className="font-medium">{appt.patient?.user?.firstName} {appt.patient?.user?.lastName}</p>
                        <p className="text-xs text-muted-foreground">{appt.patient?.patientId}</p>
                      </td>
                    )}
                    <td className="py-3 px-4">
                      <p className="font-medium">Dr. {appt.doctor?.user?.firstName} {appt.doctor?.user?.lastName}</p>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{appt.doctor?.department?.name ?? '—'}</td>
                    <td className="py-3 px-4 text-muted-foreground">{formatDateTime(appt.appointmentDate)}</td>
                    <td className="py-3 px-4 text-muted-foreground max-w-[150px] truncate">{appt.reason ?? '—'}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[appt.status] ?? ''}`}>
                        {appt.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        {appt.status === 'SCHEDULED' && (
                          <>
                            {!isPatient && (
                              <button
                                onClick={() => statusMutation.mutate({ id: appt.id, status: 'CHECKED_IN' })}
                                title="Check In"
                                className="p-1.5 rounded text-yellow-600 hover:bg-yellow-50 transition-colors"
                              >
                                <Clock className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => statusMutation.mutate({ id: appt.id, status: 'CANCELLED' })}
                              title="Cancel Appointment"
                              className="p-1.5 rounded text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {!isPatient && appt.status === 'CHECKED_IN' && (
                          <button
                            onClick={() => statusMutation.mutate({ id: appt.id, status: 'COMPLETED' })}
                            title="Mark Completed"
                            className="p-1.5 rounded text-green-600 hover:bg-green-50 transition-colors"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        {appt.status !== 'SCHEDULED' && (!isPatient ? appt.status !== 'CHECKED_IN' : true) && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {total > 20 && (
          <div className="flex items-center justify-between p-4 border-t border-border">
            <p className="text-sm text-muted-foreground">Showing {(page-1)*20+1}–{Math.min(page*20,total)} of {total}</p>
            <div className="flex gap-2">
              <button disabled={page===1} onClick={() => setPage(p=>p-1)} className="px-3 py-1 rounded border border-border text-sm disabled:opacity-50 hover:bg-muted">Previous</button>
              <button disabled={page*20>=total} onClick={() => setPage(p=>p+1)} className="px-3 py-1 rounded border border-border text-sm disabled:opacity-50 hover:bg-muted">Next</button>
            </div>
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => { setShowModal(false); reset(); }} title={isPatient ? "Book Appointment" : "Book New Appointment"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {isPatient ? (
            <div className="p-3 bg-muted/40 rounded-lg border border-border">
              <p className="text-xs text-muted-foreground">Booking for</p>
              <p className="font-medium text-sm text-foreground">
                {user?.firstName} {user?.lastName} {user?.patient?.patientId ? `(${user?.patient?.patientId})` : ''}
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-1">Patient</label>
              <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary" {...register('patientId')}>
                <option value="">Select patient</option>
                {patientsData?.patients?.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.user.firstName} {p.user.lastName} ({p.patientId})</option>
                ))}
              </select>
              {errors.patientId && <p className="mt-1 text-xs text-destructive">{errors.patientId.message}</p>}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Doctor</label>
            <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary" {...register('doctorId')}>
              <option value="">Select doctor</option>
              {doctorsData?.doctors?.map((d: any) => (
                <option key={d.id} value={d.id}>Dr. {d.user.firstName} {d.user.lastName} — {d.specialization}</option>
              ))}
            </select>
            {errors.doctorId && <p className="mt-1 text-xs text-destructive">{errors.doctorId.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date & Time</label>
            <input
              type="datetime-local"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
              {...register('appointmentDate')}
            />
            {errors.appointmentDate && <p className="mt-1 text-xs text-destructive">{errors.appointmentDate.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Reason / Complaint</label>
            <textarea
              className="h-16 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Brief reason for visit"
              {...register('reason')}
            />
          </div>
          {createMutation.isError && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {(createMutation.error as any)?.message}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setShowModal(false); reset(); }} className="flex-1 h-10 rounded-lg border border-border text-sm font-medium hover:bg-muted">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
              {createMutation.isPending ? 'Booking...' : 'Book Appointment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
