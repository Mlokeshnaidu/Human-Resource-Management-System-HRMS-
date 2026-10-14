const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { authenticate, requireRoles } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// All employee routes require authentication
router.use(authenticate);

// List employees (Admin, HR)
router.get('/', requireRoles('ADMIN', 'HR'), employeeController.getAllEmployees);

// View specific employee
router.get('/:id', employeeController.getEmployeeById);

// Create employee (Admin, HR)
router.post('/', requireRoles('ADMIN', 'HR'), employeeController.createEmployee);

// Update employee (Admin, HR)
router.put('/:id', requireRoles('ADMIN', 'HR'), employeeController.updateEmployee);

// Activate / Deactivate employee (Admin, HR)
router.patch('/:id/status', requireRoles('ADMIN', 'HR'), employeeController.toggleEmployeeStatus);

// Upload document
router.post('/:id/documents', upload.single('file'), employeeController.uploadDocument);

// Delete document
router.delete('/documents/:documentId', requireRoles('ADMIN', 'HR'), employeeController.deleteDocument);

// Download document
router.get('/documents/:documentId/download', employeeController.downloadDocument);

module.exports = router;
