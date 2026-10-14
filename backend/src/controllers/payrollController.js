const prisma = require('../config/prisma');
const { logAudit } = require('../services/auditService');
const { sendNotificationEmail } = require('../services/emailService');
const { generateSalarySlipPdf } = require('../services/pdfService');

/**
 * Generate or recalculate monthly payroll for employees
 */
async function generatePayroll(req, res) {
  try {
    const { month, year, employeeId } = req.body;

    const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();

    // Query employees to process
    const whereEmp = { status: 'ACTIVE' };
    if (employeeId) {
      whereEmp.id = employeeId;
    }

    const employees = await prisma.employee.findMany({
      where: whereEmp,
      include: { user: true },
    });

    if (employees.length === 0) {
      return res.status(404).json({ success: false, message: 'No active employees found to process' });
    }

    const results = [];
    const datePrefix = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;

    for (const emp of employees) {
      // Check existing payroll
      const existing = await prisma.payroll.findUnique({
        where: {
          employeeId_month_year: {
            employeeId: emp.id,
            month: targetMonth,
            year: targetYear,
          },
        },
      });

      if (existing && existing.isLocked) {
        // Skip locked records
        results.push({ employeeCode: emp.employeeCode, status: 'SKIPPED_LOCKED' });
        continue;
      }

      // Fetch attendance in target month
      const attendanceRecords = await prisma.attendance.findMany({
        where: {
          employeeId: emp.id,
          date: { startsWith: datePrefix },
        },
      });

      const presentCount = attendanceRecords.filter((a) => a.status === 'PRESENT').length;
      const halfDayCount = attendanceRecords.filter((a) => a.status === 'HALF_DAY').length;
      const effectivePresent = presentCount + halfDayCount * 0.5;

      // Fetch approved leaves in target month
      const approvedLeaves = await prisma.leaveRequest.findMany({
        where: {
          employeeId: emp.id,
          status: 'APPROVED',
          startDate: { startsWith: datePrefix },
        },
      });

      const lopLeaves = approvedLeaves
        .filter((l) => l.isLossOfPay || l.leaveType === 'LOP')
        .reduce((sum, l) => sum + l.totalDays, 0);

      const paidLeaves = approvedLeaves
        .filter((l) => !l.isLossOfPay && l.leaveType !== 'LOP')
        .reduce((sum, l) => sum + l.totalDays, 0);

      // Total working days
      const totalWorkingDays = daysInMonth;
      const accountedDays = effectivePresent + paidLeaves + lopLeaves;
      const unaccountedAbsence = Math.max(0, totalWorkingDays - accountedDays);
      const totalLopDays = lopLeaves + (attendanceRecords.length > 0 ? unaccountedAbsence : 0);

      // Financial calculations
      const baseSalary = emp.baseSalary;
      const hra = emp.hra;
      const allowances = emp.allowances;
      const bonus = existing?.bonus || 0;
      const grossSalary = baseSalary + hra + allowances + bonus;

      const perDaySalary = baseSalary / totalWorkingDays;
      const lopDeduction = parseFloat((perDaySalary * totalLopDays).toFixed(2));
      const pf = emp.pfDeduction;
      const tax = emp.taxDeduction;
      const otherDeductions = existing?.otherDeductions || 0;
      const totalDeductions = parseFloat((pf + tax + lopDeduction + otherDeductions).toFixed(2));
      const netSalary = Math.max(0, parseFloat((grossSalary - totalDeductions).toFixed(2)));

      const payroll = await prisma.payroll.upsert({
        where: {
          employeeId_month_year: {
            employeeId: emp.id,
            month: targetMonth,
            year: targetYear,
          },
        },
        update: {
          totalWorkingDays,
          presentDays: effectivePresent,
          paidLeaveDays: paidLeaves,
          lopDays: totalLopDays,
          baseSalary,
          hra,
          allowances,
          bonus,
          grossSalary,
          pf,
          tax,
          lopDeduction,
          otherDeductions,
          totalDeductions,
          netSalary,
          status: 'PROCESSED',
        },
        create: {
          employeeId: emp.id,
          month: targetMonth,
          year: targetYear,
          totalWorkingDays,
          presentDays: effectivePresent,
          paidLeaveDays: paidLeaves,
          lopDays: totalLopDays,
          baseSalary,
          hra,
          allowances,
          bonus,
          grossSalary,
          pf,
          tax,
          lopDeduction,
          otherDeductions,
          totalDeductions,
          netSalary,
          status: 'PROCESSED',
        },
      });

      results.push({
        employeeCode: emp.employeeCode,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        netSalary,
        lopDays: totalLopDays,
        status: 'PROCESSED',
      });
    }

    await logAudit({
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'PAYROLL_GENERATED',
      targetEntity: 'Payroll',
      details: `Generated payroll for ${targetMonth}/${targetYear} across ${results.length} employee records`,
      ipAddress: req.ip,
    });

    return res.json({
      success: true,
      message: `Payroll processed successfully for ${targetMonth}/${targetYear}`,
      processedCount: results.length,
      data: results,
    });
  } catch (err) {
    console.error('Payroll generation error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate payroll', error: err.message });
  }
}

/**
 * Lock payroll to freeze records
 */
