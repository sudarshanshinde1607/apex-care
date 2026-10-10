import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { patientsApi } from '../lib/services';
import { formatDate, getStatusBadgeColor } from '../lib/utils';
import { Plus, Search, Eye, Edit, X, User } from 'lucide-react';
import { Link } from 'react-router-dom';

const patientSchema = z.object({
  firstName: z.string().min(2, 'First name required'),
  lastName: z.string().min(2, 'Last name required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Invalid phone'),
  dob: z.string().min(1, 'Date of birth required'),
  gender: z.string().min(1, 'Gender required'),
  bloodGroup: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  allergies: z.string().optional(),
});

type PatientForm = z.infer<typeof patientSchema>;

const Modal: React.FC<{ open: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl rounded-xl bg-card border border-border shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-md transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export const Patients: React.FC = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['patients', search, page],
    queryFn: () => patientsApi.getAll({ search, page: String(page), limit: '20' }),
    placeholderData: (prev) => prev,
  });

  const createMutation = useMutation({
    mutationFn: patientsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setShowModal(false);
      reset();
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<PatientForm>({ resolver: zodResolver(patientSchema) });

  const onSubmit = (data: PatientForm) => createMutation.mutate(data);

  const patients = data?.patients ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Patient Management</h1>
          <p className="text-muted-foreground mt-1">{total} registered patients</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Register Patient
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="p-4 border-b border-border">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, ID, phone..."
              className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading patients...</div>
        ) : patients.length === 0 ? (
          <div className="p-16 text-center">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No patients found</h3>
            <p className="text-muted-foreground">Register the first patient to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Patient ID</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Gender</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">DOB</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Blood Group</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Phone</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p: any) => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                        {p.patientId}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {p.user.firstName} {p.user.lastName}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{p.gender}</td>
                    <td className="py-3 px-4 text-muted-foreground">{formatDate(p.dob)}</td>
                    <td className="py-3 px-4">
                      {p.bloodGroup ? (
                        <span className="bg-red-50 text-red-700 text-xs px-2 py-0.5 rounded font-medium">
                          {p.bloodGroup}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{p.user.phone ?? '—'}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/patients/${p.id}`}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </Link>
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
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 rounded border border-border text-sm disabled:opacity-50 hover:bg-muted transition-colors"
              >
                Previous
              </button>
              <button
                disabled={page * 20 >= total}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 rounded border border-border text-sm disabled:opacity-50 hover:bg-muted transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => { setShowModal(false); reset(); }} title="Register New Patient">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { id: 'firstName', label: 'First Name', type: 'text', placeholder: 'John' },
              { id: 'lastName', label: 'Last Name', type: 'text', placeholder: 'Doe' },
              { id: 'email', label: 'Email', type: 'email', placeholder: 'patient@email.com' },
              { id: 'phone', label: 'Phone', type: 'tel', placeholder: '9876543210' },
            ].map(({ id, label, type, placeholder }) => (
              <div key={id}>
                <label className="block text-sm font-medium mb-1">{label}</label>
                <input
                  type={type}
                  placeholder={placeholder}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                  {...register(id as keyof PatientForm)}
                />
                {errors[id as keyof PatientForm] && (
                  <p className="mt-1 text-xs text-destructive">{errors[id as keyof PatientForm]?.message}</p>
                )}
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium mb-1">Date of Birth</label>
              <input
                type="date"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                {...register('dob')}
              />
              {errors.dob && <p className="mt-1 text-xs text-destructive">{errors.dob.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Gender</label>
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                {...register('gender')}
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender && <p className="mt-1 text-xs text-destructive">{errors.gender.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Blood Group</label>
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                {...register('bloodGroup')}
              >
                <option value="">Unknown</option>
                {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <textarea
              className="h-16 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Full address"
              {...register('address')}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Emergency Contact</label>
              <input
                type="tel"
                placeholder="Emergency phone"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                {...register('emergencyContact')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Known Allergies</label>
              <input
                type="text"
                placeholder="e.g., Penicillin"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                {...register('allergies')}
              />
            </div>
          </div>
          {createMutation.isError && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {(createMutation.error as any)?.message ?? 'Failed to register patient'}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setShowModal(false); reset(); }}
              className="flex-1 h-10 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || createMutation.isPending}
              className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {createMutation.isPending ? 'Registering...' : 'Register Patient'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
