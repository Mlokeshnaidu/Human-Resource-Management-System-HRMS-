const PDFDocument = require('pdfkit');
const prisma = require('../config/prisma');

/**
 * High-level dashboard metrics for Admin & HR
 */
async function getDashboardStats(req, res) {
  try {
    const totalEmployees = await prisma.employee.count();
    const activeEmployees = await prisma.employee.count({ where: { status: 'ACTIVE' } });

    // Today's attendance
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = await prisma.attendance.findMany({
      where: { date: today },
    });
    const presentToday = todayRecords.filter((a) => a.status === 'PRESENT').length;
    const halfDayToday = todayRecords.filter((a) => a.status === 'HALF_DAY').length;
    const absentToday = Math.max(0, activeEmployees - (presentToday + halfDayToday));

    // Pending leaves
    const pendingLeaves = await prisma.leaveRequest.count({ where: { status: 'PENDING' } });

    // Current month payroll summary
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const payrollRecords = await prisma.payroll.findMany({
      where: { month: currentMonth, year: currentYear },
    });

    const totalPayrollDisbursed = payrollRecords.reduce((acc, p) => acc + p.netSalary, 0);
    const lockedPayrollCount = payrollRecords.filter((p) => p.isLocked).length;

    // Department breakdown
    const departmentGroups = await prisma.employee.groupBy({
      by: ['department'],
      _count: { id: true },
    });

    // Recent 5 audits
    const recentAudits = await prisma.auditLog.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      data: {
        totalEmployees,
        activeEmployees,
        todayAttendance: {
          present: presentToday,
          halfDay: halfDayToday,
          absent: absentToday,
          totalLogged: todayRecords.length,
        },
        pendingLeaves,
        currentPayroll: {
          month: currentMonth,
          year: currentYear,
          totalRecords: payrollRecords.length,
          totalAmount: totalPayrollDisbursed,
          lockedCount: lockedPayrollCount,
        },
        departments: departmentGroups.map((d) => ({ name: d.department, count: d._count.id })),
        recentAudits,
      },
    });
  } catch (err) {
    console.error('Error getting dashboard stats:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch dashboard statistics', error: err.message });
  }
}

/**
 * Attendance Analytics and Detailed Records
 */
