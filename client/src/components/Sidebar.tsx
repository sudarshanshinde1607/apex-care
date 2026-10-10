import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Activity,
  FileText,
  Pill,
  FlaskConical,
  BedDouble,
  LogOut,
  Stethoscope,
  Building2,
  Droplets,
  Briefcase,
  Truck
} from 'lucide-react';

interface NavLinkDef {
  to: string;
  icon: React.ElementType;
  label: string;
  roles?: string[];
}

const ALL_LINKS: NavLinkDef[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/patient-portal', icon: LayoutDashboard, label: 'My Portal', roles: ['PATIENT'] },
  { to: '/patients', icon: Users, label: 'Patients', roles: ['SUPER_ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'] },
  { to: '/appointments', icon: Calendar, label: 'Appointments', roles: ['SUPER_ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PATIENT'] },
  { to: '/consultations', icon: Stethoscope, label: 'Consultations', roles: ['SUPER_ADMIN', 'DOCTOR', 'NURSE'] },
  { to: '/wards', icon: BedDouble, label: 'Wards & Beds', roles: ['SUPER_ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'] },
  { to: '/pharmacy', icon: Pill, label: 'Pharmacy', roles: ['SUPER_ADMIN', 'PHARMACIST'] },
  { to: '/lab', icon: FlaskConical, label: 'Laboratory', roles: ['SUPER_ADMIN', 'LAB_TECHNICIAN', 'DOCTOR'] },
  { to: '/blood-bank', icon: Droplets, label: 'Blood Bank', roles: ['SUPER_ADMIN', 'NURSE', 'LAB_TECHNICIAN'] },
  { to: '/billing', icon: FileText, label: 'Billing', roles: ['SUPER_ADMIN', 'ACCOUNTANT', 'RECEPTIONIST'] },
  { to: '/hr-payroll', icon: Briefcase, label: 'HR & Payroll', roles: ['SUPER_ADMIN', 'ACCOUNTANT'] },
  { to: '/ambulance', icon: Truck, label: 'Ambulance', roles: ['SUPER_ADMIN', 'RECEPTIONIST'] },
];

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();

  const visibleLinks = ALL_LINKS.filter(link =>
    !link.roles || link.roles.includes(user?.role ?? '')
  );

  return (
    <aside className="flex w-64 flex-col border-r border-border bg-card h-screen sticky top-0 z-20">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-border gap-3">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
          <Activity className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <span className="text-base font-bold text-foreground">Apex Care</span>
          <p className="text-xs text-muted-foreground -mt-0.5">Healthcare System</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-0.5 px-3">
          {visibleLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`
              }
            >
              <link.icon className="mr-3 h-4 w-4 flex-shrink-0" />
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* User footer */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.role?.replace(/_/g, ' ')}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 gap-3"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};
