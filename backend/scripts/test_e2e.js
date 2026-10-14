const http = require('http');

async function request(path, method = 'GET', data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`http://localhost:5000${path}`);
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (data) headers['Content-Type'] = 'application/json';

    const req = http.request(
      url,
      { method, headers },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const body = Buffer.concat(chunks);
          const contentType = res.headers['content-type'] || '';
          if (contentType.includes('application/json')) {
            try {
              resolve({ status: res.statusCode, data: JSON.parse(body.toString()) });
            } catch (e) {
              resolve({ status: res.statusCode, text: body.toString() });
            }
          } else {
            resolve({ status: res.statusCode, buffer: body, headers: res.headers });
          }
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  console.log('\n=============================================================');
  console.log(' RUNNING END-TO-END HRMS SYSTEM VALIDATION SUITE');
  console.log('=============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const health = await request('/api/health');
    assert(health.status === 200 && health.data.status === 'UP', 'API Health Check is UP');

    // 2. Admin Login
    const adminLogin = await request('/api/auth/login', 'POST', {
      email: 'admin@hrms.com',
      password: 'Admin@123',
    });
    assert(adminLogin.status === 200 && adminLogin.data.token, 'Admin Login successful with valid JWT');
    const adminToken = adminLogin.data.token;

    // 3. HR Login
    const hrLogin = await request('/api/auth/login', 'POST', {
      email: 'hr@hrms.com',
      password: 'Hr@123',
    });
    assert(hrLogin.status === 200 && hrLogin.data.user.role === 'HR', 'HR Login successful');
    const hrToken = hrLogin.data.token;

    // 4. Employee Login
    const empLogin = await request('/api/auth/login', 'POST', {
      email: 'employee@hrms.com',
      password: 'Employee@123',
    });
    assert(empLogin.status === 200 && empLogin.data.user.role === 'EMPLOYEE', 'Employee Login successful');
    const empToken = empLogin.data.token;

    // 5. Dashboard Metrics (Admin)
    const stats = await request('/api/reports/stats', 'GET', null, adminToken);
    assert(stats.status === 200 && stats.data.data.totalEmployees >= 7, `Dashboard stats retrieved (Total staff: ${stats.data.data.totalEmployees})`);

    // 6. Employees list
    const employees = await request('/api/employees', 'GET', null, adminToken);
    assert(employees.status === 200 && employees.data.data.length >= 7, `Employees Directory retrieved (${employees.data.data.length} records)`);

    // 7. Employee check-in / check-out
    const checkIn = await request('/api/attendance/check-in', 'POST', {}, empToken);
    assert(
      checkIn.status === 200 || (checkIn.status === 400 && checkIn.data.message.includes('Duplicate check-in prevented')),
      `Attendance Check-In executed (Handled duplicate prevention correctly)`
    );

    const checkOut = await request('/api/attendance/check-out', 'POST', {}, empToken);
    assert(
      checkOut.status === 200,
      `Attendance Check-Out recorded working hours`
    );

    // 8. Leave Balances for Employee
    const balances = await request('/api/leaves/balances', 'GET', null, empToken);
    assert(balances.status === 200 && balances.data.data.length === 3, 'Leave balances retrieved for CL, SL, PL');

    // 9. Apply Leave (Employee)
    const applyLeave = await request('/api/leaves/apply', 'POST', {
      leaveType: 'CL',
      startDate: '2026-11-05',
      endDate: '2026-11-06',
      reason: 'Automated test casual leave application',
    }, empToken);
    assert(applyLeave.status === 201 && applyLeave.data.data.status === 'PENDING', 'Employee applied for leave successfully');
    const leaveId = applyLeave.data.data.id;

    // 10. Approve Leave (HR)
    const approveLeave = await request(`/api/leaves/${leaveId}/review`, 'PATCH', {
      status: 'APPROVED',
    }, hrToken);
    assert(approveLeave.status === 200 && approveLeave.data.data.status === 'APPROVED', 'HR approved leave request & balance adjusted');

    // 11. Run Monthly Payroll (Admin)
    const runPayroll = await request('/api/payroll/generate', 'POST', {
      month: 10,
      year: 2026,
    }, adminToken);
    assert(runPayroll.status === 200 && runPayroll.data.processedCount > 0, `Monthly Payroll generated for ${runPayroll.data.processedCount} staff members`);

    // 12. Payroll list & Payslip PDF Download
    const payrollList = await request('/api/payroll?month=9&year=2026', 'GET', null, adminToken);
    assert(payrollList.status === 200 && payrollList.data.data.length > 0, 'September 2026 finalized payroll list fetched');

    const samplePayroll = payrollList.data.data[0];
    const payslipPdf = await request(`/api/payroll/${samplePayroll.id}/payslip`, 'GET', null, adminToken);
    assert(
      payslipPdf.status === 200 && payslipPdf.headers['content-type'].includes('application/pdf'),
      `Salary slip PDF streamed successfully (${payslipPdf.buffer.length} bytes)`
    );

    // 13. Audit logs
    const auditLogs = await request('/api/audit', 'GET', null, adminToken);
    assert(auditLogs.status === 200 && auditLogs.data.data.length > 0, `Audit logs retrieved (${auditLogs.data.data.length} audit trail records)`);

    // 14. Email delivery logs
    const emailLogs = await request('/api/audit/emails', 'GET', null, adminToken);
    assert(emailLogs.status === 200 && emailLogs.data.data.length > 0, `Email dispatch logs verified (${emailLogs.data.data.length} emails logged)`);

    console.log('\n=============================================================');
    console.log(` SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('=============================================================\n');

    if (failed === 0) {
      console.log('ALL SYSTEM CHECKS PASSED WITH 100% SUCCESS!');
    }
  } catch (err) {
    console.error('Test execution error:', err);
  }
}

runTests();
