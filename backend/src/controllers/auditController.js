const prisma = require('../config/prisma');

/**
 * Read-only audit logs for Admin/HR review
 */
async function getAuditLogs(req, res) {
  try {
    const { action, entity, search, limit = 100, page = 1 } = req.query;

    const where = {};
    if (action && action !== 'ALL') {
      where.action = action;
    }
    if (entity && entity !== 'ALL') {
      where.targetEntity = entity;
    }
    if (search) {
      where.OR = [
        { userEmail: { contains: search } },
        { details: { contains: search } },
        { action: { contains: search } },
      ];
    }

    const take = parseInt(limit);
    const skip = (parseInt(page) - 1) * take;

    const [logs, totalCount] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return res.json({
      success: true,
      totalCount,
      page: parseInt(page),
      totalPages: Math.ceil(totalCount / take),
      data: logs,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve audit logs', error: err.message });
  }
}

/**
 * Read email dispatch logs
 */
async function getEmailLogs(req, res) {
  try {
    const logs = await prisma.emailLog.findMany({
      take: 50,
      orderBy: { sentAt: 'desc' },
    });
    return res.json({
      success: true,
      data: logs,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch email logs', error: err.message });
  }
}

module.exports = {
  getAuditLogs,
  getEmailLogs,
};
