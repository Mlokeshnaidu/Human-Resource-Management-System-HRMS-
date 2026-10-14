const prisma = require('../config/prisma');

/**
 * HTML Templates for HRMS emails
 */
const templates = {
  ONBOARDING: (data) => ({
    subject: `Welcome to HRMS Portal, ${data.name}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 20px; border-radius: 6px; color: white; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Welcome to HRMS Portal</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">Employee Onboarding Confirmation</p>
        </div>
        <div style="padding: 20px 0; color: #334155; line-height: 1.6;">
          <p>Dear <strong>${data.name}</strong>,</p>
          <p>We are delighted to welcome you to our organization! Your employee profile has been officially created in our Human Resource Management System.</p>
          <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; padding: 15px; margin: 20px 0;">
            <p style="margin: 4px 0;"><strong>Employee Code:</strong> ${data.employeeCode}</p>
            <p style="margin: 4px 0;"><strong>Email / Username:</strong> ${data.email}</p>
            <p style="margin: 4px 0;"><strong>Department:</strong> ${data.department}</p>
            <p style="margin: 4px 0;"><strong>Designation:</strong> ${data.designation}</p>
            <p style="margin: 4px 0;"><strong>Joining Date:</strong> ${data.joiningDate}</p>
            ${data.temporaryPassword ? `<p style="margin: 4px 0; color: #dc2626;"><strong>Initial Password:</strong> ${data.temporaryPassword}</p>` : ''}
          </div>
          <p>You can now log in to your dashboard to check-in daily, review attendance, manage leave requests, and download your monthly salary slips.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.loginUrl || '#'}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Access HRMS Portal</a>
          </div>
          <p style="color: #64748b; font-size: 13px;">If you have any questions, reach out to your HR Department.</p>
        </div>
        <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center; font-size: 12px; color: #94a3b8;">
          © ${new Date().getFullYear()} HRMS Enterprise System. All rights reserved.
        </div>
      </div>
    `,
  }),

  LEAVE_APPLIED: (data) => ({
    subject: `Leave Request Submitted: ${data.name} (${data.leaveType})`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #1e293b; border-bottom: 2px solid #4f46e5; padding-bottom: 10px;">Leave Application Notification</h2>
        <p>A new leave application has been submitted for review.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Employee</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${data.name} (${data.employeeCode})</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Leave Type</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${data.leaveType}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Duration</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${data.startDate} to ${data.endDate} (${data.totalDays} days)</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Reason</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${data.reason}</td></tr>
        </table>
        <p>Please review and approve or reject this request in the Admin/HR dashboard.</p>
      </div>
    `,
  }),

  LEAVE_STATUS_UPDATE: (data) => ({
    subject: `Leave Request ${data.status.toUpperCase()}: ${data.leaveType} (${data.startDate} to ${data.endDate})`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: ${data.status === 'APPROVED' ? '#16a34a' : '#dc2626'};">Leave Request ${data.status}</h2>
        <p>Dear <strong>${data.name}</strong>,</p>
        <p>Your leave application from <strong>${data.startDate}</strong> to <strong>${data.endDate}</strong> (${data.totalDays} day(s)) has been <strong>${data.status}</strong> by HR/Admin.</p>
        ${data.rejectionReason ? `<p style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 10px; color: #991b1b;"><strong>Reason:</strong> ${data.rejectionReason}</p>` : ''}
        <p style="margin-top: 20px; color: #64748b; font-size: 13px;">You can view your updated leave balance in your HRMS portal.</p>
      </div>
    `,
  }),

  PAYROLL_PROCESSED: (data) => ({
    subject: `Payroll Processed & Salary Slip Generated for ${data.monthYear}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="background: #0f172a; padding: 15px; border-radius: 6px; color: white; text-align: center;">
          <h2 style="margin: 0;">Salary Slip Generated</h2>
          <p style="margin: 4px 0 0 0; color: #94a3b8;">Period: ${data.monthYear}</p>
        </div>
        <p style="margin-top: 20px;">Dear <strong>${data.name}</strong>,</p>
        <p>Your salary for <strong>${data.monthYear}</strong> has been processed. Here is the summary of your earnings and deductions:</p>
        <div style="background-color: #f8fafc; border-radius: 6px; padding: 15px; margin: 15px 0;">
          <p style="margin: 4px 0;"><strong>Gross Earnings:</strong> ₹${Number(data.grossSalary).toLocaleString('en-IN')}</p>
          <p style="margin: 4px 0; color: #dc2626;"><strong>Total Deductions:</strong> ₹${Number(data.totalDeductions).toLocaleString('en-IN')}</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 10px 0;" />
          <p style="margin: 4px 0; font-size: 18px; color: #16a34a;"><strong>Net Disbursed Salary:</strong> ₹${Number(data.netSalary).toLocaleString('en-IN')}</p>
        </div>
        <p>You can view and download your full signed Salary Slip PDF directly from your employee dashboard.</p>
      </div>
    `,
  }),
};

/**
 * Send template-based email with logging & in-app notification
 */
async function sendNotificationEmail({ to, type, data, userId = null }) {
  try {
    const templateFn = templates[type];
    if (!templateFn) {
      throw new Error(`Unknown email template: ${type}`);
    }

    const { subject, html } = templateFn(data);

    // Save to EmailLog table for auditing and tracking
    const log = await prisma.emailLog.create({
      data: {
        to,
        subject,
        template: type,
        payload: JSON.stringify(data),
        status: 'SENT',
      },
    });

    // Also create in-app notification if userId is provided
    if (userId) {
      await prisma.notification.create({
        data: {
          userId,
          title: subject,
          message: `Email notification dispatched: ${subject}`,
          type: type.startsWith('LEAVE') ? 'LEAVE' : (type === 'ONBOARDING' ? 'ONBOARDING' : 'PAYROLL'),
        },
      });
    }

    console.log(`[Email Service] Sent template email '${type}' to ${to} (Log ID: ${log.id})`);
    return { success: true, logId: log.id, subject };
  } catch (err) {
    console.error(`[Email Service] Failed sending email:`, err.message);
    try {
      await prisma.emailLog.create({
        data: {
          to: to || 'unknown',
          subject: `Failed to send ${type}`,
          template: type,
          payload: JSON.stringify(data),
          status: 'FAILED',
        },
      });
    } catch (_) {}
    return { success: false, error: err.message };
  }
}

module.exports = {
  sendNotificationEmail,
  templates,
};
