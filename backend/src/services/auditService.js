const prisma = require('../config/prisma');

/**
 * Log critical system actions for compliance and read-only audit access
 */
async function logAudit({
  userId = null,
  userEmail = null,
  userRole = null,
  action,
  targetEntity,
  targetId = null,
  details = null,
  ipAddress = null,
}) {
  try {
    const detailString = typeof details === 'object' ? JSON.stringify(details) : (details || null);
    await prisma.auditLog.create({
      data: {
        userId,
        userEmail,
        userRole,
        action,
        targetEntity,
        targetId: targetId ? String(targetId) : null,
        details: detailString,
        ipAddress,
      },
    });
  } catch (err) {
    console.error('Audit logging error:', err.message);
  }
}

module.exports = {
  logAudit,
};
