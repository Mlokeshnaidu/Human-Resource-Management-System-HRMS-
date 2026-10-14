const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { generateSalarySlipPdf } = require('../src/services/pdfService');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding HRMS database with enterprise sample records...');

  // Clean existing data in order of dependencies
  await prisma.emailLog.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.leaveRequest.deleteMany({});
  await prisma.leaveBalance.deleteMany({});
  await prisma.payroll.deleteMany({});
  await prisma.employee.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Cleared existing records.');

  // Password hashes
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const hrPassword = await bcrypt.hash('Hr@123', 10);
  const empPassword = await bcrypt.hash('Employee@123', 10);
  const commonPassword = await bcrypt.hash('Welcome@123', 10);

  // 1. Create Admin User & Profile
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@hrms.com',
      password: adminPassword,
      role: 'ADMIN',
      isActive: true,
      employee: {
        create: {
          employeeCode: 'HRMS-1000',
          firstName: 'Venkata',
          lastName: 'Mandal',
          phone: '+1 555-0100',
          department: 'Executive Management',
          designation: 'Chief Technology Officer / Administrator',
          joiningDate: new Date('2023-01-15'),
          status: 'ACTIVE',
          baseSalary: 150000,
          hra: 45000,
          allowances: 15000,
          pfDeduction: 10800,
          taxDeduction: 12500,
          bankName: 'Silicon Valley Bank',
          accountNumber: '987654321011',
          ifscCode: 'SVBK0001928',
          emergencyContact: '+1 555-0999',
          address: '450 University Ave, Palo Alto, CA',
        },
      },
    },
    include: { employee: true },
  });

  // 2. Create HR User & Profile
  const hrUser = await prisma.user.create({
    data: {
      email: 'hr@hrms.com',
      password: hrPassword,
      role: 'HR',
      isActive: true,
      employee: {
        create: {
          employeeCode: 'HRMS-1001',
          firstName: 'Giri',
          lastName: '',
          phone: '+1 555-0101',
          department: 'Human Resources',
          designation: 'Senior HR Operations Lead',
          joiningDate: new Date('2023-04-01'),
          status: 'ACTIVE',
          baseSalary: 85000,
          hra: 25500,
          allowances: 8500,
          pfDeduction: 6120,
          taxDeduction: 5500,
          bankName: 'Chase Bank',
          accountNumber: '112233445566',
          ifscCode: 'CHAS0004910',
          emergencyContact: '+1 555-0111',
          address: '120 Market St, San Francisco, CA',
        },
      },
    },
    include: { employee: true },
  });

  // 3. Create Sample Employees
  const employeeData = [
    {
      email: 'employee@hrms.com',
      password: empPassword,
      role: 'EMPLOYEE',
      code: 'HRMS-1002',
      first: 'David',
      last: 'Miller',
      phone: '+1 555-0102',
      dept: 'Engineering',
      desig: 'Lead Full-Stack Software Engineer',
      joining: new Date('2023-08-10'),
      base: 95000,
      hra: 28500,
      allow: 9500,
      pf: 6840,
      tax: 7200,
      bank: 'Bank of America',
      acc: '445566778899',
      ifsc: 'BOFA0003821',
      emergency: '+1 555-0122',
      address: '742 Evergreen Terrace, Springfield, OR',
    },
    {
      email: 'sarah.chen@hrms.com',
      password: commonPassword,
      role: 'EMPLOYEE',
      code: 'HRMS-1003',
      first: 'Sarah',
      last: 'Chen',
      phone: '+1 555-0103',
      dept: 'Engineering',
      desig: 'Senior Frontend Architect',
      joining: new Date('2023-11-01'),
      base: 90000,
      hra: 27000,
      allow: 8000,
      pf: 6480,
      tax: 6800,
      bank: 'Wells Fargo',
      acc: '556677889900',
      ifsc: 'WFBI0002194',
      emergency: '+1 555-0133',
      address: '88 Tech Park Drive, San Jose, CA',
    },
    {
      email: 'alex.morgan@hrms.com',
      password: commonPassword,
      role: 'EMPLOYEE',
      code: 'HRMS-1004',
      first: 'Alex',
      last: 'Morgan',
      phone: '+1 555-0104',
      dept: 'Product & Design',
      desig: 'Principal UI/UX Designer',
      joining: new Date('2024-02-15'),
      base: 78000,
      hra: 23400,
      allow: 7000,
      pf: 5616,
      tax: 5200,
      bank: 'Citibank',
      acc: '667788990011',
      ifsc: 'CITI0009401',
      emergency: '+1 555-0144',
      address: '320 Sunset Boulevard, Los Angeles, CA',
    },
    {
      email: 'rahul.verma@hrms.com',
      password: commonPassword,
      role: 'EMPLOYEE',
      code: 'HRMS-1005',
      first: 'Rahul',
      last: 'Verma',
      phone: '+1 555-0105',
      dept: 'Finance',
      desig: 'Senior Financial Analyst',
      joining: new Date('2024-05-10'),
      base: 72000,
      hra: 21600,
      allow: 6000,
      pf: 5184,
      tax: 4800,
      bank: 'HDFC Bank',
      acc: '778899001122',
      ifsc: 'HDFC0001842',
      emergency: '+1 555-0155',
      address: '15 High Street, Austin, TX',
    },
    {
      email: 'elena.rostova@hrms.com',
      password: commonPassword,
      role: 'EMPLOYEE',
      code: 'HRMS-1006',
      first: 'Elena',
      last: 'Rostova',
      phone: '+1 555-0106',
      dept: 'Sales & Marketing',
      desig: 'Growth Marketing Lead',
      joining: new Date('2024-07-01'),
      base: 68000,
      hra: 20400,
      allow: 5500,
      pf: 4896,
      tax: 4400,
      bank: 'Chase Bank',
      acc: '889900112233',
      ifsc: 'CHAS0004910',
      emergency: '+1 555-0166',
      address: '202 Michigan Ave, Chicago, IL',
    },
  ];

  const seededEmployees = [adminUser.employee, hrUser.employee];

  for (const item of employeeData) {
    const user = await prisma.user.create({
      data: {
        email: item.email,
        password: item.password,
        role: item.role,
        isActive: true,
        employee: {
          create: {
            employeeCode: item.code,
            firstName: item.first,
            lastName: item.last,
            phone: item.phone,
            department: item.dept,
            designation: item.desig,
            joiningDate: item.joining,
            status: 'ACTIVE',
            baseSalary: item.base,
            hra: item.hra,
            allowances: item.allow,
            pfDeduction: item.pf,
            taxDeduction: item.tax,
            bankName: item.bank,
            accountNumber: item.acc,
            ifscCode: item.ifsc,
            emergencyContact: item.emergency,
            address: item.address,
          },
        },
      },
      include: { employee: true },
    });
    seededEmployees.push(user.employee);
  }

  console.log(`Created ${seededEmployees.length} employees & user credentials.`);

  // 4. Initialize Leave Balances for 2026
  const currentYear = 2026;
  for (const emp of seededEmployees) {
    await prisma.leaveBalance.createMany({
      data: [
        { employeeId: emp.id, year: currentYear, leaveType: 'CL', totalDays: 12, usedDays: 2, remainingDays: 10 },
        { employeeId: emp.id, year: currentYear, leaveType: 'SL', totalDays: 10, usedDays: 1, remainingDays: 9 },
        { employeeId: emp.id, year: currentYear, leaveType: 'PL', totalDays: 15, usedDays: 3, remainingDays: 12 },
      ],
    });
  }
  console.log('Initialized leave balances.');

  // 5. Seed Attendance records for the past 14 days
  const today = new Date();
  for (let i = 14; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // skip weekends

    const dateStr = d.toISOString().split('T')[0];

    for (const emp of seededEmployees) {
      const inHour = 9 + Math.floor(Math.random() * 2);
      const inMin = Math.floor(Math.random() * 45);
      const checkInTime = new Date(d);
      checkInTime.setHours(inHour, inMin, 0);

      // Random variation: most present, occasional half-day or absent
      const rand = Math.random();
      let status = 'PRESENT';
      let hours = 8.5;

      if (rand < 0.05) {
        status = 'HALF_DAY';
        hours = 4.2;
      } else if (rand < 0.08) {
        status = 'ON_LEAVE';
        hours = 0;
      }

      const checkOutTime = new Date(checkInTime);
      checkOutTime.setTime(checkInTime.getTime() + hours * 60 * 60 * 1000);

      await prisma.attendance.create({
        data: {
          employeeId: emp.id,
          date: dateStr,
          checkIn: status !== 'ON_LEAVE' ? checkInTime : null,
          checkOut: status !== 'ON_LEAVE' ? checkOutTime : null,
          workingHours: status !== 'ON_LEAVE' ? hours : 0,
          status,
          isOverride: i === 7, // seed 1 override example
          overrideReason: i === 7 ? 'Biometric reader network synchronization delay corrected by HR' : null,
          overriddenBy: i === 7 ? 'hr@hrms.com' : null,
        },
      });
    }
  }
  console.log('Seeded historical attendance logs.');

  // 6. Seed Leave Requests
  const empDavid = seededEmployees.find((e) => e.employeeCode === 'HRMS-1002');
  const empSarah = seededEmployees.find((e) => e.employeeCode === 'HRMS-1003');
  const empAlex = seededEmployees.find((e) => e.employeeCode === 'HRMS-1004');

  await prisma.leaveRequest.createMany({
    data: [
      {
        employeeId: empDavid.id,
        leaveType: 'PL',
        startDate: '2026-10-18',
        endDate: '2026-10-20',
        totalDays: 3,
        reason: 'Attending technical architecture summit and symposium',
        status: 'APPROVED',
        reviewedBy: 'hr@hrms.com',
        reviewedAt: new Date('2026-10-10'),
        isLossOfPay: false,
      },
      {
        employeeId: empSarah.id,
        leaveType: 'SL',
        startDate: '2026-10-14',
        endDate: '2026-10-15',
        totalDays: 2,
        reason: 'Seasonal viral infection and physician mandated bed rest',
        status: 'PENDING',
        isLossOfPay: false,
      },
      {
        employeeId: empAlex.id,
        leaveType: 'LOP',
        startDate: '2026-09-22',
        endDate: '2026-09-24',
        totalDays: 3,
        reason: 'Personal urgent family commitment exceeding paid quota',
        status: 'APPROVED',
        reviewedBy: 'admin@hrms.com',
        reviewedAt: new Date('2026-09-21'),
        isLossOfPay: true,
      },
      {
        employeeId: empDavid.id,
        leaveType: 'CL',
        startDate: '2026-08-12',
        endDate: '2026-08-13',
        totalDays: 2,
        reason: 'Personal home relocation and tenancy agreement',
        status: 'REJECTED',
        reviewedBy: 'hr@hrms.com',
        reviewedAt: new Date('2026-08-10'),
        rejectionReason: 'Critical project sprint release scheduled on deployment week',
        isLossOfPay: false,
      },
    ],
  });
  console.log('Seeded leave applications.');

  // 7. Seed Processed & Paid Payroll records for Previous Month (Month 9 - September 2026)
  let samplePayrollForPdf = null;

  for (const emp of seededEmployees) {
    const daysInMonth = 30;
    const isAlex = emp.employeeCode === 'HRMS-1004';
    const lopDays = isAlex ? 3 : 0;
    const presentDays = daysInMonth - lopDays;

    const baseSalary = emp.baseSalary;
    const hra = emp.hra;
    const allowances = emp.allowances;
    const bonus = emp.employeeCode === 'HRMS-1002' ? 5000 : 0;
    const grossSalary = baseSalary + hra + allowances + bonus;

    const perDay = baseSalary / daysInMonth;
    const lopDeduction = parseFloat((perDay * lopDays).toFixed(2));
    const pf = emp.pfDeduction;
    const tax = emp.taxDeduction;
    const totalDeductions = parseFloat((pf + tax + lopDeduction).toFixed(2));
    const netSalary = parseFloat((grossSalary - totalDeductions).toFixed(2));

    const payroll = await prisma.payroll.create({
      data: {
        employeeId: emp.id,
        month: 9,
        year: 2026,
        totalWorkingDays: daysInMonth,
        presentDays,
        paidLeaveDays: 0,
        lopDays,
        baseSalary,
        hra,
        allowances,
        bonus,
        grossSalary,
        pf,
        tax,
        lopDeduction,
        otherDeductions: 0,
        totalDeductions,
        netSalary,
        status: 'PAID',
        isLocked: true,
        lockedAt: new Date('2026-10-01'),
        paymentDate: new Date('2026-10-02'),
        paymentMethod: 'NEFT / DIRECT_BANK_TRANSFER',
        transactionReference: `TXN-HRMS-SEP26-${emp.employeeCode}`,
        remarks: 'September 2026 Regular Salary credited on schedule.',
      },
      include: { employee: { include: { user: true } } },
    });

    if (emp.employeeCode === 'HRMS-1002') {
      samplePayrollForPdf = payroll;
    }
  }

  // Also seed Draft/Processed Payroll for Month 10 (October 2026)
  for (const emp of seededEmployees) {
    const daysInMonth = 31;
    const baseSalary = emp.baseSalary;
    const hra = emp.hra;
    const allowances = emp.allowances;
    const grossSalary = baseSalary + hra + allowances;
    const pf = emp.pfDeduction;
    const tax = emp.taxDeduction;
    const totalDeductions = pf + tax;
    const netSalary = grossSalary - totalDeductions;

    await prisma.payroll.create({
      data: {
        employeeId: emp.id,
        month: 10,
        year: 2026,
        totalWorkingDays: daysInMonth,
        presentDays: 20,
        paidLeaveDays: 0,
        lopDays: 0,
        baseSalary,
        hra,
        allowances,
        bonus: 0,
        grossSalary,
        pf,
        tax,
        lopDeduction: 0,
        otherDeductions: 0,
        totalDeductions,
        netSalary,
        status: 'PROCESSED',
        isLocked: false,
        remarks: 'October 2026 Payroll in active processing.',
      },
    });
  }
  console.log('Seeded payroll records for September and October 2026.');

  // 8. Seed Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: adminUser.id,
        userEmail: adminUser.email,
        userRole: 'ADMIN',
        action: 'SYSTEM_INITIALIZATION',
        targetEntity: 'System',
        details: 'Initial system deployment, role policies established and security keys verified.',
        ipAddress: '127.0.0.1',
      },
      {
        userId: hrUser.id,
        userEmail: hrUser.email,
        userRole: 'HR',
        action: 'EMPLOYEE_ONBOARDED',
        targetEntity: 'Employee',
        targetId: empDavid.id,
        details: 'Onboarded Lead Full-Stack Software Engineer David Miller (HRMS-1002)',
        ipAddress: '192.168.1.45',
      },
      {
        userId: hrUser.id,
        userEmail: hrUser.email,
        userRole: 'HR',
        action: 'PAYROLL_LOCKED',
        targetEntity: 'Payroll',
        details: 'September 2026 payroll locked and approved for automated bank transfer.',
        ipAddress: '192.168.1.45',
      },
      {
        userId: hrUser.id,
        userEmail: hrUser.email,
        userRole: 'HR',
        action: 'PAYROLL_DISBURSED',
        targetEntity: 'Payroll',
        details: 'Simulated NEFT disbursement for all 7 active staff members.',
        ipAddress: '192.168.1.45',
      },
    ],
  });
  console.log('Seeded audit logs.');

  // 9. Seed In-App Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: adminUser.id,
        title: 'New Leave Application Pending Review',
        message: 'Sarah Chen applied for 2 days of Sick Leave (Oct 14 - Oct 15).',
        type: 'LEAVE',
      },
      {
        userId: hrUser.id,
        title: 'Monthly Attendance Cycle Ready',
        message: 'Attendance verification for October 2026 cycle is underway.',
        type: 'ATTENDANCE',
      },
      {
        userId: empDavid.userId,
        title: 'Salary Credited - September 2026',
        message: 'Your salary for September 2026 has been credited. You can download your signed salary slip.',
        type: 'PAYROLL',
      },
      {
        userId: empDavid.userId,
        title: 'Leave Application Approved',
        message: 'Your Paid Leave request from Oct 18 to Oct 20 has been approved by HR.',
        type: 'LEAVE',
      },
    ],
  });
  console.log('Seeded notifications.');

  // 10. Generate Sample Salary Slip PDF in Root Directory Deliverable!
  if (samplePayrollForPdf) {
    const pdfDeliverablePath = path.join(__dirname, '..', '..', 'sample_salary_slip.pdf');
    const writeStream = fs.createWriteStream(pdfDeliverablePath);
    await generateSalarySlipPdf(samplePayrollForPdf, writeStream);
    console.log(`Generated deliverable PDF salary slip at: ${pdfDeliverablePath}`);
  }

  console.log('Database seeding successfully finished!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
