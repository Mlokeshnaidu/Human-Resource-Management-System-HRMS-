const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const { authenticate, requireRoles } = require('../middlewares/authMiddleware');

router.use(authenticate);

// Employee operations
router.get('/balances', leaveController.getMyLeaveBalances);
router.post('/apply', leaveController.applyLeave);
router.get('/my', leaveController.getMyLeaves);

// Admin & HR operations
router.get('/', requireRoles('ADMIN', 'HR'), leaveController.getAllLeaves);
router.patch('/:id/review', requireRoles('ADMIN', 'HR'), leaveController.reviewLeaveRequest);

module.exports = router;
