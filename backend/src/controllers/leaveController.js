const prisma = require('../config/prisma');
const { logAudit } = require('../services/auditService');
const { sendNotificationEmail } = require('../services/emailService');

function calculateDaysBetween(startDateStr, endDateStr) {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diffDays);
}

/**
 * Get leave balances for employee
 */
async function getMyLeaveBalances(req, res) {
  try {
    const employee = req.user.employee;
    if (!employee) {
      return res.status(400).json({ success: false, message: 'No associated employee profile' });
    }

    const currentYear = new Date().getFullYear();
    const balances = await prisma.leaveBalance.findMany({
      where: {
        employeeId: employee.id,
        year: currentYear,
      },
    });

    return res.json({
      success: true,
      year: currentYear,
      data: balances,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch balances', error: err.message });
  }
}

/**
 * Apply for leave
 */
async function applyLeave(req, res) {
  try {
    const employee = req.user.employee;
    if (!employee) {
      return res.status(400).json({ success: false, message: 'No associated employee profile' });
    }

    const { leaveType, startDate, endDate, reason } = req.body;

    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: leaveType, startDate, endDate, reason',
      });
    }

    const totalDays = calculateDaysBetween(startDate, endDate);
    const currentYear = new Date(startDate).getFullYear();
    let isLossOfPay = leaveType === 'LOP';

    // If paid leave type, verify balance
    if (!isLossOfPay) {
      const balance = await prisma.leaveBalance.findUnique({
        where: {
          employeeId_year_leaveType: {
            employeeId: employee.id,
            year: currentYear,
            leaveType,
          },
        },
      });

      if (!balance || balance.remainingDays < totalDays) {
        return res.status(400).json({
          success: false,
          message: `Insufficient ${leaveType} balance. Remaining: ${balance ? balance.remainingDays : 0} days, Requested: ${totalDays} days. Consider applying as Loss of Pay (LOP).`,
        });
      }
    }

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        employeeId: employee.id,
        leaveType,
        startDate,
        endDate,
        totalDays,
        reason,
        status: 'PENDING',
        isLossOfPay,
      },
    });

    // Notify HR admins via email log
    await sendNotificationEmail({
      to: 'hr-admin@techflow.io',
      type: 'LEAVE_APPLIED',
      data: {
        name: `${employee.firstName} ${employee.lastName}`,
        employeeCode: employee.employeeCode,
        leaveType,
        startDate,
        endDate,
        totalDays,
        reason,
      },
    });

    await logAudit({
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'LEAVE_APPLIED',
      targetEntity: 'LeaveRequest',
      targetId: leaveRequest.id,
      details: `${employee.employeeCode} applied for ${totalDays}d of ${leaveType} (${startDate} to ${endDate})`,
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully for HR approval',
      data: leaveRequest,
    });
  } catch (err) {
    console.error('Leave application error:', err);
    return res.status(500).json({ success: false, message: 'Failed to apply for leave', error: err.message });
  }
}

/**
 * Approve or Reject Leave Request (Admin / HR)
 */
async function reviewLeaveRequest(req, res) {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body; // 'APPROVED' or 'REJECTED'

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be APPROVED or REJECTED' });
    }

    const leave = await prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        employee: {
          include: { user: true },
        },
      },
    });

    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    if (leave.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Leave request has already been ${leave.status.toLowerCase()}`,
      });
    }

    const updatedLeave = await prisma.$transaction(async (tx) => {
      // 1. If approved and not LOP, deduct balance
      if (status === 'APPROVED' && !leave.isLossOfPay) {
        const year = new Date(leave.startDate).getFullYear();
        const balance = await tx.leaveBalance.findUnique({
          where: {
            employeeId_year_leaveType: {
              employeeId: leave.employeeId,
              year,
              leaveType: leave.leaveType,
            },
          },
        });

        if (balance) {
          const newUsed = balance.usedDays + leave.totalDays;
          const newRemaining = Math.max(0, balance.totalDays - newUsed);
          await tx.leaveBalance.update({
            where: { id: balance.id },
            data: {
              usedDays: newUsed,
              remainingDays: newRemaining,
            },
          });
        }
      }

      // 2. Update Leave Request status
      return await tx.leaveRequest.update({
        where: { id },
        data: {
          status,
          reviewedBy: req.user.email,
          reviewedAt: new Date(),
          rejectionReason: status === 'REJECTED' ? (rejectionReason || 'Declined by Administrator') : null,
        },
      });
    });

    // Send email notification to employee
    await sendNotificationEmail({
      to: leave.employee.user.email,
      type: 'LEAVE_STATUS_UPDATE',
      userId: leave.employee.user.id,
      data: {
        name: `${leave.employee.firstName} ${leave.employee.lastName}`,
        status,
        leaveType: leave.leaveType,
        startDate: leave.startDate,
        endDate: leave.endDate,
        totalDays: leave.totalDays,
        rejectionReason: status === 'REJECTED' ? rejectionReason : null,
      },
    });

    await logAudit({
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: status === 'APPROVED' ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED',
      targetEntity: 'LeaveRequest',
      targetId: id,
      details: `${status} leave for ${leave.employee.employeeCode} (${leave.totalDays} days, ${leave.leaveType}). Reviewed by ${req.user.email}`,
      ipAddress: req.ip,
    });

    return res.json({
      success: true,
      message: `Leave request has been ${status.toLowerCase()} successfully`,
      data: updatedLeave,
    });
  } catch (err) {
    console.error('Leave review error:', err);
    return res.status(500).json({ success: false, message: 'Failed to review leave request', error: err.message });
  }
}

/**
 * Get leave requests for current employee
 */
async function getMyLeaves(req, res) {
  try {
    const employee = req.user.employee;
    if (!employee) {
      return res.status(400).json({ success: false, message: 'No associated employee profile' });
    }

    const leaves = await prisma.leaveRequest.findMany({
      where: { employeeId: employee.id },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      data: leaves,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch leaves', error: err.message });
  }
}

/**
 * Get all leave requests (Admin/HR view)
 */
async function getAllLeaves(req, res) {
  try {
    const { status, department, leaveType } = req.query;

    const where = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (leaveType && leaveType !== 'ALL') {
      where.leaveType = leaveType;
    }
    if (department && department !== 'ALL') {
      where.employee = { department };
    }

    const leaves = await prisma.leaveRequest.findMany({
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
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      data: leaves,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch all leaves', error: err.message });
  }
}

module.exports = {
  getMyLeaveBalances,
  applyLeave,
  reviewLeaveRequest,
  getMyLeaves,
  getAllLeaves,
};
