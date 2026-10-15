import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../lib/services';
import { formatCurrency, formatDateTime } from '../lib/utils';
import {
  Users, Calendar, DollarSign, BedDouble, FlaskConical,
  TrendingUp, Activity, UserCheck, Stethoscope, Pill,
  FileText, Clock, Heart, AlertCircle, ArrowRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ElementType;
  subtitle?: string;
  color?: string;
}> = ({ title, value, icon: Icon, subtitle, color = 'primary' }) => {
  const colorMap: Record<string, string> = {
    primary: 'bg-blue-500/10 text-blue-600',
    green: 'bg-green-500/10 text-green-600',
    orange: 'bg-orange-500/10 text-orange-600',
    purple: 'bg-purple-500/10 text-purple-600',
    red: 'bg-red-500/10 text-red-600',
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <TrendingUp className="h-4 w-4 text-green-500" />
      </div>
      <div className="text-2xl font-bold text-foreground mb-1">{value}</div>
      <div className="text-sm font-medium text-foreground">{title}</div>
      {subtitle && <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>}
    </div>
  );
};

const COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const isPatient = user?.role === 'PATIENT';

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: () => dashboardApi.getStats(),
    refetchInterval: 30000,
  });

  const { data: chartsData, isLoading: isLoadingCharts } = useQuery({
    queryKey: ['dashboard-charts'],
    queryFn: () => dashboardApi.getCharts(),
    refetchInterval: 30000,
    enabled: !isPatient,
  });

  const isSuperAdmin = user?.role?.toUpperCase() === 'SUPER_ADMIN';

  if (isLoading || (!isPatient && isLoadingCharts)) {
    return (
      <div className="space-y-6">
        <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${isPatient ? 'lg:grid-cols-4' : (isSuperAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-3')}`}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-6 animate-pulse">
              <div className="h-12 w-12 rounded-xl bg-muted mb-4" />
              <div className="h-8 w-1/2 bg-muted rounded mb-2" />
              <div className="h-4 w-3/4 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const stats = data;

  // --------------------------------------------------------------------------
  // PATIENT DASHBOARD VIEW
  // --------------------------------------------------------------------------
  if (isPatient) {
    const pProfile = stats?.patientProfile;
    const vitals = stats?.latestVitals;
    const admission = stats?.currentAdmission;

    return (
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-blue-600/10 via-cyan-500/10 to-teal-500/10 border border-blue-500/20">
          <div>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-700 dark:text-blue-300 mb-2">
              Patient Portal Dashboard
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Welcome back, {user?.firstName}! 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              Patient ID: <span className="font-semibold text-foreground">{pProfile?.patientId || user?.patient?.patientId || 'N/A'}</span>
              {pProfile?.bloodGroup && ` • Blood Group: ${pProfile.bloodGroup}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/appointments"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 shadow-sm transition-all"
            >
              <Calendar className="h-4 w-4" />
              Book Appointment
            </Link>
            <Link
              to="/patient-portal"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card font-medium text-sm hover:bg-muted transition-all"
            >
              My Full Portal
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Admission Notification Banner if currently admitted */}
        {admission && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-3">
              <BedDouble className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-semibold text-sm">Currently Admitted in Hospital</p>
                <p className="text-xs text-muted-foreground">
                  Ward: {admission.bed?.room?.ward?.name} • Room {admission.bed?.room?.roomNumber} • Bed {admission.bed?.bedNumber}
                </p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-medium">
              Inpatient Care
            </span>
          </div>
        )}

        {/* Personalized Stat Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Upcoming Appointments"
            value={stats?.upcomingAppointments ?? 0}
            icon={Calendar}
            subtitle="Scheduled visits"
            color="primary"
          />
          <StatCard
            title="My Prescriptions"
            value={stats?.prescriptionsCount ?? 0}
            icon={Pill}
            subtitle="Medications on record"
            color="green"
          />
          <StatCard
            title="Pending Lab Tests"
            value={stats?.pendingLabResults ?? 0}
            icon={FlaskConical}
            subtitle="Awaiting results"
            color="purple"
          />
          <StatCard
            title="Pending Invoices"
            value={stats?.unpaidInvoices ?? 0}
            icon={FileText}
            subtitle={stats?.unpaidInvoices === 0 ? 'All bills cleared' : 'Awaiting payment'}
            color={stats?.unpaidInvoices > 0 ? 'orange' : 'green'}
          />
        </div>

        {/* Main 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming & Recent Appointments */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                My Appointments
              </h3>
              <Link to="/appointments" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {stats?.recentAppointments?.length > 0 ? (
              <div className="divide-y divide-border">
                {stats.recentAppointments.map((appt: any) => (
                  <div key={appt.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm">
                        Dr. {appt.doctor?.user?.firstName} {appt.doctor?.user?.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {appt.doctor?.department?.name || 'General Medicine'} • {appt.reason || 'Checkup'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(appt.appointmentDate)}
                      </span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                        appt.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                        appt.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        appt.status === 'CHECKED_IN' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {appt.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-muted-foreground">
                <Calendar className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-medium">No appointments booked yet</p>
                <Link to="/appointments" className="mt-3 inline-block text-xs text-primary font-medium hover:underline">
                  Schedule your first appointment
                </Link>
              </div>
            )}
          </div>

          {/* Vitals & Health Summary */}
          <div className="space-y-6">
            {/* Latest Vitals Card */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Latest Health Vitals
              </h3>
              {vitals ? (
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 rounded-lg bg-muted/40 border border-border">
                    <p className="text-xs text-muted-foreground">Blood Pressure</p>
                    <p className="text-lg font-bold text-foreground">
                      {vitals.bloodPressureSystolic && vitals.bloodPressureDiastolic
                        ? `${vitals.bloodPressureSystolic}/${vitals.bloodPressureDiastolic}`
                        : '—'}
                    </p>
                    <span className="text-[10px] text-muted-foreground">mmHg</span>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40 border border-border">
                    <p className="text-xs text-muted-foreground">Heart Rate</p>
                    <p className="text-lg font-bold text-foreground">
                      {vitals.heartRate ? `${vitals.heartRate}` : '—'}
                    </p>
                    <span className="text-[10px] text-muted-foreground">bpm</span>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40 border border-border">
                    <p className="text-xs text-muted-foreground">Temperature</p>
                    <p className="text-lg font-bold text-foreground">
                      {vitals.temperature ? `${vitals.temperature}°F` : '—'}
                    </p>
                    <span className="text-[10px] text-muted-foreground">Fahrenheit</span>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40 border border-border">
                    <p className="text-xs text-muted-foreground">Oxygen (SpO2)</p>
                    <p className="text-lg font-bold text-foreground">
                      {vitals.oxygenSaturation ? `${vitals.oxygenSaturation}%` : '—'}
                    </p>
                    <span className="text-[10px] text-muted-foreground">saturation</span>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-muted-foreground text-sm">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  No vital signs recorded yet.
                </div>
              )}
            </div>

            {/* Quick Profile / Emergency Contact */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                Medical Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Blood Type:</span>
                  <span className="font-medium text-foreground">{pProfile?.bloodGroup || 'Not specified'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Allergies:</span>
                  <span className="font-medium text-foreground">{pProfile?.allergies || 'None reported'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Emergency Contact:</span>
                  <span className="font-medium text-foreground">{pProfile?.emergencyContact || 'Not provided'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Consultations / Prescriptions */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-teal-600" />
              Recent Consultations & Prescriptions
            </h3>
            <Link to="/patient-portal" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
              View all medical records <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {stats?.recentConsultations?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats.recentConsultations.map((c: any) => (
                <div key={c.id} className="p-4 rounded-xl border border-border bg-muted/20 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                        Dr. {c.doctor?.user?.firstName} {c.doctor?.user?.lastName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {c.doctor?.department?.name}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1">
                      Diagnosis: {c.diagnosis || 'Checkup consultation'}
                    </p>
                    {c.symptoms && (
                      <p className="text-xs text-muted-foreground mb-3">
                        Symptoms: {c.symptoms}
                      </p>
                    )}
                  </div>

                  {c.prescription?.items?.length > 0 ? (
                    <div className="pt-3 border-t border-border/50">
                      <p className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                        <Pill className="h-3.5 w-3.5 text-green-600" />
                        Prescribed ({c.prescription.items.length}):
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {c.prescription.items.map((item: any, idx: number) => (
                          <span key={idx} className="text-[11px] px-2 py-0.5 rounded bg-card border border-border text-foreground">
                            {item.medicine?.name} ({item.dosage})
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic pt-2 border-t border-border/50">
                      No medications prescribed
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground text-sm">
              No recent consultations found.
            </div>
          )}
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // STAFF / ADMIN DASHBOARD VIEW
  // --------------------------------------------------------------------------
  const apptPieData = stats?.appointmentsByStatus?.map((a: any) => ({
    name: a.status,
    value: a._count.id,
  })) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, {user?.firstName}! 👋
        </h1>
        <p className="text-muted-foreground mt-1">Here's what's happening at the hospital today.</p>
      </div>

      <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${isSuperAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
        <StatCard
          title="Total Patients"
          value={stats?.totalPatients ?? 0}
          icon={Users}
          subtitle="Registered patients"
          color="primary"
        />
        <StatCard
          title="Today's Appointments"
          value={stats?.todayAppointments ?? 0}
          icon={Calendar}
          subtitle="Scheduled for today"
          color="purple"
        />
        {isSuperAdmin && (
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats?.totalRevenue)}
            icon={DollarSign}
            subtitle="Collected payments"
            color="green"
          />
        )}
        <StatCard
          title="Bed Occupancy"
          value={`${stats?.bedOccupancy ?? 0}%`}
          icon={BedDouble}
          subtitle={`${stats?.availableBeds ?? 0} of ${stats?.totalBeds ?? 0} beds available`}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Appointments by Status */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Today's Appointment Summary
          </h3>
          {apptPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={apptPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {apptPieData.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[220px] items-center justify-center text-muted-foreground">
              No appointments today
            </div>
          )}
        </div>

        {/* Revenue Chart */}
        {isSuperAdmin && (
          <div className="lg:col-span-3 rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Revenue (Last 7 Days)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartsData?.revenueByDay || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis />
                <RechartsTooltip formatter={(value) => formatCurrency(value as number)} />
                <Bar dataKey="revenue" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Appointments Chart */}
        <div className="lg:col-span-3 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Appointments (Last 7 Days)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartsData?.appointmentsByDay || []}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" />
              <YAxis />
              <RechartsTooltip />
              <Area type="monotone" dataKey="count" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorCount)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Stats */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            Quick Overview
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/10">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium">Pending Lab Orders</span>
              </div>
              <span className="font-bold text-yellow-700">{stats?.pendingLabOrders ?? 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10">
              <div className="flex items-center gap-2">
                <BedDouble className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Beds Occupied</span>
              </div>
              <span className="font-bold text-blue-700">{(stats?.totalBeds ?? 0) - (stats?.availableBeds ?? 0)}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/10">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Beds Available</span>
              </div>
              <span className="font-bold text-green-700">{stats?.availableBeds ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Patients */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Recently Registered Patients</h3>
        {stats?.recentPatients?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-4 text-muted-foreground font-medium">Name</th>
                  <th className="text-left py-2 px-4 text-muted-foreground font-medium">Registered</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentPatients.map((p: any) => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-medium">
                      {p.user.firstName} {p.user.lastName}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {new Date(p.user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">No patients registered yet</div>
        )}
      </div>
    </div>
  );
};
