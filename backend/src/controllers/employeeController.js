const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const prisma = require('../config/prisma');
const { logAudit } = require('../services/auditService');
const { sendNotificationEmail } = require('../services/emailService');

/**
 * List all employees with filtering and search
 */
async function getAllEmployees(req, res) {
  try {
    const { department, status, search } = req.query;

    const where = {};
    if (department && department !== 'ALL') {
      where.department = department;
    }
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { employeeCode: { contains: search } },
        { user: { email: { contains: search } } },
      ];
    }

    const employees = await prisma.employee.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
        documents: true,
        leaveBalances: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      data: employees,
    });
  } catch (err) {
    console.error('Error fetching employees:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch employees', error: err.message });
  }
}

/**
 * Get single employee profile by ID
 */
async function getEmployeeById(req, res) {
  try {
    const { id } = req.params;

    // Authorization: Employees can only view their own profile, unless Admin or HR
    if (req.user.role === 'EMPLOYEE' && req.user.employee?.id !== id) {
      return res.status(403).json({ success: false, message: 'Access denied to other employee profiles' });
    }

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
        documents: true,
        leaveBalances: true,
        attendance: {
          take: 30,
          orderBy: { date: 'desc' },
        },
        payrolls: {
          take: 12,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    return res.json({
      success: true,
      data: employee,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch employee details', error: err.message });
  }
}

/**
 * Onboard/Create new Employee with User credentials & Leave Balances
 */
async function createEmployee(req, res) {
  try {
    const {
      email,
      password,
      role = 'EMPLOYEE',
      firstName,
      lastName,
      phone,
      department,
      designation,
      joiningDate,
      baseSalary,
      hra,
      allowances,
      pfDeduction,
      taxDeduction,
      bankName,
      accountNumber,
      ifscCode,
      emergencyContact,
      address,
    } = req.body;

    if (!email || !firstName || !lastName || !department || !designation || !joiningDate) {
      return res.status(400).json({
        success: false,
        message: 'Required fields missing: email, firstName, lastName, department, designation, joiningDate',
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists',
      });
    }

    // Generate unique employeeCode
    const count = await prisma.employee.count();
    const employeeCode = `HRMS-${String(count + 1001).padStart(4, '0')}`;
    const initialPassword = password || 'Welcome@123';
    const hashedPassword = await bcrypt.hash(initialPassword, 10);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          role,
          isActive: true,
        },
      });

      // 2. Create Employee
      const employee = await tx.employee.create({
        data: {
          employeeCode,
          userId: user.id,
          firstName,
          lastName,
          phone,
          department,
          designation,
          joiningDate: new Date(joiningDate),
          status: 'ACTIVE',
          baseSalary: baseSalary ? parseFloat(baseSalary) : 50000,
          hra: hra ? parseFloat(hra) : 15000,
          allowances: allowances ? parseFloat(allowances) : 5000,
          pfDeduction: pfDeduction ? parseFloat(pfDeduction) : 3600,
          taxDeduction: taxDeduction ? parseFloat(taxDeduction) : 2500,
          bankName,
          accountNumber,
          ifscCode,
          emergencyContact,
          address,
        },
      });

      // 3. Initialize annual leave balances
      const currentYear = new Date().getFullYear();
      await tx.leaveBalance.createMany({
        data: [
          { employeeId: employee.id, year: currentYear, leaveType: 'CL', totalDays: 12, usedDays: 0, remainingDays: 12 },
          { employeeId: employee.id, year: currentYear, leaveType: 'SL', totalDays: 10, usedDays: 0, remainingDays: 10 },
          { employeeId: employee.id, year: currentYear, leaveType: 'PL', totalDays: 15, usedDays: 0, remainingDays: 15 },
        ],
      });

      return { user, employee };
    });

    // Send Onboarding Welcome Email
    await sendNotificationEmail({
      to: email,
      type: 'ONBOARDING',
      userId: result.user.id,
      data: {
        name: `${firstName} ${lastName}`,
        email,
        employeeCode,
        department,
        designation,
        joiningDate: new Date(joiningDate).toDateString(),
        temporaryPassword: initialPassword,
        loginUrl: 'http://localhost:5173',
      },
    });

    // Log Audit
    await logAudit({
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'EMPLOYEE_CREATED',
      targetEntity: 'Employee',
      targetId: result.employee.id,
      details: `Created employee ${employeeCode} (${firstName} ${lastName}, ${department})`,
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: 'Employee onboarded successfully with credentials generated',
      data: result.employee,
    });
  } catch (err) {
    console.error('Error creating employee:', err);
    return res.status(500).json({ success: false, message: 'Failed to onboard employee', error: err.message });
  }
}

/**
 * Update employee profile
 */
