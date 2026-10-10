import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with comprehensive data...');

  // Clean existing data
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.insuranceClaim.deleteMany({});
  await prisma.insuranceProvider.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.invoiceItem.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.labResult.deleteMany({});
  await prisma.labOrder.deleteMany({});
  await prisma.labTest.deleteMany({});
  await prisma.prescriptionItem.deleteMany({});
  await prisma.prescription.deleteMany({});
  await prisma.vitals.deleteMany({});
  await prisma.consultation.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.admission.deleteMany({});
  await prisma.medicineBatch.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.medicine.deleteMany({});
  await prisma.schedule.deleteMany({});
  await prisma.bed.deleteMany({});
  await prisma.room.deleteMany({});
  await prisma.ward.deleteMany({});
  await prisma.profilePatient.deleteMany({});
  await prisma.profileDoctor.deleteMany({});
  await prisma.profileStaff.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.department.deleteMany({});

  const hashedPassword = await bcrypt.hash('password123', 10);

  // DEPARTMENTS
  console.log('Creating departments...');
  const depts = await Promise.all([
    prisma.department.create({ data: { name: 'Cardiology', description: 'Heart and cardiovascular diseases' } }),
    prisma.department.create({ data: { name: 'Neurology', description: 'Disorders of the nervous system' } }),
    prisma.department.create({ data: { name: 'Orthopedics', description: 'Bone, joint and muscle disorders' } }),
    prisma.department.create({ data: { name: 'Pediatrics', description: 'Medical care for children and infants' } }),
    prisma.department.create({ data: { name: 'Dermatology', description: 'Skin, hair and nail disorders' } }),
    prisma.department.create({ data: { name: 'Gynecology', description: "Women's reproductive health" } }),
    prisma.department.create({ data: { name: 'Emergency', description: 'Acute and emergency care' } }),
    prisma.department.create({ data: { name: 'General Medicine', description: 'General health assessment and primary care' } }),
  ]);
  const [cardioDept, neuroDept, orthoDept, pediatricsDept, dermaDept, gynoDept, emergencyDept, generalDept] = depts;

  // ADMIN & STAFF
  console.log('Creating staff...');
  await prisma.user.create({ data: { email: 'admin@hms.com', password: hashedPassword, firstName: 'Super', lastName: 'Admin', phone: '1111111111', role: 'SUPER_ADMIN' } });

  const nurseSetups = [
    { email: 'nurse1@hms.com', firstName: 'Alice', lastName: 'Williams', phone: '3333333301', empId: 'EMP-N01', deptId: cardioDept.id, designation: 'Senior Nurse' },
    { email: 'nurse2@hms.com', firstName: 'Betty', lastName: 'Carter',   phone: '3333333302', empId: 'EMP-N02', deptId: neuroDept.id,  designation: 'Staff Nurse' },
    { email: 'nurse3@hms.com', firstName: 'Carol', lastName: 'Moore',    phone: '3333333303', empId: 'EMP-N03', deptId: orthoDept.id,  designation: 'Head Nurse' },
  ];
  for (const n of nurseSetups) {
    await prisma.user.create({ data: { email: n.email, password: hashedPassword, firstName: n.firstName, lastName: n.lastName, phone: n.phone, role: 'NURSE', staff: { create: { employeeId: n.empId, departmentId: n.deptId, designation: n.designation, joiningDate: new Date('2021-06-01') } } } });
  }

  await prisma.user.create({ data: { email: 'receptionist@hms.com', password: hashedPassword, firstName: 'Bob', lastName: 'Brown', phone: '4444444444', role: 'RECEPTIONIST', staff: { create: { employeeId: 'EMP-R01', designation: 'Front Desk Officer', joiningDate: new Date('2022-01-10') } } } });
  await prisma.user.create({ data: { email: 'pharmacist@hms.com', password: hashedPassword, firstName: 'Charlie', lastName: 'Davis', phone: '5555555555', role: 'PHARMACIST', staff: { create: { employeeId: 'EMP-P01', designation: 'Chief Pharmacist', joiningDate: new Date('2020-03-15') } } } });
  await prisma.user.create({ data: { email: 'lab@hms.com', password: hashedPassword, firstName: 'Diana', lastName: 'Evans', phone: '6666666666', role: 'LAB_TECHNICIAN', staff: { create: { employeeId: 'EMP-L01', designation: 'Lab Technician', joiningDate: new Date('2021-09-01') } } } });
  await prisma.user.create({ data: { email: 'accountant@hms.com', password: hashedPassword, firstName: 'Eve', lastName: 'Foster', phone: '7777777777', role: 'ACCOUNTANT', staff: { create: { employeeId: 'EMP-A01', designation: 'Senior Accountant', joiningDate: new Date('2019-07-20') } } } });

  // DOCTORS
  console.log('Creating doctors...');
  const doctorSetups = [
    { email: 'doctor1@hms.com', firstName: 'John',    lastName: 'Doe',       phone: '2222222201', docId: 'DOC-001', dept: cardioDept.id,     spec: 'Cardiologist',       qual: 'MBBS, MD (Cardiology)', exp: 12 },
    { email: 'doctor2@hms.com', firstName: 'Jane',    lastName: 'Smith',     phone: '2222222202', docId: 'DOC-002', dept: neuroDept.id,      spec: 'Neurologist',        qual: 'MBBS, DM (Neurology)', exp: 9 },
    { email: 'doctor3@hms.com', firstName: 'Michael', lastName: 'Johnson',   phone: '2222222203', docId: 'DOC-003', dept: orthoDept.id,      spec: 'Orthopedic Surgeon', qual: 'MBBS, MS (Ortho)', exp: 15 },
    { email: 'doctor4@hms.com', firstName: 'Sarah',   lastName: 'Williams',  phone: '2222222204', docId: 'DOC-004', dept: pediatricsDept.id, spec: 'Pediatrician',       qual: 'MBBS, MD (Pediatrics)', exp: 7 },
    { email: 'doctor5@hms.com', firstName: 'Robert',  lastName: 'Brown',     phone: '2222222205', docId: 'DOC-005', dept: dermaDept.id,      spec: 'Dermatologist',      qual: 'MBBS, MD (Dermatology)', exp: 10 },
    { email: 'doctor6@hms.com', firstName: 'Emily',   lastName: 'Davis',     phone: '2222222206', docId: 'DOC-006', dept: gynoDept.id,       spec: 'Gynecologist',       qual: 'MBBS, MS (OBG)', exp: 11 },
    { email: 'doctor7@hms.com', firstName: 'David',   lastName: 'Wilson',    phone: '2222222207', docId: 'DOC-007', dept: emergencyDept.id,  spec: 'Emergency Medicine', qual: 'MBBS, MD (Emergency)', exp: 8 },
    { email: 'doctor8@hms.com', firstName: 'Linda',   lastName: 'Martinez',  phone: '2222222208', docId: 'DOC-008', dept: generalDept.id,    spec: 'General Physician',  qual: 'MBBS, MD', exp: 14 },
  ];

  const doctors: any[] = [];
  for (const d of doctorSetups) {
    const u = await prisma.user.create({ data: { email: d.email, password: hashedPassword, firstName: d.firstName, lastName: d.lastName, phone: d.phone, role: 'DOCTOR', doctor: { create: { doctorId: d.docId, departmentId: d.dept, specialization: d.spec, qualifications: d.qual, experienceYears: d.exp } } }, include: { doctor: true } });
    doctors.push(u.doctor);
  }

  // SCHEDULES
  for (const doc of doctors) {
    for (const day of [1, 3, 5]) await prisma.schedule.create({ data: { doctorId: doc!.id, dayOfWeek: day, startTime: '09:00', endTime: '13:00', slotDuration: 20 } });
    for (const day of [2, 4])    await prisma.schedule.create({ data: { doctorId: doc!.id, dayOfWeek: day, startTime: '14:00', endTime: '18:00', slotDuration: 20 } });
  }

  // WARDS, ROOMS, BEDS
  console.log('Creating wards and beds...');
  const wardSetups = [
    { name: 'General Ward A',  dept: cardioDept.id,     rooms: [{ no: '101', type: 'General',  beds: ['101-A','101-B','101-C','101-D'] }, { no: '102', type: 'General', beds: ['102-A','102-B'] }] },
    { name: 'General Ward B',  dept: neuroDept.id,      rooms: [{ no: '201', type: 'General',  beds: ['201-A','201-B','201-C'] }, { no: '202', type: 'General', beds: ['202-A','202-B'] }] },
    { name: 'ICU',             dept: emergencyDept.id,  rooms: [{ no: '001', type: 'ICU',      beds: ['ICU-1','ICU-2','ICU-3','ICU-4'] }] },
    { name: 'Private Ward',    dept: generalDept.id,    rooms: [{ no: '301', type: 'Private',  beds: ['P301-A'] }, { no: '302', type: 'Private', beds: ['P302-A'] }, { no: '303', type: 'Private', beds: ['P303-A'] }] },
    { name: 'Pediatric Ward',  dept: pediatricsDept.id, rooms: [{ no: '401', type: 'General',  beds: ['401-A','401-B','401-C'] }] },
    { name: 'Maternity Ward',  dept: gynoDept.id,       rooms: [{ no: '501', type: 'Private',  beds: ['501-A','501-B'] }, { no: '502', type: 'General', beds: ['502-A','502-B','502-C'] }] },
  ];
  const allBeds: any[] = [];
  for (const ws of wardSetups) {
    const ward = await prisma.ward.create({ data: { name: ws.name, departmentId: ws.dept, rooms: { create: ws.rooms.map(r => ({ roomNo: r.no, type: r.type, beds: { create: r.beds.map(b => ({ bedNo: b })) } })) } }, include: { rooms: { include: { beds: true } } } });
    for (const room of ward.rooms) for (const bed of room.beds) allBeds.push(bed);
  }

  // MEDICINES
  console.log('Creating medicines...');
  const medicineSetups = [
    { name: 'Paracetamol 500mg',           genericName: 'Acetaminophen',        category: 'Analgesic',        manufacturer: 'PharmaCo',    unitPrice: 5.0 },
    { name: 'Amoxicillin 250mg',           genericName: 'Amoxicillin',          category: 'Antibiotic',       manufacturer: 'MediCorp',    unitPrice: 12.0 },
    { name: 'Metformin 500mg',             genericName: 'Metformin HCl',        category: 'Antidiabetic',     manufacturer: 'HealthGen',   unitPrice: 8.0 },
    { name: 'Atorvastatin 10mg',           genericName: 'Atorvastatin',         category: 'Statin',           manufacturer: 'CardioPharm', unitPrice: 25.0 },
    { name: 'Amlodipine 5mg',             genericName: 'Amlodipine Besylate',  category: 'Antihypertensive', manufacturer: 'CardioPharm', unitPrice: 18.0 },
    { name: 'Omeprazole 20mg',            genericName: 'Omeprazole',           category: 'Antacid',          manufacturer: 'GastroMed',   unitPrice: 10.0 },
    { name: 'Cetirizine 10mg',            genericName: 'Cetirizine HCl',       category: 'Antihistamine',    manufacturer: 'AllergyFree', unitPrice: 6.0 },
    { name: 'Azithromycin 500mg',         genericName: 'Azithromycin',         category: 'Antibiotic',       manufacturer: 'MediCorp',    unitPrice: 35.0 },
    { name: 'Ibuprofen 400mg',            genericName: 'Ibuprofen',            category: 'NSAID',            manufacturer: 'PharmaCo',    unitPrice: 7.0 },
    { name: 'Pantoprazole 40mg',          genericName: 'Pantoprazole',         category: 'PPI',              manufacturer: 'GastroMed',   unitPrice: 14.0 },
    { name: 'Salbutamol 100mcg Inhaler',  genericName: 'Salbutamol',           category: 'Bronchodilator',   manufacturer: 'RespiPharm',  unitPrice: 85.0 },
    { name: 'Aspirin 75mg',              genericName: 'Acetylsalicylic Acid', category: 'Antiplatelet',     manufacturer: 'CardioPharm', unitPrice: 4.0 },
  ];
  const medicines: any[] = [];
  for (const m of medicineSetups) medicines.push(await prisma.medicine.create({ data: m }));

  // SUPPLIERS & BATCHES
  console.log('Creating suppliers and batches...');
  const suppliers = await Promise.all([
    prisma.supplier.create({ data: { name: 'MediSupply India Pvt. Ltd.', contact: '9800001111', address: 'Andheri East, Mumbai' } }),
    prisma.supplier.create({ data: { name: 'HealthDist Corp',            contact: '9800002222', address: 'Sector 18, Noida' } }),
    prisma.supplier.create({ data: { name: 'PharmaLink Solutions',       contact: '9800003333', address: 'Koramangala, Bangalore' } }),
  ]);
  for (let i = 0; i < medicines.length; i++) {
    await prisma.medicineBatch.create({ data: { medicineId: medicines[i].id, supplierId: suppliers[i % 3].id, batchNo: `BATCH-${i+1}-2024`, manufactureDate: new Date('2024-01-01'), expiryDate: new Date('2026-12-31'), quantity: 200 + i * 50 } });
  }

  // LAB TESTS
  console.log('Creating lab tests...');
  const labTestSetups = [
    { name: 'Complete Blood Count (CBC)',        description: 'Checks for anemia, infection, and other diseases', price: 350 },
    { name: 'Blood Glucose (Fasting)',           description: 'Measures blood sugar after overnight fast',        price: 120 },
    { name: 'Lipid Profile',                    description: 'Cholesterol and triglycerides panel',              price: 450 },
    { name: 'Liver Function Test (LFT)',        description: 'Assesses liver health',                           price: 500 },
    { name: 'Kidney Function Test (KFT)',       description: 'Evaluates kidney function',                       price: 480 },
    { name: 'Thyroid Function Test (TSH)',      description: 'Measures thyroid stimulating hormone',            price: 350 },
    { name: 'HbA1c',                            description: 'Average blood glucose over 3 months',            price: 400 },
    { name: 'Urine Routine & Microscopy',       description: 'Comprehensive urine analysis',                   price: 150 },
    { name: 'ECG (Electrocardiogram)',          description: 'Heart electrical activity test',                  price: 300 },
    { name: 'Chest X-Ray',                     description: 'Radiographic image of chest',                    price: 600 },
    { name: 'MRI Brain',                       description: 'Detailed MRI scan of the brain',                 price: 5500 },
    { name: 'Serum Electrolytes',              description: 'Sodium, Potassium, Chloride levels',             price: 280 },
  ];
  const labTests: any[] = [];
  for (const lt of labTestSetups) labTests.push(await prisma.labTest.create({ data: lt }));

  // INSURANCE PROVIDERS
  const insurers = await Promise.all([
    prisma.insuranceProvider.create({ data: { name: 'Star Health Insurance',    contactInfo: '1800-425-2255' } }),
    prisma.insuranceProvider.create({ data: { name: 'HDFC ERGO Health',         contactInfo: '1800-2-700-700' } }),
    prisma.insuranceProvider.create({ data: { name: 'Niva Bupa Health',         contactInfo: '1860-500-8888' } }),
    prisma.insuranceProvider.create({ data: { name: 'Aditya Birla Health',      contactInfo: '1800-270-7000' } }),
  ]);

  // PATIENTS (20)
  console.log('Creating 20 patients...');
  const patientSetups = [
    { email: 'patient1@hms.com',  firstName: 'Ravi',    lastName: 'Kumar',      phone: '9100000001', patId: 'PAT-0001', dob: '1985-03-12', gender: 'Male',   blood: 'O+',  address: '12 MG Road, Bangalore',          emergency: '9100000002', allergies: 'Penicillin' },
    { email: 'patient2@hms.com',  firstName: 'Priya',   lastName: 'Sharma',     phone: '9100000003', patId: 'PAT-0002', dob: '1990-07-24', gender: 'Female', blood: 'B+',  address: '45 Park Street, Kolkata',        emergency: '9100000004', allergies: null },
    { email: 'patient3@hms.com',  firstName: 'Arjun',   lastName: 'Patel',      phone: '9100000005', patId: 'PAT-0003', dob: '1978-11-05', gender: 'Male',   blood: 'A+',  address: '78 SV Road, Mumbai',             emergency: '9100000006', allergies: 'Sulfa drugs' },
    { email: 'patient4@hms.com',  firstName: 'Sunita',  lastName: 'Reddy',      phone: '9100000007', patId: 'PAT-0004', dob: '1965-02-18', gender: 'Female', blood: 'AB+', address: '23 Jubilee Hills, Hyderabad',    emergency: '9100000008', allergies: null },
    { email: 'patient5@hms.com',  firstName: 'Mohan',   lastName: 'Singh',      phone: '9100000009', patId: 'PAT-0005', dob: '1955-09-30', gender: 'Male',   blood: 'O-',  address: '56 Civil Lines, Delhi',          emergency: '9100000010', allergies: 'Aspirin' },
    { email: 'patient6@hms.com',  firstName: 'Ananya',  lastName: 'Gupta',      phone: '9100000011', patId: 'PAT-0006', dob: '1999-04-15', gender: 'Female', blood: 'B-',  address: '34 Race Course Road, Indore',    emergency: '9100000012', allergies: null },
    { email: 'patient7@hms.com',  firstName: 'Vikram',  lastName: 'Joshi',      phone: '9100000013', patId: 'PAT-0007', dob: '1982-12-22', gender: 'Male',   blood: 'A-',  address: '67 FC Road, Pune',               emergency: '9100000014', allergies: null },
    { email: 'patient8@hms.com',  firstName: 'Kavitha', lastName: 'Nair',       phone: '9100000015', patId: 'PAT-0008', dob: '1975-06-08', gender: 'Female', blood: 'O+',  address: '89 MG Road, Kochi',              emergency: '9100000016', allergies: 'Ibuprofen' },
    { email: 'patient9@hms.com',  firstName: 'Suresh',  lastName: 'Menon',      phone: '9100000017', patId: 'PAT-0009', dob: '1960-01-14', gender: 'Male',   blood: 'B+',  address: '12 Anna Salai, Chennai',         emergency: '9100000018', allergies: null },
    { email: 'patient10@hms.com', firstName: 'Deepa',   lastName: 'Iyer',       phone: '9100000019', patId: 'PAT-0010', dob: '1993-08-27', gender: 'Female', blood: 'A+',  address: '45 Nungambakkam, Chennai',       emergency: '9100000020', allergies: null },
    { email: 'patient11@hms.com', firstName: 'Rahul',   lastName: 'Verma',      phone: '9100000021', patId: 'PAT-0011', dob: '1988-05-03', gender: 'Male',   blood: 'AB-', address: '23 Hazratganj, Lucknow',         emergency: '9100000022', allergies: 'Latex' },
    { email: 'patient12@hms.com', firstName: 'Meera',   lastName: 'Bose',       phone: '9100000023', patId: 'PAT-0012', dob: '1971-10-19', gender: 'Female', blood: 'O+',  address: '56 Salt Lake, Kolkata',          emergency: '9100000024', allergies: null },
    { email: 'patient13@hms.com', firstName: 'Aditya',  lastName: 'Kapoor',     phone: '9100000025', patId: 'PAT-0013', dob: '2001-02-28', gender: 'Male',   blood: 'B+',  address: '78 Connaught Place, Delhi',      emergency: '9100000026', allergies: null },
    { email: 'patient14@hms.com', firstName: 'Lakshmi', lastName: 'Pillai',     phone: '9100000027', patId: 'PAT-0014', dob: '1969-07-11', gender: 'Female', blood: 'A+',  address: '34 MG Marg, Thiruvananthapuram', emergency: '9100000028', allergies: 'Codeine' },
    { email: 'patient15@hms.com', firstName: 'Rajesh',  lastName: 'Tiwari',     phone: '9100000029', patId: 'PAT-0015', dob: '1953-04-06', gender: 'Male',   blood: 'O+',  address: '12 Mahatma Nagar, Nashik',       emergency: '9100000030', allergies: null },
    { email: 'patient16@hms.com', firstName: 'Nisha',   lastName: 'Choudhary',  phone: '9100000031', patId: 'PAT-0016', dob: '1995-11-23', gender: 'Female', blood: 'AB+', address: '45 Banjara Hills, Hyderabad',    emergency: '9100000032', allergies: null },
    { email: 'patient17@hms.com', firstName: 'Kartik',  lastName: 'Agarwal',    phone: '9100000033', patId: 'PAT-0017', dob: '1980-09-14', gender: 'Male',   blood: 'B-',  address: '67 Satellite, Ahmedabad',        emergency: '9100000034', allergies: 'Aspirin' },
    { email: 'patient18@hms.com', firstName: 'Shalini', lastName: 'Saxena',     phone: '9100000035', patId: 'PAT-0018', dob: '1973-03-29', gender: 'Female', blood: 'O-',  address: '89 Gomti Nagar, Lucknow',        emergency: '9100000036', allergies: null },
    { email: 'patient19@hms.com', firstName: 'Nikhil',  lastName: 'Desai',      phone: '9100000037', patId: 'PAT-0019', dob: '1991-12-07', gender: 'Male',   blood: 'A-',  address: '23 Koregaon Park, Pune',         emergency: '9100000038', allergies: null },
    { email: 'patient20@hms.com', firstName: 'Pooja',   lastName: 'Mishra',     phone: '9100000039', patId: 'PAT-0020', dob: '1987-06-18', gender: 'Female', blood: 'B+',  address: '56 Vaishali Nagar, Jaipur',      emergency: '9100000040', allergies: 'Morphine' },
  ];

  const patients: any[] = [];
  for (const p of patientSetups) {
    const u = await prisma.user.create({ data: { email: p.email, password: hashedPassword, firstName: p.firstName, lastName: p.lastName, phone: p.phone, role: 'PATIENT', patient: { create: { patientId: p.patId, dob: new Date(p.dob), gender: p.gender, bloodGroup: p.blood, address: p.address, emergencyContact: p.emergency, allergies: p.allergies } } }, include: { patient: true } });
    patients.push(u.patient);
  }

  // APPOINTMENTS & CONSULTATIONS (40)
  console.log('Creating appointments and consultations...');
  const diagnosisList = [
    { symptoms: 'Chest pain, shortness of breath',        diagnosis: 'Unstable Angina',                     notes: 'Referred for cardiac catheterization. Low-sodium diet advised.' },
    { symptoms: 'Persistent headache, blurred vision',    diagnosis: 'Hypertensive Urgency',                notes: 'BP controlled. Monitor daily. Follow up in 1 week.' },
    { symptoms: 'Knee pain, difficulty walking',           diagnosis: 'Osteoarthritis - Right Knee',         notes: 'Physiotherapy advised. NSAID prescribed for 7 days.' },
    { symptoms: 'Fever, sore throat, body aches',         diagnosis: 'Viral URTI',                          notes: 'Symptomatic treatment. Rest for 5 days.' },
    { symptoms: 'Skin rash, itching on arms',             diagnosis: 'Allergic Contact Dermatitis',         notes: 'Topical steroid prescribed. Avoid allergen.' },
    { symptoms: 'Irregular periods, pelvic pain',         diagnosis: 'PCOS',                               notes: 'Lifestyle modification. Hormonal therapy initiated.' },
    { symptoms: 'Cough, wheezing',                        diagnosis: 'Bronchial Asthma',                   notes: 'Inhaler prescribed. Peak flow monitoring.' },
    { symptoms: 'Dizziness, nausea, tinnitus',            diagnosis: 'BPPV',                               notes: 'Epley maneuver performed. Vestibular exercises.' },
    { symptoms: 'Fatigue, increased thirst, urination',   diagnosis: 'Type 2 Diabetes Mellitus',           notes: 'Metformin initiated. Dietary counseling done.' },
    { symptoms: 'Lower back pain radiating to leg',       diagnosis: 'Lumbar Disc Herniation',             notes: 'MRI ordered. Analgesics and muscle relaxants.' },
  ];

  const today = new Date();
  let invoiceCounter = 1;
  const createdAppointments: any[] = [];

  for (let i = 0; i < 40; i++) {
    const patient = patients[i % patients.length];
    const doctor = doctors[i % doctors.length];
    const daysOffset = Math.floor(Math.random() * 60) - 30;
    const apptDate = new Date(today);
    apptDate.setDate(today.getDate() + daysOffset);

    const status = daysOffset < 0
      ? ['COMPLETED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'][Math.floor(Math.random() * 4)]
      : ['SCHEDULED', 'SCHEDULED', 'CHECKED_IN'][Math.floor(Math.random() * 3)];

    const diag = diagnosisList[i % diagnosisList.length];
    const appt = await prisma.appointment.create({ data: { patientId: patient.id, doctorId: doctor.id, appointmentDate: apptDate, status, reason: diag.symptoms } });
    createdAppointments.push(appt);

    if (status === 'COMPLETED') {
      await prisma.consultation.create({
        data: {
          appointmentId: appt.id, patientId: patient.id, doctorId: doctor.id,
          symptoms: diag.symptoms, diagnosis: diag.diagnosis, notes: diag.notes,
          followUpDate: new Date(apptDate.getTime() + 14 * 86400000),
          vitals: { create: { bloodPressure: `${110 + (i % 40)}/${70 + (i % 20)}`, pulse: 65 + (i % 35), temperature: 36.5 + (i % 10) * 0.2, spO2: 95 + (i % 5) * 0.4, weight: 60 + (i % 40), height: 160 + (i % 30) } },
          prescription: { create: { instructions: 'Take medicines after food. Complete the full course.', items: { create: [{ medicineId: medicines[i % medicines.length].id, dosage: '1-0-1', duration: 7, instructions: 'After meals' }, { medicineId: medicines[(i + 2) % medicines.length].id, dosage: '0-0-1', duration: 5, instructions: 'Before bedtime' }] } } },
        }
      });

      if (i % 3 === 0) {
        const lo = await prisma.labOrder.create({ data: { patientId: patient.id, testId: labTests[i % labTests.length].id, orderDate: apptDate, status: 'COMPLETED' } });
        await prisma.labResult.create({ data: { orderId: lo.id, resultData: JSON.stringify({ value: `${80 + (i * 7) % 120} mg/dL`, normalRange: '70-110 mg/dL', interpretation: i % 5 === 0 ? 'Abnormal - High' : 'Normal' }), enteredDate: new Date(apptDate.getTime() + 86400000) } });
      }

      const fee = 500 + (i * 100) % 2000;
      const labFee = i % 3 === 0 ? labTests[i % labTests.length].price : 0;
      const total = fee + labFee;
      const tax = total * 0.05;
      const net = +(total + tax).toFixed(2);
      const paid = Math.random() > 0.35;
      const inv = await prisma.invoice.create({
        data: {
          invoiceNo: `INV-${String(invoiceCounter++).padStart(4, '0')}`,
          patientId: patient.id, totalAmount: total, taxAmount: +tax.toFixed(2), discount: 0, netAmount: net,
          status: paid ? 'PAID' : 'UNPAID', issueDate: apptDate, dueDate: new Date(apptDate.getTime() + 30 * 86400000),
          items: { create: [{ description: 'Consultation Fee', quantity: 1, unitPrice: fee, total: fee }, ...(labFee > 0 ? [{ description: labTests[i % labTests.length].name, quantity: 1, unitPrice: labFee, total: labFee }] : [])] },
        }
      });
      if (paid) await prisma.payment.create({ data: { invoiceId: inv.id, amount: net, paymentMethod: ['CASH','CARD','UPI','BANK_TRANSFER'][i % 4], paymentDate: apptDate } });
    }
  }

  // ADMISSIONS
  console.log('Creating admissions...');
  for (let i = 0; i < 6; i++) {
    const admDate = new Date(today); admDate.setDate(today.getDate() - i - 1);
    await prisma.admission.create({ data: { patientId: patients[i].id, doctorId: doctors[i % doctors.length].id, bedId: allBeds[i].id, admissionDate: admDate, reason: diagnosisList[i % diagnosisList.length].diagnosis, status: 'ADMITTED' } });
    await prisma.bed.update({ where: { id: allBeds[i].id }, data: { status: 'OCCUPIED' } });
  }
  for (let i = 6; i < 10; i++) {
    const admDate = new Date(today); admDate.setDate(today.getDate() - 20);
    const disDate = new Date(today); disDate.setDate(today.getDate() - (20 - i));
    await prisma.admission.create({ data: { patientId: patients[i].id, doctorId: doctors[i % doctors.length].id, bedId: allBeds[i].id, admissionDate: admDate, dischargeDate: disDate, reason: diagnosisList[i % diagnosisList.length].diagnosis, status: 'DISCHARGED', dischargeSummary: 'Patient recovered well. Discharged with oral medications and follow-up in 2 weeks.' } });
  }

  // INSURANCE CLAIMS
  console.log('Creating insurance claims...');
  for (let i = 0; i < 8; i++) {
    await prisma.insuranceClaim.create({ data: { patientId: patients[i].id, providerId: insurers[i % insurers.length].id, claimAmount: 5000 + i * 8000, status: ['SUBMITTED','APPROVED','SETTLED','REJECTED'][i % 4], submissionDate: new Date(today.getTime() - i * 5 * 86400000) } });
  }

  // NOTIFICATIONS
  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@hms.com' } });
  if (adminUser) {
    await prisma.notification.createMany({ data: [
      { userId: adminUser.id, title: 'New Patient Registered',  message: 'Patient PAT-0020 (Pooja Mishra) has been registered.', isRead: false },
      { userId: adminUser.id, title: 'Low Stock Alert',         message: 'Azithromycin 500mg stock is running low.', isRead: false },
      { userId: adminUser.id, title: 'Invoice Overdue',         message: 'Invoice INV-0003 is overdue by 5 days.', isRead: true },
      { userId: adminUser.id, title: 'Lab Result Ready',        message: 'CBC result for patient Ravi Kumar is ready for review.', isRead: true },
    ]});
    await prisma.auditLog.createMany({ data: [
      { userId: adminUser.id, action: 'LOGIN',             entity: 'User',         details: '{"ip":"192.168.1.1"}' },
      { userId: adminUser.id, action: 'CREATE_PATIENT',    entity: 'Patient',      entityId: patients[0].id },
      { userId: adminUser.id, action: 'CREATE_INVOICE',    entity: 'Invoice',      details: '{"invoiceNo":"INV-0001"}' },
      { userId: adminUser.id, action: 'UPDATE_APPOINTMENT',entity: 'Appointment',  entityId: createdAppointments[0]?.id },
    ]});
  }

  console.log('\n✅ Seeding complete!');
  console.log(`   → ${depts.length} Departments`);
  console.log(`   → ${doctors.length} Doctors`);
  console.log(`   → 3 Nurses + 4 other staff`);
  console.log(`   → ${patients.length} Patients`);
  console.log(`   → ${medicines.length} Medicines + ${suppliers.length} Suppliers`);
  console.log(`   → ${labTests.length} Lab Tests`);
  console.log(`   → 40 Appointments (with consultations, prescriptions, lab orders)`);
  console.log(`   → 6 Active Admissions + 4 Discharged`);
  console.log(`   → Multiple Invoices, Payments & Insurance Claims`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

