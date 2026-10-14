const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payrollController');
const { authenticate, requireRoles } = require('../middlewares/authMiddleware');

router.use(authenticate);

// Employee operations
router.get('/my', payrollController.getMyPayrolls);
router.get('/:id/payslip', payrollController.downloadPayslipPdf);

// Admin & HR operations
router.get('/', requireRoles('ADMIN', 'HR'), payrollController.getAllPayrolls);
router.post('/generate', requireRoles('ADMIN', 'HR'), payrollController.generatePayroll);
router.patch('/:id/lock', requireRoles('ADMIN', 'HR'), payrollController.lockPayroll);
router.post('/:id/disburse', requireRoles('ADMIN', 'HR'), payrollController.simulateDisbursement);
router.patch('/:id/adjust', requireRoles('ADMIN', 'HR'), payrollController.adjustPayroll);

module.exports = router;