async function updateEmployee(req, res) {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      phone,
      department,
      designation,
      status,
      baseSalary,
      hra,
      allowances,
      pfDeduction,
      taxDeduction,
      bankName,
      accountNumber,
      ifscCode,
      emergencyContact,
      address,
      role,
    } = req.body;

    const existing = await prisma.employee.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const updatedEmployee = await prisma.$transaction(async (tx) => {
      if (role && role !== existing.user.role) {
        await tx.user.update({
          where: { id: existing.userId },
          data: { role },
        });
      }

      if (status && status !== existing.status) {
        await tx.user.update({
          where: { id: existing.userId },
          data: { isActive: status === 'ACTIVE' },
        });
      }

      return await tx.employee.update({
        where: { id },
        data: {
          firstName: firstName !== undefined ? firstName : existing.firstName,
          lastName: lastName !== undefined ? lastName : existing.lastName,
          phone: phone !== undefined ? phone : existing.phone,
          department: department !== undefined ? department : existing.department,
          designation: designation !== undefined ? designation : existing.designation,
          status: status !== undefined ? status : existing.status,
          baseSalary: baseSalary !== undefined ? parseFloat(baseSalary) : existing.baseSalary,
          hra: hra !== undefined ? parseFloat(hra) : existing.hra,
          allowances: allowances !== undefined ? parseFloat(allowances) : existing.allowances,
          pfDeduction: pfDeduction !== undefined ? parseFloat(pfDeduction) : existing.pfDeduction,
          taxDeduction: taxDeduction !== undefined ? parseFloat(taxDeduction) : existing.taxDeduction,
          bankName: bankName !== undefined ? bankName : existing.bankName,
          accountNumber: accountNumber !== undefined ? accountNumber : existing.accountNumber,
          ifscCode: ifscCode !== undefined ? ifscCode : existing.ifscCode,
          emergencyContact: emergencyContact !== undefined ? emergencyContact : existing.emergencyContact,
          address: address !== undefined ? address : existing.address,
        },
        include: {
          user: true,
          documents: true,
          leaveBalances: true,
        },
      });
    });

    await logAudit({
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'EMPLOYEE_UPDATED',
      targetEntity: 'Employee',
      targetId: id,
      details: `Updated details for ${updatedEmployee.employeeCode}`,
      ipAddress: req.ip,
    });

    return res.json({
      success: true,
      message: 'Employee updated successfully',
      data: updatedEmployee,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update employee', error: err.message });
  }
}

/**
 * Toggle status (Deactivate / Activate)
 */
async function toggleEmployeeStatus(req, res) {
  try {
    const { id } = req.params;
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const newStatus = employee.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const isUserActive = newStatus === 'ACTIVE';

    await prisma.$transaction([
      prisma.employee.update({
        where: { id },
        data: { status: newStatus },
      }),
      prisma.user.update({
        where: { id: employee.userId },
        data: { isActive: isUserActive },
      }),
    ]);

    await logAudit({
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: newStatus === 'ACTIVE' ? 'EMPLOYEE_ACTIVATED' : 'EMPLOYEE_DEACTIVATED',
      targetEntity: 'Employee',
      targetId: id,
      details: `Status changed to ${newStatus} for ${employee.employeeCode}`,
      ipAddress: req.ip,
    });

    return res.json({
      success: true,
      message: `Employee marked as ${newStatus}`,
      status: newStatus,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to toggle status', error: err.message });
  }
}

/**
 * Upload employee document
 */
async function uploadDocument(req, res) {
  try {
    const { id } = req.params;
    const { documentType = 'OTHER' } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const doc = await prisma.document.create({
      data: {
        employeeId: id,
        documentType,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      },
    });

    await logAudit({
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'DOCUMENT_UPLOADED',
      targetEntity: 'Document',
      targetId: doc.id,
      details: `Uploaded ${documentType} file '${req.file.originalname}' for ${employee.employeeCode}`,
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: doc,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Document upload failed', error: err.message });
  }
}

/**
 * Delete employee document
 */
async function deleteDocument(req, res) {
  try {
    const { documentId } = req.params;
    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // Try deleting from filesystem
    if (fs.existsSync(doc.filePath)) {
      try {
        fs.unlinkSync(doc.filePath);
      } catch (_) {}
    }

    await prisma.document.delete({ where: { id: documentId } });

    await logAudit({
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'DOCUMENT_DELETED',
      targetEntity: 'Document',
      targetId: documentId,
      details: `Deleted document ${doc.originalName}`,
      ipAddress: req.ip,
    });

    return res.json({ success: true, message: 'Document removed successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete document', error: err.message });
  }
}

/**
 * Download employee document
 */
async function downloadDocument(req, res) {
  try {
    const { documentId } = req.params;
    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    if (!fs.existsSync(doc.filePath)) {
      return res.status(404).json({ success: false, message: 'File not found on storage disk' });
    }

    return res.download(doc.filePath, doc.originalName);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Download failed', error: err.message });
  }
}

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  toggleEmployeeStatus,
  uploadDocument,
  deleteDocument,
  downloadDocument,
};
