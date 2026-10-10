import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { getPatients, getPatient, createPatient, updatePatient } from '../controllers/patients';
import { getDoctors, getDoctor, getDepartments, createDepartment, getDoctorSchedule } from '../controllers/doctors';
import { getAppointments, createAppointment, updateAppointmentStatus, rescheduleAppointment } from '../controllers/appointments';
import { getConsultations, createConsultation, getConsultation } from '../controllers/consultations';
import { getMedicines, createMedicine, addMedicineBatch, getSuppliers, createSupplier, getLabTests, createLabTest, getLabOrders, createLabOrder, updateLabOrder, enterLabResult } from '../controllers/pharmacy-lab';
import { getInvoices, getInvoice, createInvoice, recordPayment, getDashboardStats, getWards, admitPatient, dischargePatient, getAdmissions, getAuditLogs } from '../controllers/billing';
import { getChartData } from '../controllers/analytics';
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/notifications';

const router = Router();

// Notifications
router.get('/notifications', authenticate, getNotifications);
router.patch('/notifications/:id/read', authenticate, markAsRead);
router.patch('/notifications/read-all', authenticate, markAllAsRead);

// Dashboard
router.get('/dashboard/stats', authenticate, getDashboardStats);
router.get('/dashboard/charts', authenticate, getChartData);

// Patients
router.get('/patients', authenticate, getPatients);
router.post('/patients', authenticate, authorize(['SUPER_ADMIN', 'RECEPTIONIST']), createPatient);
router.get('/patients/:id', authenticate, getPatient);
router.put('/patients/:id', authenticate, authorize(['SUPER_ADMIN', 'RECEPTIONIST', 'DOCTOR']), updatePatient);

// Doctors & Departments
router.get('/doctors', authenticate, getDoctors);
router.get('/doctors/:id', authenticate, getDoctor);
router.get('/doctors/:id/schedule', authenticate, getDoctorSchedule);
router.get('/departments', authenticate, getDepartments);
router.post('/departments', authenticate, authorize(['SUPER_ADMIN']), createDepartment);

// Appointments
router.get('/appointments', authenticate, getAppointments);
router.post('/appointments', authenticate, authorize(['SUPER_ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PATIENT']), createAppointment);
router.patch('/appointments/:id/status', authenticate, updateAppointmentStatus);
router.patch('/appointments/:id/reschedule', authenticate, rescheduleAppointment);

// Consultations / EMR
router.get('/consultations', authenticate, getConsultations);
router.post('/consultations', authenticate, authorize(['DOCTOR']), createConsultation);
router.get('/consultations/:id', authenticate, getConsultation);

// Pharmacy
router.get('/pharmacy/medicines', authenticate, getMedicines);
router.post('/pharmacy/medicines', authenticate, authorize(['SUPER_ADMIN', 'PHARMACIST']), createMedicine);
router.post('/pharmacy/batches', authenticate, authorize(['SUPER_ADMIN', 'PHARMACIST']), addMedicineBatch);
router.get('/pharmacy/suppliers', authenticate, getSuppliers);
router.post('/pharmacy/suppliers', authenticate, authorize(['SUPER_ADMIN', 'PHARMACIST']), createSupplier);

// Laboratory
router.get('/lab/tests', authenticate, getLabTests);
router.post('/lab/tests', authenticate, authorize(['SUPER_ADMIN', 'LAB_TECHNICIAN']), createLabTest);
router.get('/lab/orders', authenticate, getLabOrders);
router.post('/lab/orders', authenticate, createLabOrder);
router.patch('/lab/orders/:id/status', authenticate, authorize(['LAB_TECHNICIAN', 'SUPER_ADMIN']), updateLabOrder);
router.post('/lab/results', authenticate, authorize(['LAB_TECHNICIAN', 'SUPER_ADMIN']), enterLabResult);

// Billing & Invoicing
router.get('/billing/invoices', authenticate, getInvoices);
router.get('/billing/invoices/:id', authenticate, getInvoice);
router.post('/billing/invoices', authenticate, authorize(['SUPER_ADMIN', 'ACCOUNTANT', 'RECEPTIONIST']), createInvoice);
router.post('/billing/payments', authenticate, authorize(['SUPER_ADMIN', 'ACCOUNTANT', 'RECEPTIONIST']), recordPayment);

// Wards & Admissions
router.get('/wards', authenticate, getWards);
router.get('/admissions', authenticate, getAdmissions);
router.post('/admissions', authenticate, authorize(['SUPER_ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST']), admitPatient);
router.patch('/admissions/:id/discharge', authenticate, authorize(['SUPER_ADMIN', 'DOCTOR']), dischargePatient);

// Audit Logs
router.get('/audit-logs', authenticate, authorize(['SUPER_ADMIN']), getAuditLogs);

export default router;
