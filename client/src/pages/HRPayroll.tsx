import React, { useState } from 'react';
import { Users, Banknote, CalendarClock, Briefcase, Plus } from 'lucide-react';

const mockStaff = [
  { id: '1', name: 'Dr. John Doe', role: 'Cardiologist', department: 'Cardiology', salary: 150000, joinDate: '2020-01-15' },
  { id: '2', name: 'Alice Williams', role: 'Senior Nurse', department: 'Cardiology', salary: 65000, joinDate: '2021-06-10' },
  { id: '3', name: 'Bob Brown', role: 'Front Desk', department: 'Administration', salary: 45000, joinDate: '2022-03-01' },
];

const mockAttendance = [
  { id: '1', name: 'Dr. John Doe', date: '2026-10-09', checkIn: '08:50 AM', checkOut: '05:30 PM', status: 'Present' },
  { id: '2', name: 'Alice Williams', date: '2026-10-09', checkIn: '07:45 AM', checkOut: '04:00 PM', status: 'Present' },
  { id: '3', name: 'Bob Brown', date: '2026-10-09', checkIn: '-', checkOut: '-', status: 'On Leave' },
];

const mockPayroll = [
  { id: '1', name: 'Dr. John Doe', month: 'September 2026', base: 150000, deductions: 12000, netPay: 138000, status: 'Paid' },
  { id: '2', name: 'Alice Williams', month: 'September 2026', base: 65000, deductions: 5000, netPay: 60000, status: 'Paid' },
];

export const HRPayroll: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'directory' | 'attendance' | 'payroll'>('directory');

  const tabs = [
    { id: 'directory', label: 'Staff Directory', icon: Users },
    { id: 'attendance', label: 'Attendance', icon: CalendarClock },
    { id: 'payroll', label: 'Payroll', icon: Banknote },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">HR & Payroll</h1>
          <p className="text-muted-foreground mt-1">Manage hospital staff, attendance, and salaries.</p>
        </div>
      </div>

      <div className="border-b border-border">
        <nav className="flex gap-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'directory' && (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Role</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Department</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Joined</th>
              </tr>
            </thead>
            <tbody>
              {mockStaff.map(s => (
                <tr key={s.id} className="border-t border-border hover:bg-muted/30">
                  <td className="py-3 px-4 font-medium">{s.name}</td>
                  <td className="py-3 px-4 text-muted-foreground">{s.role}</td>
                  <td className="py-3 px-4 text-muted-foreground">{s.department}</td>
                  <td className="py-3 px-4 text-muted-foreground">{s.joinDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Check In</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Check Out</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {mockAttendance.map(a => (
                <tr key={a.id} className="border-t border-border hover:bg-muted/30">
                  <td className="py-3 px-4 font-medium">{a.name}</td>
                  <td className="py-3 px-4 text-muted-foreground">{a.date}</td>
                  <td className="py-3 px-4 font-mono text-muted-foreground">{a.checkIn}</td>
                  <td className="py-3 px-4 font-mono text-muted-foreground">{a.checkOut}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      a.status === 'Present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'payroll' && (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Employee</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Month</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Base Salary</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Deductions</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Net Pay</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {mockPayroll.map(p => (
                <tr key={p.id} className="border-t border-border hover:bg-muted/30">
                  <td className="py-3 px-4 font-medium">{p.name}</td>
                  <td className="py-3 px-4 text-muted-foreground">{p.month}</td>
                  <td className="py-3 px-4 text-right text-muted-foreground">₹{p.base.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-red-500">-₹{p.deductions.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right font-bold text-foreground">₹{p.netPay.toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
