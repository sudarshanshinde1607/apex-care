import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import Login from './pages/Login';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Patients } from './pages/Patients';
import { PatientDetail } from './pages/PatientDetail';
import { Appointments } from './pages/Appointments';
import { Consultations } from './pages/Consultations';
import { Pharmacy } from './pages/Pharmacy';
import { Laboratory } from './pages/Laboratory';
import { Billing } from './pages/Billing';
import { Wards } from './pages/Wards';
import { PatientPortal } from './pages/PatientPortal';
import { BloodBank } from './pages/BloodBank';
import { HRPayroll } from './pages/HRPayroll';
import { AmbulanceManagement } from './pages/AmbulanceManagement';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Protected layout shell */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/patients" element={<Patients />} />
              <Route path="/patients/:id" element={<PatientDetail />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/consultations" element={<Consultations />} />
              <Route path="/pharmacy" element={<Pharmacy />} />
              <Route path="/lab" element={<Laboratory />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/wards" element={<Wards />} />
              <Route path="/patient-portal" element={<PatientPortal />} />
              <Route path="/blood-bank" element={<BloodBank />} />
              <Route path="/hr-payroll" element={<HRPayroll />} />
              <Route path="/ambulance" element={<AmbulanceManagement />} />
            </Route>

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
