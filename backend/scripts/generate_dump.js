const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function generateDump() {
  console.log('Generating database schema and SQL dump files...');

  const databaseDir = path.join(__dirname, '..', '..', 'database');
  if (!fs.existsSync(databaseDir)) {
    fs.mkdirSync(databaseDir, { recursive: true });
  }

  // 1. DDL Schema
  const schemaSql = `-- =====================================================================
-- Human Resource Management System (HRMS) Database Schema
-- Dialect: SQLite / ANSI SQL Standard
-- Generated: ${new Date().toISOString()}
-- =====================================================================

CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'EMPLOYEE',
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "Employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeCode" TEXT NOT NULL UNIQUE,
    "userId" TEXT NOT NULL UNIQUE,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "department" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "joiningDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "baseSalary" REAL NOT NULL DEFAULT 50000,
    "hra" REAL NOT NULL DEFAULT 15000,
    "allowances" REAL NOT NULL DEFAULT 5000,
    "pfDeduction" REAL NOT NULL DEFAULT 3600,
    "taxDeduction" REAL NOT NULL DEFAULT 2500,
    "bankName" TEXT,
    "accountNumber" TEXT,
    "ifscCode" TEXT,
    "emergencyContact" TEXT,
    "address" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Attendance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "checkIn" DATETIME,
    "checkOut" DATETIME,
    "workingHours" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PRESENT',
    "isOverride" INTEGER NOT NULL DEFAULT 0,
    "overrideReason" TEXT,
    "overriddenBy" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Attendance_employeeId_date_key" ON "Attendance"("employeeId", "date");

CREATE TABLE IF NOT EXISTS "LeaveBalance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "leaveType" TEXT NOT NULL,
    "totalDays" REAL NOT NULL,
    "usedDays" REAL NOT NULL DEFAULT 0,
    "remainingDays" REAL NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "LeaveBalance_employeeId_year_leaveType_key" ON "LeaveBalance"("employeeId", "year", "leaveType");

CREATE TABLE IF NOT EXISTS "LeaveRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "leaveType" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "totalDays" REAL NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    "rejectionReason" TEXT,
    "isLossOfPay" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Payroll" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "totalWorkingDays" INTEGER NOT NULL DEFAULT 30,
    "presentDays" REAL NOT NULL DEFAULT 30,
    "paidLeaveDays" REAL NOT NULL DEFAULT 0,
    "lopDays" REAL NOT NULL DEFAULT 0,
    "baseSalary" REAL NOT NULL,
    "hra" REAL NOT NULL,
    "allowances" REAL NOT NULL,
    "bonus" REAL NOT NULL DEFAULT 0,
    "grossSalary" REAL NOT NULL,
    "pf" REAL NOT NULL,
    "tax" REAL NOT NULL,
    "lopDeduction" REAL NOT NULL DEFAULT 0,
    "otherDeductions" REAL NOT NULL DEFAULT 0,
    "totalDeductions" REAL NOT NULL,
    "netSalary" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "isLocked" INTEGER NOT NULL DEFAULT 0,
    "lockedAt" DATETIME,
    "paymentDate" DATETIME,
    "paymentMethod" TEXT DEFAULT 'BANK_TRANSFER',
    "transactionReference" TEXT,
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Payroll_employeeId_month_year_key" ON "Payroll"("employeeId", "month", "year");

CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isRead" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "userEmail" TEXT,
    "userRole" TEXT,
    "action" TEXT NOT NULL,
    "targetEntity" TEXT NOT NULL,
    "targetId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "EmailLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "payload" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`;

  fs.writeFileSync(path.join(databaseDir, 'schema.sql'), schemaSql);
  console.log('Wrote database/schema.sql');

  // 2. Full SQL Data Dump
  const users = await prisma.user.findMany();
  const employees = await prisma.employee.findMany();
  const balances = await prisma.leaveBalance.findMany();
  const attendances = await prisma.attendance.findMany();
  const leaves = await prisma.leaveRequest.findMany();
  const payrolls = await prisma.payroll.findMany();
  const audits = await prisma.auditLog.findMany();
  const notifications = await prisma.notification.findMany();

  function escapeSql(val) {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'number') return val;
    if (typeof val === 'boolean') return val ? 1 : 0;
    if (val instanceof Date) return `'${val.toISOString()}'`;
    return `'${String(val).replace(/'/g, "''")}'`;
  }

  let dumpSql = schemaSql + '\n-- =====================================================================\n-- DUMP DATA INSERTS\n-- =====================================================================\n\n';

  users.forEach((u) => {
    dumpSql += `INSERT INTO "User" ("id", "email", "password", "role", "isActive", "createdAt", "updatedAt") VALUES (${escapeSql(u.id)}, ${escapeSql(u.email)}, ${escapeSql(u.password)}, ${escapeSql(u.role)}, ${escapeSql(u.isActive)}, ${escapeSql(u.createdAt)}, ${escapeSql(u.updatedAt)});\n`;
  });

  employees.forEach((e) => {
    dumpSql += `INSERT INTO "Employee" ("id", "employeeCode", "userId", "firstName", "lastName", "phone", "department", "designation", "joiningDate", "status", "baseSalary", "hra", "allowances", "pfDeduction", "taxDeduction", "bankName", "accountNumber", "ifscCode", "emergencyContact", "address", "createdAt", "updatedAt") VALUES (${escapeSql(e.id)}, ${escapeSql(e.employeeCode)}, ${escapeSql(e.userId)}, ${escapeSql(e.firstName)}, ${escapeSql(e.lastName)}, ${escapeSql(e.phone)}, ${escapeSql(e.department)}, ${escapeSql(e.designation)}, ${escapeSql(e.joiningDate)}, ${escapeSql(e.status)}, ${escapeSql(e.baseSalary)}, ${escapeSql(e.hra)}, ${escapeSql(e.allowances)}, ${escapeSql(e.pfDeduction)}, ${escapeSql(e.taxDeduction)}, ${escapeSql(e.bankName)}, ${escapeSql(e.accountNumber)}, ${escapeSql(e.ifscCode)}, ${escapeSql(e.emergencyContact)}, ${escapeSql(e.address)}, ${escapeSql(e.createdAt)}, ${escapeSql(e.updatedAt)});\n`;
  });

  balances.forEach((b) => {
    dumpSql += `INSERT INTO "LeaveBalance" ("id", "employeeId", "year", "leaveType", "totalDays", "usedDays", "remainingDays", "updatedAt") VALUES (${escapeSql(b.id)}, ${escapeSql(b.employeeId)}, ${escapeSql(b.year)}, ${escapeSql(b.leaveType)}, ${escapeSql(b.totalDays)}, ${escapeSql(b.usedDays)}, ${escapeSql(b.remainingDays)}, ${escapeSql(b.updatedAt)});\n`;
  });

  attendances.forEach((a) => {
    dumpSql += `INSERT INTO "Attendance" ("id", "employeeId", "date", "checkIn", "checkOut", "workingHours", "status", "isOverride", "overrideReason", "overriddenBy", "notes", "createdAt", "updatedAt") VALUES (${escapeSql(a.id)}, ${escapeSql(a.employeeId)}, ${escapeSql(a.date)}, ${escapeSql(a.checkIn)}, ${escapeSql(a.checkOut)}, ${escapeSql(a.workingHours)}, ${escapeSql(a.status)}, ${escapeSql(a.isOverride)}, ${escapeSql(a.overrideReason)}, ${escapeSql(a.overriddenBy)}, ${escapeSql(a.notes)}, ${escapeSql(a.createdAt)}, ${escapeSql(a.updatedAt)});\n`;
  });

  leaves.forEach((l) => {
    dumpSql += `INSERT INTO "LeaveRequest" ("id", "employeeId", "leaveType", "startDate", "endDate", "totalDays", "reason", "status", "reviewedBy", "reviewedAt", "rejectionReason", "isLossOfPay", "createdAt", "updatedAt") VALUES (${escapeSql(l.id)}, ${escapeSql(l.employeeId)}, ${escapeSql(l.leaveType)}, ${escapeSql(l.startDate)}, ${escapeSql(l.endDate)}, ${escapeSql(l.totalDays)}, ${escapeSql(l.reason)}, ${escapeSql(l.status)}, ${escapeSql(l.reviewedBy)}, ${escapeSql(l.reviewedAt)}, ${escapeSql(l.rejectionReason)}, ${escapeSql(l.isLossOfPay)}, ${escapeSql(l.createdAt)}, ${escapeSql(l.updatedAt)});\n`;
  });

  payrolls.forEach((p) => {
    dumpSql += `INSERT INTO "Payroll" ("id", "employeeId", "month", "year", "totalWorkingDays", "presentDays", "paidLeaveDays", "lopDays", "baseSalary", "hra", "allowances", "bonus", "grossSalary", "pf", "tax", "lopDeduction", "otherDeductions", "totalDeductions", "netSalary", "status", "isLocked", "lockedAt", "paymentDate", "paymentMethod", "transactionReference", "remarks", "createdAt", "updatedAt") VALUES (${escapeSql(p.id)}, ${escapeSql(p.employeeId)}, ${escapeSql(p.month)}, ${escapeSql(p.year)}, ${escapeSql(p.totalWorkingDays)}, ${escapeSql(p.presentDays)}, ${escapeSql(p.paidLeaveDays)}, ${escapeSql(p.lopDays)}, ${escapeSql(p.baseSalary)}, ${escapeSql(p.hra)}, ${escapeSql(p.allowances)}, ${escapeSql(p.bonus)}, ${escapeSql(p.grossSalary)}, ${escapeSql(p.pf)}, ${escapeSql(p.tax)}, ${escapeSql(p.lopDeduction)}, ${escapeSql(p.otherDeductions)}, ${escapeSql(p.totalDeductions)}, ${escapeSql(p.netSalary)}, ${escapeSql(p.status)}, ${escapeSql(p.isLocked)}, ${escapeSql(p.lockedAt)}, ${escapeSql(p.paymentDate)}, ${escapeSql(p.paymentMethod)}, ${escapeSql(p.transactionReference)}, ${escapeSql(p.remarks)}, ${escapeSql(p.createdAt)}, ${escapeSql(p.updatedAt)});\n`;
  });

  audits.forEach((au) => {
    dumpSql += `INSERT INTO "AuditLog" ("id", "userId", "userEmail", "userRole", "action", "targetEntity", "targetId", "details", "ipAddress", "createdAt") VALUES (${escapeSql(au.id)}, ${escapeSql(au.userId)}, ${escapeSql(au.userEmail)}, ${escapeSql(au.userRole)}, ${escapeSql(au.action)}, ${escapeSql(au.targetEntity)}, ${escapeSql(au.targetId)}, ${escapeSql(au.details)}, ${escapeSql(au.ipAddress)}, ${escapeSql(au.createdAt)});\n`;
  });

  notifications.forEach((n) => {
    dumpSql += `INSERT INTO "Notification" ("id", "userId", "title", "message", "type", "isRead", "createdAt") VALUES (${escapeSql(n.id)}, ${escapeSql(n.userId)}, ${escapeSql(n.title)}, ${escapeSql(n.message)}, ${escapeSql(n.type)}, ${escapeSql(n.isRead)}, ${escapeSql(n.createdAt)});\n`;
  });

  fs.writeFileSync(path.join(databaseDir, 'hrms_dump.sql'), dumpSql);
  console.log('Wrote database/hrms_dump.sql successfully!');
}

generateDump()
  .catch((e) => {
    console.error('Error generating database dump:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
