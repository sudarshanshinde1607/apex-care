import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { appointmentsApi, consultationsApi, labApi, billingApi } from '../lib/services';
import { Calendar, FlaskConical, FileText, Stethoscope, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const statusColors: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  NO_SHOW: 'bg-gray-100 text-gray-600',
  PENDING: 'bg-yellow-100 text-yellow-700',
  PAID: 'bg-green-100 text-green-700',
  UNPAID: 'bg-red-100 text-red-700',
  PARTIAL: 'bg-orange-100 text-orange-700',
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[status] ?? 'bg-gray-100 text-gray-600'}`}>
    {status.replace(/_/g, ' ')}
  </span>
);

export const PatientPortal: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'appointments' | 'consultations' | 'lab' | 'billing'>('appointments');

  const { data: appointmentsData, isLoading: loadingAppts } = useQuery({
    queryKey: ['patient-portal-appointments'],
    queryFn: () => appointmentsApi.getAll(),
    enabled: activeTab === 'appointments',
  });

  const { data: consultationsData, isLoading: loadingConsults } = useQuery({
    queryKey: ['patient-portal-consultations'],
    queryFn: () => consultationsApi.getAll(),
    enabled: activeTab === 'consultations',
  });

  const { data: labData, isLoading: loadingLab } = useQuery({
    queryKey: ['patient-portal-lab'],
    queryFn: () => labApi.getOrders(),
    enabled: activeTab === 'lab',
  });

  const { data: billingData, isLoading: loadingBilling } = useQuery({
    queryKey: ['patient-portal-billing'],
    queryFn: () => billingApi.getInvoices(),
    enabled: activeTab === 'billing',
  });

  const tabs = [
    { id: 'appointments', label: 'My Appointments', icon: Calendar },
    { id: 'consultations', label: 'My Consultations', icon: Stethoscope },
    { id: 'lab', label: 'Lab Results', icon: FlaskConical },
    { id: 'billing', label: 'My Bills', icon: FileText },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Patient Portal</h1>
        <p className="text-muted-foreground mt-1">Welcome, {user?.firstName}! View your health records below.</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Appointments */}
      {activeTab === 'appointments' && (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Doctor</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date & Time</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Reason</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {loadingAppts ? (
                <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : appointmentsData?.appointments?.length > 0 ? (
                appointmentsData.appointments.map((a: any) => (
                  <tr key={a.id} className="border-t border-border hover:bg-muted/30">
                    <td className="py-3 px-4 font-medium">Dr. {a.doctor?.user?.firstName} {a.doctor?.user?.lastName}</td>
                    <td className="py-3 px-4 text-muted-foreground">{new Date(a.appointmentDate).toLocaleString()}</td>
                    <td className="py-3 px-4 text-muted-foreground">{a.reason || '—'}</td>
                    <td className="py-3 px-4"><StatusBadge status={a.status} /></td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">No appointments found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Consultations */}
      {activeTab === 'consultations' && (
        <div className="space-y-4">
          {loadingConsults ? (
            <p className="text-center text-muted-foreground py-8">Loading...</p>
          ) : consultationsData?.consultations?.length > 0 ? (
            consultationsData.consultations.map((c: any) => (
              <div key={c.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-foreground">
                      Dr. {c.doctor?.user?.firstName} {c.doctor?.user?.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                {c.diagnosis && (
                  <div className="mb-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Diagnosis</span>
                    <p className="text-sm mt-1">{c.diagnosis}</p>
                  </div>
                )}
                {c.vitals && (
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    {c.vitals.bloodPressure && <div className="rounded-lg bg-muted/50 p-2 text-center"><p className="text-xs text-muted-foreground">BP</p><p className="font-semibold text-sm">{c.vitals.bloodPressure}</p></div>}
                    {c.vitals.pulse && <div className="rounded-lg bg-muted/50 p-2 text-center"><p className="text-xs text-muted-foreground">Pulse</p><p className="font-semibold text-sm">{c.vitals.pulse} bpm</p></div>}
                    {c.vitals.temperature && <div className="rounded-lg bg-muted/50 p-2 text-center"><p className="text-xs text-muted-foreground">Temp</p><p className="font-semibold text-sm">{c.vitals.temperature}°C</p></div>}
                  </div>
                )}
                {c.prescription?.items?.length > 0 && (
                  <div className="mt-3 border-t border-border pt-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Prescription</p>
                    {c.prescription.items.map((item: any, i: number) => (
                      <p key={i} className="text-sm">• {item.medicine?.name} — {item.dosage} for {item.duration} days</p>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">No consultations found.</p>
          )}
        </div>
      )}

      {/* Lab Results */}
      {activeTab === 'lab' && (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Test</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Order Date</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Result</th>
              </tr>
            </thead>
            <tbody>
              {loadingLab ? (
                <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : labData?.orders?.length > 0 ? (
                labData.orders.map((o: any) => (
                  <tr key={o.id} className="border-t border-border hover:bg-muted/30">
                    <td className="py-3 px-4 font-medium">{o.test?.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{new Date(o.orderDate).toLocaleDateString()}</td>
                    <td className="py-3 px-4"><StatusBadge status={o.status} /></td>
                    <td className="py-3 px-4 text-muted-foreground">{o.result?.resultData || '—'}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">No lab orders found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Billing */}
      {activeTab === 'billing' && (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Invoice #</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Amount</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {loadingBilling ? (
                <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : billingData?.invoices?.length > 0 ? (
                billingData.invoices.map((inv: any) => (
                  <tr key={inv.id} className="border-t border-border hover:bg-muted/30">
                    <td className="py-3 px-4 font-mono font-medium">{inv.invoiceNo}</td>
                    <td className="py-3 px-4 text-muted-foreground">{new Date(inv.issueDate).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right font-semibold">₹{inv.netAmount.toLocaleString()}</td>
                    <td className="py-3 px-4"><StatusBadge status={inv.status} /></td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">No invoices found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