async function lockPayroll(req, res) {
  try {
    const { id } = req.params;

    const payroll = await prisma.payroll.findUnique({
      where: { id },
      include: {
        employee: {
          include: { user: true },
        },
      },
    });

    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Payroll record not found' });
    }

    if (payroll.isLocked) {
      return res.status(400).json({ success: false, message: 'Payroll is already locked' });
    }

    const updated = await prisma.payroll.update({
      where: { id },
      data: {
        isLocked: true,
        lockedAt: new Date(),
        status: payroll.status === 'DRAFT' ? 'PROCESSED' : payroll.status,
      },
    });

    // Notify employee of payroll lock / payslip generation
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    await sendNotificationEmail({
      to: payroll.employee.user.email,
      type: 'PAYROLL_PROCESSED',
      userId: payroll.employee.user.id,
      data: {
        name: `${payroll.employee.firstName} ${payroll.employee.lastName}`,
        monthYear: `${monthNames[payroll.month - 1]} ${payroll.year}`,
        grossSalary: payroll.grossSalary,
        totalDeductions: payroll.totalDeductions,
        netSalary: payroll.netSalary,
      },
    });

    await logAudit({
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'PAYROLL_LOCKED',
      targetEntity: 'Payroll',
      targetId: id,
      details: `Locked payroll record for ${payroll.employee.employeeCode} (${payroll.month}/${payroll.year})`,
      ipAddress: req.ip,
    });

    return res.json({
      success: true,
      message: 'Payroll locked successfully. No further modifications allowed.',
      data: updated,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to lock payroll', error: err.message });
  }
}

/**
 * Simulate Salary Disbursement / Credit to bank accounts
 */
async function simulateDisbursement(req, res) {
  try {
    const { id } = req.params;

    const payroll = await prisma.payroll.findUnique({
      where: { id },
      include: { employee: true },
    });

    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Payroll record not found' });
    }

    const txnRef = `SIM-NEFT-${Date.now().toString().slice(-8)}`;

    const updated = await prisma.payroll.update({
      where: { id },
      data: {
        status: 'PAID',
        paymentDate: new Date(),
        paymentMethod: 'NEFT / DIRECT_BANK_TRANSFER',
        transactionReference: txnRef,
        isLocked: true,
        lockedAt: payroll.lockedAt || new Date(),
      },
    });

    await logAudit({
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'PAYROLL_DISBURSED',
      targetEntity: 'Payroll',
      targetId: id,
      details: `Disbursed ₹${payroll.netSalary} to ${payroll.employee.employeeCode}. Reference: ${txnRef}`,
      ipAddress: req.ip,
    });

    return res.json({
      success: true,
      message: `Salary disbursement simulated successfully! Ref: ${txnRef}`,
      data: updated,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to disburse salary', error: err.message });
  }
}

/**
 * Manual adjustment to payroll (bonus, otherDeductions, remarks) before locking
 */
async function adjustPayroll(req, res) {
  try {
    const { id } = req.params;
    const { bonus = 0, otherDeductions = 0, remarks } = req.body;

    const payroll = await prisma.payroll.findUnique({ where: { id } });
    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Payroll record not found' });
    }

    if (payroll.isLocked) {
      return res.status(400).json({ success: false, message: 'Cannot adjust a locked payroll record' });
    }

    const newBonus = parseFloat(bonus) || 0;
    const newOtherDeductions = parseFloat(otherDeductions) || 0;

    const newGross = payroll.baseSalary + payroll.hra + payroll.allowances + newBonus;
    const newTotalDeductions = payroll.pf + payroll.tax + payroll.lopDeduction + newOtherDeductions;
    const newNetSalary = Math.max(0, newGross - newTotalDeductions);

    const updated = await prisma.payroll.update({
      where: { id },
      data: {
        bonus: newBonus,
        otherDeductions: newOtherDeductions,
        grossSalary: newGross,
        totalDeductions: newTotalDeductions,
        netSalary: newNetSalary,
        remarks: remarks || payroll.remarks,
      },
    });

    return res.json({
      success: true,
      message: 'Manual adjustment saved',
      data: updated,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to adjust payroll', error: err.message });
  }
}

/**
 * Get all payrolls (Admin / HR view)
 */
async function getAllPayrolls(req, res) {
  try {
    const { month, year, department, status } = req.query;

    const where = {};
    if (month && month !== 'ALL') {
      where.month = parseInt(month);
    }
    if (year && year !== 'ALL') {
      where.year = parseInt(year);
    }
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (department && department !== 'ALL') {
      where.employee = { department };
    }

    const payrolls = await prisma.payroll.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            department: true,
            designation: true,
          },
        },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { createdAt: 'desc' }],
    });

    return res.json({
      success: true,
      data: payrolls,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch payroll list', error: err.message });
  }
}

/**
 * Get payroll history for logged in employee
 */
async function getMyPayrolls(req, res) {
  try {
    const employee = req.user.employee;
    if (!employee) {
      return res.status(400).json({ success: false, message: 'No associated employee profile' });
    }

    const payrolls = await prisma.payroll.findMany({
      where: { employeeId: employee.id },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    return res.json({
      success: true,
      data: payrolls,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch employee payrolls', error: err.message });
  }
}

/**
 * Generate and stream salary slip PDF
 */
async function downloadPayslipPdf(req, res) {
  try {
    const { id } = req.params;

    const payroll = await prisma.payroll.findUnique({
      where: { id },
      include: {
        employee: {
          include: { user: true },
        },
      },
    });

    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Payroll record not found' });
    }

    // Role security check
    if (req.user.role === 'EMPLOYEE' && req.user.employee?.id !== payroll.employeeId) {
      return res.status(403).json({ success: false, message: 'Access denied to download another employee payslip' });
    }

    const filename = `Payslip_${payroll.employee.employeeCode}_${payroll.month}_${payroll.year}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await generateSalarySlipPdf(payroll, res);
  } catch (err) {
    console.error('Payslip PDF download error:', err);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: 'Failed to generate PDF salary slip', error: err.message });
    }
  }
}

module.exports = {
  generatePayroll,
  lockPayroll,
  simulateDisbursement,
  adjustPayroll,
  getAllPayrolls,
  getMyPayrolls,
  downloadPayslipPdf,
};
