import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { wardsApi, doctorsApi, patientsApi } from '../lib/services';
import { formatDate, getStatusBadgeColor } from '../lib/utils';
import { Plus, X, BedDouble, UserMinus } from 'lucide-react';

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

export const Wards: React.FC = () => {
  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [showDischargeModal, setShowDischargeModal] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: wardsData, isLoading: loadingWards } = useQuery({
    queryKey: ['wards'],
    queryFn: wardsApi.getAll,
  });

  const { data: admissionsData } = useQuery({
    queryKey: ['admissions', 'ADMITTED'],
    queryFn: () => wardsApi.getAdmissions({ status: 'ADMITTED' }),
  });

  const { data: patientsData } = useQuery({
    queryKey: ['patients-list'],
    queryFn: () => patientsApi.getAll({ limit: '200' }),
    enabled: showAdmitModal,
  });

  const { data: doctorsData } = useQuery({
    queryKey: ['doctors-list'],
    queryFn: () => doctorsApi.getAll(),
    enabled: showAdmitModal,
  });

  const { register: regAdmit, handleSubmit: handleAdmit, reset: resetAdmit } = useForm();
  const { register: regDischarge, handleSubmit: handleDischarge, reset: resetDischarge } = useForm();

  const admitMutation = useMutation({
    mutationFn: wardsApi.admit,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['wards'] }); queryClient.invalidateQueries({ queryKey: ['admissions'] }); setShowAdmitModal(false); resetAdmit(); },
  });

  const dischargeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => wardsApi.discharge(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['wards'] }); queryClient.invalidateQueries({ queryKey: ['admissions'] }); setShowDischargeModal(null); resetDischarge(); },
  });

  const wards = wardsData?.wards ?? [];
  const admissions = admissionsData?.admissions ?? [];

  // Collect available beds for dropdown
  const availableBeds: { id: string; label: string }[] = [];
  wards.forEach((ward: any) => {
    ward.rooms?.forEach((room: any) => {
      room.beds?.forEach((bed: any) => {
        if (bed.status === 'AVAILABLE') {
          availableBeds.push({ id: bed.id, label: `${ward.name} / Room ${room.roomNo} / Bed ${bed.bedNo}` });
        }
      });
    });
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Wards & Admissions</h1>
          <p className="text-muted-foreground mt-1">{admissions.length} current admissions</p>
        </div>
        <button onClick={() => setShowAdmitModal(true)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Admit Patient
        </button>
      </div>

      {/* Bed Map */}
      {loadingWards ? (
        <div className="p-8 text-center text-muted-foreground">Loading wards...</div>
      ) : (
        <div className="space-y-4">
          {wards.map((ward: any) => (
            <div key={ward.id} className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-muted/20 flex items-center gap-2">
                <BedDouble className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">{ward.name}</h3>
                <span className="text-sm text-muted-foreground">({ward.department?.name})</span>
              </div>
              <div className="p-6">
                {ward.rooms?.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No rooms in this ward</p>
                ) : (
                  <div className="space-y-4">
                    {ward.rooms?.map((room: any) => (
                      <div key={room.id}>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Room {room.roomNo} ({room.type})</p>
                        <div className="flex flex-wrap gap-2">
                          {room.beds?.map((bed: any) => {
                            const occupied = bed.admissions?.find((a: any) => a.status === 'ADMITTED');
                            return (
                              <div
                                key={bed.id}
                                className={`flex flex-col items-center justify-center w-20 h-20 rounded-lg border-2 text-xs font-medium transition-colors ${
                                  bed.status === 'AVAILABLE' ? 'border-green-300 bg-green-50 text-green-700' :
                                  bed.status === 'OCCUPIED' ? 'border-red-300 bg-red-50 text-red-700' :
                                  'border-gray-300 bg-gray-50 text-gray-500'
                                }`}
                              >
                                <BedDouble className="h-5 w-5 mb-1" />
                                <span>Bed {bed.bedNo}</span>
                                <span className="text-[10px]">{bed.status}</span>
                                {occupied && (
                                  <span className="text-[9px] truncate max-w-[70px] px-1">
                                    {occupied.patient?.user?.firstName}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Current Admissions */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-semibold">Current Admissions</h3>
        </div>
        {admissions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No current admissions</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Patient</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Doctor</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Ward / Bed</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Admitted</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Reason</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {admissions.map((adm: any) => (
                  <tr key={adm.id} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="py-3 px-4 font-medium">{adm.patient.user.firstName} {adm.patient.user.lastName}</td>
                    <td className="py-3 px-4 text-muted-foreground">Dr. {adm.doctor.user.firstName} {adm.doctor.user.lastName}</td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {adm.bed.room?.ward?.name} / Bed {adm.bed.bedNo}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{formatDate(adm.admissionDate)}</td>
                    <td className="py-3 px-4 text-muted-foreground max-w-[150px] truncate">{adm.reason}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setShowDischargeModal(adm.id)}
                        className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 flex items-center gap-1"
                      >
                        <UserMinus className="h-3 w-3" /> Discharge
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admit Modal */}
      <Modal open={showAdmitModal} onClose={() => { setShowAdmitModal(false); resetAdmit(); }} title="Admit Patient">
        <form onSubmit={handleAdmit((d) => admitMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Patient *</label>
            <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary" {...regAdmit('patientId', { required: true })}>
              <option value="">Select patient</option>
              {patientsData?.patients?.map((p: any) => <option key={p.id} value={p.id}>{p.user.firstName} {p.user.lastName} ({p.patientId})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Doctor in Charge *</label>
            <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary" {...regAdmit('doctorId', { required: true })}>
              <option value="">Select doctor</option>
              {doctorsData?.doctors?.map((d: any) => <option key={d.id} value={d.id}>Dr. {d.user.firstName} {d.user.lastName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bed *</label>
            <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary" {...regAdmit('bedId', { required: true })}>
              <option value="">Select available bed</option>
              {availableBeds.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
            </select>
            {availableBeds.length === 0 && <p className="mt-1 text-xs text-orange-600">No beds available</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Reason for Admission *</label>
            <textarea className="h-16 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary resize-none" {...regAdmit('reason', { required: true })} />
          </div>
          {admitMutation.isError && <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{(admitMutation.error as any)?.message}</div>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setShowAdmitModal(false); resetAdmit(); }} className="flex-1 h-10 rounded-lg border border-border text-sm font-medium hover:bg-muted">Cancel</button>
            <button type="submit" disabled={admitMutation.isPending} className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
              {admitMutation.isPending ? 'Admitting...' : 'Admit Patient'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Discharge Modal */}
      <Modal open={!!showDischargeModal} onClose={() => { setShowDischargeModal(null); resetDischarge(); }} title="Discharge Patient">
        <form onSubmit={handleDischarge((d) => dischargeMutation.mutate({ id: showDischargeModal!, data: d }))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Discharge Summary</label>
            <textarea
              className="h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Clinical summary, treatment given, follow-up instructions..."
              {...regDischarge('dischargeSummary')}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setShowDischargeModal(null); resetDischarge(); }} className="flex-1 h-10 rounded-lg border border-border text-sm font-medium hover:bg-muted">Cancel</button>
            <button type="submit" disabled={dischargeMutation.isPending} className="flex-1 h-10 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {dischargeMutation.isPending ? 'Discharging...' : 'Discharge Patient'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
