import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../lib/services';
import { formatCurrency } from '../lib/utils';
import {
  Users, Calendar, DollarSign, BedDouble, FlaskConical,
  TrendingUp, Activity, UserCheck
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { useAuth } from '../context/AuthContext';

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
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getStats(),
    refetchInterval: 30000,
  });

  const { data: chartsData, isLoading: isLoadingCharts } = useQuery({
    queryKey: ['dashboard-charts'],
    queryFn: () => dashboardApi.getCharts(),
    refetchInterval: 30000,
  });

  if (isLoading || isLoadingCharts) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats?.totalRevenue)}
          icon={DollarSign}
          subtitle="Collected payments"
          color="green"
        />
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
