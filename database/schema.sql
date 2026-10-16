-- =====================================================================
-- Human Resource Management System (HRMS) Database Schema
-- Database: MySQL (Engine: InnoDB)
-- Database Name: hrms_db
-- =====================================================================

CREATE TABLE `alembic_version` (
  `version_num` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`version_num`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `attendance` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `employeeId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checkIn` datetime DEFAULT NULL,
  `checkOut` datetime DEFAULT NULL,
  `workingHours` float NOT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `isOverride` tinyint(1) NOT NULL,
  `overrideReason` text COLLATE utf8mb4_unicode_ci,
  `overriddenBy` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `shiftId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isLate` tinyint(1) NOT NULL DEFAULT '0',
  `lateMinutes` int NOT NULL DEFAULT '0',
  `isEarlyExit` tinyint(1) NOT NULL DEFAULT '0',
  `earlyExitMinutes` int NOT NULL DEFAULT '0',
  `overtimeHours` float NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_attendance_emp_date` (`employeeId`,`date`),
  KEY `ix_attendance_date` (`date`),
  KEY `ix_attendance_employeeId` (`employeeId`),
  KEY `fk_attendance_shift` (`shiftId`),
  CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`employeeId`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_attendance_shift` FOREIGN KEY (`shiftId`) REFERENCES `shifts` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `audit_logs` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `userEmail` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `userRole` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `targetEntity` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `targetId` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `details` text COLLATE utf8mb4_unicode_ci,
  `ipAddress` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_audit_logs_targetEntity` (`targetEntity`),
  KEY `ix_audit_logs_action` (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `department_shifts` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `department` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `shiftId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `assignedBy` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_dept_shift` (`department`),
  UNIQUE KEY `ix_department_shifts_department` (`department`),
  KEY `shiftId` (`shiftId`),
  CONSTRAINT `department_shifts_ibfk_1` FOREIGN KEY (`shiftId`) REFERENCES `shifts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `documents` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `employeeId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `documentType` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fileName` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `originalName` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `filePath` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fileSize` int NOT NULL,
  `mimeType` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `uploadedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_documents_employeeId` (`employeeId`),
  CONSTRAINT `documents_ibfk_1` FOREIGN KEY (`employeeId`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `email_logs` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `to` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `template` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sentAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `employee_salary_structures` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `employeeId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `baseSalary` float NOT NULL,
  `hra` float NOT NULL,
  `conveyanceAllowance` float NOT NULL,
  `medicalAllowance` float NOT NULL,
  `specialAllowance` float NOT NULL,
  `pfDeduction` float NOT NULL,
  `taxDeduction` float NOT NULL,
  `professionalTax` float NOT NULL,
  `overtimeHourlyRate` float NOT NULL,
  `effectiveDate` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `isActive` tinyint(1) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_emp_salary_structure` (`employeeId`),
  UNIQUE KEY `ix_employee_salary_structures_employeeId` (`employeeId`),
  CONSTRAINT `employee_salary_structures_ibfk_1` FOREIGN KEY (`employeeId`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `employee_shifts` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `employeeId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `shiftId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `startDate` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `endDate` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `assignedBy` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `isActive` tinyint(1) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_employee_shifts_shiftId` (`shiftId`),
  KEY `ix_employee_shifts_employeeId` (`employeeId`),
  CONSTRAINT `employee_shifts_ibfk_1` FOREIGN KEY (`employeeId`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `employee_shifts_ibfk_2` FOREIGN KEY (`shiftId`) REFERENCES `shifts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `employees` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `employeeCode` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `firstName` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `lastName` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `department` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `designation` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `joiningDate` datetime NOT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `baseSalary` float NOT NULL,
  `hra` float NOT NULL,
  `allowances` float NOT NULL,
  `pfDeduction` float NOT NULL,
  `taxDeduction` float NOT NULL,
  `bankName` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `accountNumber` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ifscCode` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emergencyContact` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `userId` (`userId`),
  UNIQUE KEY `ix_employees_employeeCode` (`employeeCode`),
  KEY `ix_employees_department` (`department`),
  CONSTRAINT `employees_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `holidays` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `endDate` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `region` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `year` int NOT NULL,
  `isOptional` tinyint(1) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_holiday_date_name` (`date`,`name`),
  KEY `ix_holidays_year` (`year`),
  KEY `ix_holidays_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `leave_balances` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `employeeId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `year` int NOT NULL,
  `leaveType` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `totalDays` float NOT NULL,
  `usedDays` float NOT NULL,
  `remainingDays` float NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_leave_balance_emp_yr_type` (`employeeId`,`year`,`leaveType`),
  KEY `ix_leave_balances_employeeId` (`employeeId`),
  KEY `ix_leave_balances_year` (`year`),
  CONSTRAINT `leave_balances_ibfk_1` FOREIGN KEY (`employeeId`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `leave_requests` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `employeeId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `leaveType` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `startDate` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `endDate` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `totalDays` float NOT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reviewedBy` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reviewedAt` datetime DEFAULT NULL,
  `rejectionReason` text COLLATE utf8mb4_unicode_ci,
  `isLossOfPay` tinyint(1) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_leave_requests_employeeId` (`employeeId`),
  CONSTRAINT `leave_requests_ibfk_1` FOREIGN KEY (`employeeId`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `notification_preferences` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `emailEnabled` tinyint(1) NOT NULL,
  `leaveAlerts` tinyint(1) NOT NULL,
  `payrollAlerts` tinyint(1) NOT NULL,
  `attendanceAlerts` tinyint(1) NOT NULL,
  `announcements` tinyint(1) NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_notification_preferences_userId` (`userId`),
  CONSTRAINT `notification_preferences_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `notifications` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `isRead` tinyint(1) NOT NULL,
  `createdAt` datetime NOT NULL,
  `targetRole` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'ALL',
  `targetDepartment` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'ALL',
  `isBroadcast` tinyint(1) NOT NULL DEFAULT '0',
  `actionUrl` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_notifications_userId` (`userId`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `payrolls` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `employeeId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `month` int NOT NULL,
  `year` int NOT NULL,
  `totalWorkingDays` int NOT NULL,
  `presentDays` float NOT NULL,
  `paidLeaveDays` float NOT NULL,
  `lopDays` float NOT NULL,
  `baseSalary` float NOT NULL,
  `hra` float NOT NULL,
  `allowances` float NOT NULL,
  `bonus` float NOT NULL,
  `grossSalary` float NOT NULL,
  `pf` float NOT NULL,
  `tax` float NOT NULL,
  `lopDeduction` float NOT NULL,
  `otherDeductions` float NOT NULL,
  `totalDeductions` float NOT NULL,
  `netSalary` float NOT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `isLocked` tinyint(1) NOT NULL,
  `lockedAt` datetime DEFAULT NULL,
  `paymentDate` datetime DEFAULT NULL,
  `paymentMethod` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `transactionReference` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `standardWorkingDays` int NOT NULL DEFAULT '22',
  `weekendDaysCount` int NOT NULL DEFAULT '8',
  `holidaysCount` int NOT NULL DEFAULT '0',
  `conveyanceAllowance` float NOT NULL DEFAULT '0',
  `medicalAllowance` float NOT NULL DEFAULT '0',
  `specialAllowance` float NOT NULL DEFAULT '0',
  `overtimeHours` float NOT NULL DEFAULT '0',
  `overtimePay` float NOT NULL DEFAULT '0',
  `variablePay` float NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_payroll_emp_mo_yr` (`employeeId`,`month`,`year`),
  KEY `ix_payrolls_month` (`month`),
  KEY `ix_payrolls_employeeId` (`employeeId`),
  KEY `ix_payrolls_year` (`year`),
  CONSTRAINT `payrolls_ibfk_1` FOREIGN KEY (`employeeId`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `salary_revisions` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `employeeId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `previousGross` float NOT NULL,
  `newGross` float NOT NULL,
  `incrementPercentage` float NOT NULL,
  `previousBase` float NOT NULL,
  `newBase` float NOT NULL,
  `effectiveDate` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `revisedBy` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_salary_revisions_employeeId` (`employeeId`),
  CONSTRAINT `salary_revisions_ibfk_1` FOREIGN KEY (`employeeId`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `shifts` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `startTime` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `endTime` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `gracePeriodMinutes` int NOT NULL,
  `earlyExitThresholdMinutes` int NOT NULL,
  `fullDayHours` float NOT NULL,
  `halfDayHours` float NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `isDefault` tinyint(1) NOT NULL,
  `isActive` tinyint(1) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_shifts_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `users` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `isActive` tinyint(1) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
