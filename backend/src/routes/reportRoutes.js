const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate, requireRoles } = require('../middlewares/authMiddleware');

router.use(authenticate);

// Reports are accessible to Admin and HR
router.get('/stats', requireRoles('ADMIN', 'HR'), reportController.getDashboardStats);
router.get('/attendance', requireRoles('ADMIN', 'HR'), reportController.getAttendanceReport);
router.get('/leave', requireRoles('ADMIN', 'HR'), reportController.getLeaveReport);
router.get('/payroll', requireRoles('ADMIN', 'HR'), reportController.getPayrollReport);
router.get('/export/csv', requireRoles('ADMIN', 'HR'), reportController.exportCsv);
router.get('/export/pdf', requireRoles('ADMIN', 'HR'), reportController.exportPdf);

module.exports = router;
