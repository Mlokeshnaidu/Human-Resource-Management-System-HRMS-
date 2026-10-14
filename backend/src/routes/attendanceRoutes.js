const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticate, requireRoles } = require('../middlewares/authMiddleware');

router.use(authenticate);

// Employee attendance operations
router.post('/check-in', attendanceController.checkIn);
router.post('/check-out', attendanceController.checkOut);
router.get('/today', attendanceController.getTodayStatus);
router.get('/my', attendanceController.getMyAttendance);

// Admin & HR operations
router.get('/', requireRoles('ADMIN', 'HR'), attendanceController.getAllAttendance);
router.post('/override', requireRoles('ADMIN', 'HR'), attendanceController.overrideAttendance);

module.exports = router;
