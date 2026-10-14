const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { authenticate, requireRoles } = require('../middlewares/authMiddleware');

router.use(authenticate);

// Read-only audit access restricted to Admin and HR
router.get('/', requireRoles('ADMIN', 'HR'), auditController.getAuditLogs);
router.get('/emails', requireRoles('ADMIN', 'HR'), auditController.getEmailLogs);

module.exports = router;
