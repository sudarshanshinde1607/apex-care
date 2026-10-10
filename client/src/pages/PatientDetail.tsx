import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { patientsApi } from '../lib/services';
import { formatDate, formatDateTime, formatCurrency, getStatusBadgeColor } from '../lib/utils';
import { User, Phone, Calendar, Droplets, AlertCircle, ArrowLeft, Activity, FileText, FlaskConical, BedDouble } from 'lucide-react';

const Section: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
  <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
    <div className="flex items-center gap-2 px-6 py-4 border-b border-border bg-muted/20">
      <Icon className="h-5 w-5 text-primary" />
      <h3 className="font-semibold">{title}</h3>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

export const PatientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => patientsApi.getOne(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading patient details...</div>;
  }

  const patient = data?.patient;
  if (!patient) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold">Patient not found</h2>
        <Link to="/patients" className="text-primary hover:underline mt-2 block">Back to patients</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/patients" className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{patient.user.firstName} {patient.user.lastName}</h1>
          <p className="text-muted-foreground">{patient.patientId}</p>
        </div>
      </div>

      {/* Demographics */}
      <Section title="Patient Information" icon={User}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Patient ID</p>
            <p className="font-mono font-medium text-primary">{patient.patientId}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Date of Birth</p>
            <p className="font-medium flex items-center gap-1"><Calendar className="h-4 w-4" />{formatDate(patient.dob)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Gender</p>
            <p className="font-medium">{patient.gender}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Blood Group</p>
            <p className="font-medium flex items-center gap-1">
              <Droplets className="h-4 w-4 text-red-500" />
              {patient.bloodGroup ?? 'Not recorded'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Email</p>
            <p className="font-medium">{patient.user.email}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Phone</p>
            <p className="font-medium flex items-center gap-1"><Phone className="h-4 w-4" />{patient.user.phone ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Emergency Contact</p>
            <p className="font-medium">{patient.emergencyContact ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Address</p>
            <p className="font-medium">{patient.address ?? '—'}</p>
          </div>
        </div>
        {patient.allergies && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-orange-800">Known Allergies</p>
              <p className="text-sm text-orange-700">{patient.allergies}</p>
            </div>
          </div>
        )}
      </Section>

      {/* Recent Appointments */}
      <Section title="Appointment History" icon={Calendar}>
        {patient.appointments?.length > 0 ? (
          <div className="space-y-2">
            {patient.appointments.map((appt: any) => (
              <div key={appt.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/20 transition-colors">
                <div>
                  <p className="font-medium text-sm">Dr. {appt.doctor.user.firstName} {appt.doctor.user.lastName}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(appt.appointmentDate)}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusBadgeColor(appt.status)}`}>
                  {appt.status}
                </span>
              </div>
            ))}
          </div>
        ) : <p className="text-muted-foreground text-sm">No appointments found</p>}
      </Section>

      {/* Consultations */}
      <Section title="Medical History / Consultations" icon={Activity}>
        {patient.consultations?.length > 0 ? (
          <div className="space-y-4">
            {patient.consultations.map((c: any) => (
              <div key={c.id} className="p-4 rounded-lg border border-border">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">Dr. {c.doctor.user.firstName} {c.doctor.user.lastName}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(c.createdAt ?? new Date())}</p>
                </div>
                {c.diagnosis && (
                  <p className="text-sm mb-2"><span className="font-medium">Diagnosis:</span> {c.diagnosis}</p>
                )}
                {c.vitals && (
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    {c.vitals.bloodPressure && <span>BP: {c.vitals.bloodPressure}</span>}
                    {c.vitals.pulse && <span>Pulse: {c.vitals.pulse} bpm</span>}
                    {c.vitals.temperature && <span>Temp: {c.vitals.temperature}°C</span>}
                    {c.vitals.spO2 && <span>SpO2: {c.vitals.spO2}%</span>}
                  </div>
                )}
                {c.prescription?.items?.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Prescriptions:</p>
                    <div className="flex flex-wrap gap-1">
                      {c.prescription.items.map((item: any) => (
                        <span key={item.id} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                          {item.medicine.name} ({item.dosage})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : <p className="text-muted-foreground text-sm">No consultation records</p>}
      </Section>

      {/* Lab Orders */}
      <Section title="Lab Orders" icon={FlaskConical}>
        {patient.labOrders?.length > 0 ? (
          <div className="space-y-2">
            {patient.labOrders.map((order: any) => (
              <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <p className="font-medium text-sm">{order.test.name}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(order.orderDate)}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusBadgeColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
            ))}
          </div>
        ) : <p className="text-muted-foreground text-sm">No lab orders</p>}
      </Section>

      {/* Invoices */}
      <Section title="Billing History" icon={FileText}>
        {patient.invoices?.length > 0 ? (
          <div className="space-y-2">
            {patient.invoices.map((inv: any) => (
              <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <p className="font-medium text-sm">{inv.invoiceNo}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(inv.issueDate)}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(inv.netAmount)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusBadgeColor(inv.status)}`}>
                    {inv.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-muted-foreground text-sm">No invoices</p>}
      </Section>
    </div>
  );
};
