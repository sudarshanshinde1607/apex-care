import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchApi } from '../lib/api';
import { Activity, ShieldCheck, Stethoscope, UserCheck, RefreshCw, Database } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@hms.com', label: 'Super Admin', icon: ShieldCheck, color: 'text-purple-600 bg-purple-50 hover:bg-purple-100 border-purple-200' },
  { role: 'Doctor', email: 'doctor1@hms.com', label: 'Cardiologist', icon: Stethoscope, color: 'text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-200' },
  { role: 'Nurse', email: 'nurse1@hms.com', label: 'Senior Nurse', icon: Activity, color: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border-emerald-200' },
  { role: 'Reception', email: 'receptionist@hms.com', label: 'Front Desk', icon: UserCheck, color: 'text-amber-600 bg-amber-50 hover:bg-amber-100 border-amber-200' },
];

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<{ isSeeded: boolean; userCount: number } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@hms.com',
      password: 'password123',
    },
  });

  useEffect(() => {
    // Check if the backend database is seeded
    fetchApi('/auth/seed-status')
      .then((data) => setDbStatus(data))
      .catch(() => {});
  }, []);

  const handleFillDemo = (email: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', 'password123', { shouldValidate: true });
    setServerError(null);
  };

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    setServerError(null);
    setSeedSuccess(null);
    try {
      const res = await fetchApi('/auth/seed?force=true', { method: 'POST' });
      setSeedSuccess(res.message || 'Database seeded successfully!');
      setDbStatus({ isSeeded: true, userCount: res.userCount || 10 });
      setValue('email', 'admin@hms.com');
      setValue('password', 'password123');
    } catch (err: any) {
      setServerError(err.message || 'Failed to seed database');
    } finally {
      setIsSeeding(false);
    }
  };

  const onSubmit = async (data: LoginFormValues) => {
    setServerError(null);
    try {
      const response = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: data.email.trim().toLowerCase(),
          password: data.password,
        }),
      });
      login(response.token, response.user);
      navigate('/dashboard');
    } catch (error: any) {
      setServerError(error.message || 'Failed to login');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lg">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
            <Activity size={26} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome to Apex Care</h1>
          <p className="text-sm text-muted-foreground mt-1">Hospital Management System</p>
        </div>

        {serverError && (
          <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
            <p className="font-medium">{serverError}</p>
            {serverError.toLowerCase().includes('not found') || serverError.toLowerCase().includes('invalid') ? (
              <p className="text-xs mt-1 text-destructive/80">
                Newly deployed databases start empty without demo users. Use the button below to seed data.
              </p>
            ) : null}
          </div>
        )}

        {seedSuccess && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            {seedSuccess} You can now sign in!
          </div>
        )}

        {dbStatus && !dbStatus.isSeeded && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex items-center justify-between">
            <span>Database has 0 users (fresh deployment).</span>
            <button
              type="button"
              onClick={handleSeedDatabase}
              disabled={isSeeding}
              className="font-semibold underline ml-2 hover:text-amber-900"
            >
              {isSeeding ? 'Seeding...' : 'Seed Now'}
            </button>
          </div>
        )}

        {/* Demo Quick-Fill Buttons */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Demo Accounts</span>
            <span className="text-[11px] text-muted-foreground">Password: <code className="bg-muted px-1 rounded">password123</code></span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((account) => {
              const Icon = account.icon;
              return (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => handleFillDemo(account.email)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg border transition-all text-left ${account.color}`}
                >
                  <Icon size={14} className="shrink-0" />
                  <div className="overflow-hidden">
                    <div className="font-medium truncate">{account.role}</div>
                    <div className="text-[10px] opacity-80 truncate">{account.email}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              placeholder="admin@hms.com"
              {...register('email')}
            />
            {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              placeholder="••••••••"
              {...register('password')}
            />
            {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Database size={13} />
            {dbStatus ? `${dbStatus.userCount} user(s) in database` : 'Connecting to DB...'}
          </span>
          <button
            type="button"
            onClick={handleSeedDatabase}
            disabled={isSeeding}
            className="flex items-center gap-1 hover:text-primary transition-colors text-[11px]"
            title="Seed or reset database with sample records"
          >
            <RefreshCw size={11} className={isSeeding ? 'animate-spin' : ''} />
            {isSeeding ? 'Seeding...' : 'Seed Data'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;