async function getAttendanceReport(req, res) {
  try {
    const { startDate, endDate, department } = req.query;

    const where = {};
    if (startDate && endDate) {
      where.date = { gte: startDate, lte: endDate };
    }
    if (department && department !== 'ALL') {
      where.employee = { department };
    }

    const records = await prisma.attendance.findMany({
      where,
      include: {
        employee: {
          select: { employeeCode: true, firstName: true, lastName: true, department: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    const summary = {
      total: records.length,
      present: records.filter((r) => r.status === 'PRESENT').length,
      halfDay: records.filter((r) => r.status === 'HALF_DAY').length,
      absent: records.filter((r) => r.status === 'ABSENT').length,
      onLeave: records.filter((r) => r.status === 'ON_LEAVE').length,
    };

    return res.json({
      success: true,
      summary,
      records,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Attendance report failed', error: err.message });
  }
}

/**
 * Leave Analytics & History Report
 */
async function getLeaveReport(req, res) {
  try {
    const { department, status, year } = req.query;

    const where = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (department && department !== 'ALL') {
      where.employee = { department };
    }
    if (year) {
      where.startDate = { startsWith: String(year) };
    }

    const leaves = await prisma.leaveRequest.findMany({
      where,
      include: {
        employee: {
          select: { employeeCode: true, firstName: true, lastName: true, department: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const breakdown = {
      CL: leaves.filter((l) => l.leaveType === 'CL').length,
      SL: leaves.filter((l) => l.leaveType === 'SL').length,
      PL: leaves.filter((l) => l.leaveType === 'PL').length,
      LOP: leaves.filter((l) => l.leaveType === 'LOP' || l.isLossOfPay).length,
      approved: leaves.filter((l) => l.status === 'APPROVED').length,
      rejected: leaves.filter((l) => l.status === 'REJECTED').length,
      pending: leaves.filter((l) => l.status === 'PENDING').length,
    };

    return res.json({
      success: true,
      summary: breakdown,
      leaves,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Leave report failed', error: err.message });
  }
}

/**
 * Payroll Summary Report
 */
async function getPayrollReport(req, res) {
  try {
    const { month, year, department } = req.query;

    const where = {};
    if (month && month !== 'ALL') {
      where.month = parseInt(month);
    }
    if (year && year !== 'ALL') {
      where.year = parseInt(year);
    }
    if (department && department !== 'ALL') {
      where.employee = { department };
    }

    const payrolls = await prisma.payroll.findMany({
      where,
      include: {
        employee: {
          select: { employeeCode: true, firstName: true, lastName: true, department: true },
        },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    const totals = payrolls.reduce(
      (acc, p) => {
        acc.gross += p.grossSalary;
        acc.net += p.netSalary;
        acc.pf += p.pf;
        acc.tax += p.tax;
        acc.lop += p.lopDeduction;
        return acc;
      },
      { gross: 0, net: 0, pf: 0, tax: 0, lop: 0 }
    );

    return res.json({
      success: true,
      totals,
      payrolls,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Payroll report failed', error: err.message });
  }
}

/**
 * Export report to CSV
 */
async function exportCsv(req, res) {
  try {
    const { type = 'payroll', month, year, department } = req.query;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${type}_report_${Date.now()}.csv"`);

    if (type === 'payroll') {
      const where = {};
      if (month && month !== 'ALL') where.month = parseInt(month);
      if (year && year !== 'ALL') where.year = parseInt(year);
      if (department && department !== 'ALL') where.employee = { department };

      const records = await prisma.payroll.findMany({
        where,
        include: { employee: true },
      });

      let csv = 'EmployeeCode,Name,Department,Month,Year,GrossSalary,PF,Tax,LOPDeduction,NetSalary,Status\n';
      records.forEach((p) => {
        csv += `"${p.employee.employeeCode}","${p.employee.firstName} ${p.employee.lastName}","${p.employee.department}",${p.month},${p.year},${p.grossSalary},${p.pf},${p.tax},${p.lopDeduction},${p.netSalary},"${p.status}"\n`;
      });
      return res.send(csv);
    } else if (type === 'attendance') {
      const records = await prisma.attendance.findMany({
        include: { employee: true },
        take: 500,
        orderBy: { date: 'desc' },
      });

      let csv = 'EmployeeCode,Name,Department,Date,CheckIn,CheckOut,WorkingHours,Status,IsOverride\n';
      records.forEach((a) => {
        csv += `"${a.employee.employeeCode}","${a.employee.firstName} ${a.employee.lastName}","${a.employee.department}","${a.date}","${a.checkIn ? new Date(a.checkIn).toLocaleTimeString() : ''}","${a.checkOut ? new Date(a.checkOut).toLocaleTimeString() : ''}",${a.workingHours},"${a.status}",${a.isOverride}\n`;
      });
      return res.send(csv);
    } else {
      // Leave report
      const records = await prisma.leaveRequest.findMany({
        include: { employee: true },
        orderBy: { createdAt: 'desc' },
      });

      let csv = 'EmployeeCode,Name,Department,LeaveType,StartDate,EndDate,TotalDays,Status,LossOfPay\n';
      records.forEach((l) => {
        csv += `"${l.employee.employeeCode}","${l.employee.firstName} ${l.employee.lastName}","${l.employee.department}","${l.leaveType}","${l.startDate}","${l.endDate}",${l.totalDays},"${l.status}",${l.isLossOfPay}\n`;
      });
      return res.send(csv);
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: 'CSV export failed', error: err.message });
  }
}

/**
 * Export report to formatted PDF
 */
async function exportPdf(req, res) {
  try {
    const { type = 'payroll' } = req.query;

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${type}_report.pdf"`);
    doc.pipe(res);

    doc.rect(40, 40, 515, 45).fill('#0f172a');
    doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold')
      .text(`TECHFLOW HRMS - ${type.toUpperCase()} ANALYTICS REPORT`, 55, 55);

    doc.fillColor('#1e293b').fontSize(10).font('Helvetica')
      .text(`Generated on: ${new Date().toLocaleString()}`, 40, 100);

    if (type === 'payroll') {
      const records = await prisma.payroll.findMany({
        include: { employee: true },
        take: 20,
        orderBy: { createdAt: 'desc' },
      });

      let y = 130;
      doc.rect(40, y, 515, 20).fill('#e2e8f0');
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(9)
        .text('Code', 50, y + 5)
        .text('Employee', 120, y + 5)
        .text('Dept', 220, y + 5)
        .text('Gross (₹)', 320, y + 5)
        .text('Net (₹)', 410, y + 5)
        .text('Status', 490, y + 5);

      y += 20;
      records.forEach((r, idx) => {
        const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
        doc.rect(40, y, 515, 18).fill(bg);
        doc.fillColor('#334155').font('Helvetica').fontSize(8)
          .text(r.employee.employeeCode, 50, y + 4)
          .text(`${r.employee.firstName} ${r.employee.lastName}`, 120, y + 4)
          .text(r.employee.department, 220, y + 4)
          .text(`₹${r.grossSalary.toLocaleString()}`, 320, y + 4)
          .text(`₹${r.netSalary.toLocaleString()}`, 410, y + 4)
          .text(r.status, 490, y + 4);
        y += 18;
      });
    }

    doc.end();
  } catch (err) {
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: 'PDF export failed', error: err.message });
    }
  }
}

module.exports = {
  getDashboardStats,
  getAttendanceReport,
  getLeaveReport,
  getPayrollReport,
  exportCsv,
  exportPdf,
};
