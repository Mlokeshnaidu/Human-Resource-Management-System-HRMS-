const prisma = require('../config/prisma');
const { logAudit } = require('../services/auditService');

function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check-in for current employee
 */
async function checkIn(req, res) {
  try {
    const employee = req.user.employee;
    if (!employee) {
      return res.status(400).json({ success: false, message: 'No associated employee profile found' });
    }

    const today = getTodayDateString();
    const existing = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: employee.id,
          date: today,
        },
      },
    });

    if (existing && existing.checkIn) {
      return res.status(400).json({
        success: false,
        message: `Duplicate check-in prevented. You already checked in today at ${new Date(existing.checkIn).toLocaleTimeString()}`,
        data: existing,
      });
    }

    const now = new Date();
    const attendance = await prisma.attendance.upsert({
      where: {
        employeeId_date: {
          employeeId: employee.id,
          date: today,
        },
      },
      update: {
        checkIn: now,
        status: 'PRESENT',
      },
      create: {
        employeeId: employee.id,
        date: today,
        checkIn: now,
        status: 'PRESENT',
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Check-in successful! Have a productive day.',
      data: attendance,
    });
  } catch (err) {
    console.error('Check-in error:', err);
    return res.status(500).json({ success: false, message: 'Failed to record check-in', error: err.message });
  }
}

/**
 * Check-out for current employee
 */
async function checkOut(req, res) {
  try {
    const employee = req.user.employee;
    if (!employee) {
      return res.status(400).json({ success: false, message: 'No associated employee profile found' });
    }

    const today = getTodayDateString();
    const existing = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: employee.id,
          date: today,
        },
      },
    });

    if (!existing || !existing.checkIn) {
      return res.status(400).json({
        success: false,
        message: 'You have not checked in today yet. Please check in first.',
      });
    }

    const now = new Date();
    const checkInTime = new Date(existing.checkIn).getTime();
    const checkOutTime = now.getTime();
    const diffHours = Math.max(0, (checkOutTime - checkInTime) / (1000 * 60 * 60));
    const workingHours = parseFloat(diffHours.toFixed(2));

    // Determine status based on hours
    let status = 'PRESENT';
    if (workingHours < 4) {
      status = 'HALF_DAY';
    }

    const updated = await prisma.attendance.update({
      where: { id: existing.id },
      data: {
        checkOut: now,
        workingHours,
        status: existing.isOverride ? existing.status : status,
      },
    });

    return res.json({
      success: true,
      message: `Checked out successfully! Total working hours: ${workingHours} hrs.`,
      data: updated,
    });
  } catch (err) {
    console.error('Check-out error:', err);
    return res.status(500).json({ success: false, message: 'Failed to record check-out', error: err.message });
  }
}

/**
 * Get today's attendance status for current employee
 */
async function getTodayStatus(req, res) {
  try {
    const employee = req.user.employee;
    if (!employee) {
      return res.json({ success: true, data: null });
    }

    const today = getTodayDateString();
    const record = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: employee.id,
          date: today,
        },
      },
    });

    return res.json({
      success: true,
      date: today,
      data: record || null,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch today status', error: err.message });
  }
}

/**
 * Monthly attendance summary for logged-in employee
 */
async function getMyAttendance(req, res) {
  try {
    const employee = req.user.employee;
    if (!employee) {
      return res.status(400).json({ success: false, message: 'No associated employee' });
    }

    const { month, year } = req.query;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    const currentMonth = month ? String(month).padStart(2, '0') : String(new Date().getMonth() + 1).padStart(2, '0');
    const datePrefix = `${currentYear}-${currentMonth}`;

    const records = await prisma.attendance.findMany({
      where: {
        employeeId: employee.id,
        date: { startsWith: datePrefix },
      },
      orderBy: { date: 'asc' },
    });

    const summary = {
      totalRecords: records.length,
      presentDays: records.filter((r) => r.status === 'PRESENT').length,
      halfDays: records.filter((r) => r.status === 'HALF_DAY').length,
      absentDays: records.filter((r) => r.status === 'ABSENT').length,
      onLeaveDays: records.filter((r) => r.status === 'ON_LEAVE').length,
      totalHours: records.reduce((acc, r) => acc + (r.workingHours || 0), 0).toFixed(1),
    };

    return res.json({
      success: true,
      month: currentMonth,
      year: currentYear,
      summary,
      records,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch attendance history', error: err.message });
  }
}

/**
 * Admin / HR view of all attendance records
 */
async function getAllAttendance(req, res) {
  try {
    const { date, month, year, department, employeeId } = req.query;

    const where = {};
    if (date) {
      where.date = date;
    } else if (month && year) {
      const monthStr = String(month).padStart(2, '0');
      where.date = { startsWith: `${year}-${monthStr}` };
    }

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (department && department !== 'ALL') {
      where.employee = { department };
    }

    const records = await prisma.attendance.findMany({
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
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });

    return res.json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch attendance records', error: err.message });
  }
}

/**
 * Admin / HR override capability for corrections
 */
async function overrideAttendance(req, res) {
  try {
    const { employeeId, date, checkIn, checkOut, workingHours, status, overrideReason, notes } = req.body;

    if (!employeeId || !date || !status) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: employeeId, date, status',
      });
    }

    let parsedHours = workingHours ? parseFloat(workingHours) : 0;
    let parsedCheckIn = checkIn ? new Date(checkIn) : null;
    let parsedCheckOut = checkOut ? new Date(checkOut) : null;

    if (parsedCheckIn && parsedCheckOut && !workingHours) {
      const diff = Math.max(0, (parsedCheckOut.getTime() - parsedCheckIn.getTime()) / (1000 * 60 * 60));
      parsedHours = parseFloat(diff.toFixed(2));
    }

    const record = await prisma.attendance.upsert({
      where: {
        employeeId_date: {
          employeeId,
          date,
        },
      },
      update: {
        checkIn: parsedCheckIn,
        checkOut: parsedCheckOut,
        workingHours: parsedHours,
        status,
        isOverride: true,
        overrideReason: overrideReason || 'Administrative correction',
        overriddenBy: req.user.email,
        notes: notes || 'Modified by Admin/HR',
      },
      create: {
        employeeId,
        date,
        checkIn: parsedCheckIn,
        checkOut: parsedCheckOut,
        workingHours: parsedHours,
        status,
        isOverride: true,
        overrideReason: overrideReason || 'Manual Admin entry',
        overriddenBy: req.user.email,
        notes: notes || 'Created via Admin override',
      },
      include: {
        employee: true,
      },
    });

    await logAudit({
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'ATTENDANCE_OVERRIDE',
      targetEntity: 'Attendance',
      targetId: record.id,
      details: `Admin override on ${date} for ${record.employee.employeeCode}: Status=${status}, Hours=${parsedHours}. Reason: ${overrideReason}`,
      ipAddress: req.ip,
    });

    return res.json({
      success: true,
      message: 'Attendance record updated successfully with administrative override flag',
      data: record,
    });
  } catch (err) {
    console.error('Attendance override error:', err);
    return res.status(500).json({ success: false, message: 'Failed to override attendance', error: err.message });
  }
}

module.exports = {
  checkIn,
  checkOut,
  getTodayStatus,
  getMyAttendance,
  getAllAttendance,
  overrideAttendance,
};
