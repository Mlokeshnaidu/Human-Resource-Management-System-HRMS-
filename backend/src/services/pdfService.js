const PDFDocument = require('pdfkit');

/**
 * Generate a professional salary slip PDF using PDFKit
 */
function generateSalarySlipPdf(payroll, dataStream) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      doc.pipe(dataStream);

      const employee = payroll.employee;
      const user = employee.user || {};
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const monthStr = monthNames[payroll.month - 1] || `Month ${payroll.month}`;

      // Primary theme colors
      const primaryColor = '#1e3a8a'; // Deep Navy
      const secondaryColor = '#3b82f6';
      const textColor = '#1f2937';
      const grayColor = '#6b7280';
      const lightBg = '#f3f4f6';

      // 1. Company Header
      doc.rect(40, 40, 515, 60).fill('#0f172a');
      doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold')
        .text('TECHFLOW ENTERPRISE HRMS', 55, 52);
      doc.fontSize(10).font('Helvetica')
        .text('100 Innovation Boulevard, Silicon Valley • hr@techflow.io • +1 (800) 555-0199', 55, 78);

      // 2. Payslip Title Box
      doc.rect(40, 110, 515, 30).fill('#e0e7ff');
      doc.fillColor(primaryColor).fontSize(13).font('Helvetica-Bold')
        .text(`SALARY SLIP FOR THE MONTH OF ${monthStr.toUpperCase()} ${payroll.year}`, 40, 119, { align: 'center', width: 515 });

      // 3. Employee Info Grid
      doc.rect(40, 150, 515, 95).lineWidth(1).strokeColor('#e5e7eb').stroke();

      const startY = 158;
      const col1 = 55;
      const val1 = 160;
      const col2 = 310;
      const val2 = 420;
      const lineH = 18;

      doc.fillColor(grayColor).fontSize(9).font('Helvetica');
      doc.text('Employee Code:', col1, startY);
      doc.fillColor(textColor).font('Helvetica-Bold').text(employee.employeeCode || 'N/A', val1, startY);

      doc.fillColor(grayColor).font('Helvetica').text('Designation:', col2, startY);
      doc.fillColor(textColor).font('Helvetica-Bold').text(employee.designation || 'N/A', val2, startY);

      doc.fillColor(grayColor).font('Helvetica').text('Employee Name:', col1, startY + lineH);
      doc.fillColor(textColor).font('Helvetica-Bold').text(`${employee.firstName} ${employee.lastName}`, val1, startY + lineH);

      doc.fillColor(grayColor).font('Helvetica').text('Department:', col2, startY + lineH);
      doc.fillColor(textColor).font('Helvetica-Bold').text(employee.department || 'N/A', val2, startY + lineH);

      doc.fillColor(grayColor).font('Helvetica').text('Date of Joining:', col1, startY + lineH * 2);
      const joinDateStr = employee.joiningDate ? new Date(employee.joiningDate).toISOString().split('T')[0] : 'N/A';
      doc.fillColor(textColor).font('Helvetica-Bold').text(joinDateStr, val1, startY + lineH * 2);

      doc.fillColor(grayColor).font('Helvetica').text('Bank Account:', col2, startY + lineH * 2);
      doc.fillColor(textColor).font('Helvetica-Bold').text(employee.accountNumber || 'Pending Verification', val2, startY + lineH * 2);

      doc.fillColor(grayColor).font('Helvetica').text('Email:', col1, startY + lineH * 3);
      doc.fillColor(textColor).font('Helvetica-Bold').text(user.email || 'N/A', val1, startY + lineH * 3);

      doc.fillColor(grayColor).font('Helvetica').text('Bank / IFSC:', col2, startY + lineH * 3);
      doc.fillColor(textColor).font('Helvetica-Bold').text(`${employee.bankName || 'HDFC Bank'} / ${employee.ifscCode || 'HDFC0001234'}`, val2, startY + lineH * 3);

      // 4. Attendance Summary Bar
      doc.rect(40, 255, 515, 25).fill('#f8fafc');
      doc.fillColor('#334155').fontSize(9).font('Helvetica-Bold');
      doc.text(`Total Days: ${payroll.totalWorkingDays}`, 55, 263);
      doc.text(`Present Days: ${payroll.presentDays}`, 180, 263);
      doc.text(`Paid Leaves: ${payroll.paidLeaveDays}`, 305, 263);
      doc.fillColor('#dc2626').text(`Loss of Pay (LOP): ${payroll.lopDays} Days`, 420, 263);

      // 5. Earnings and Deductions Table
      const tableTop = 295;
      const halfW = 252;

      // Earnings Header
      doc.rect(40, tableTop, halfW, 24).fill('#1e293b');
      doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold')
        .text('EARNINGS', 55, tableTop + 7)
        .text('AMOUNT (₹)', 210, tableTop + 7, { align: 'right', width: 70 });

      // Deductions Header
      doc.rect(40 + halfW + 11, tableTop, halfW, 24).fill('#1e293b');
      doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold')
        .text('DEDUCTIONS', 315, tableTop + 7)
        .text('AMOUNT (₹)', 470, tableTop + 7, { align: 'right', width: 70 });

      // Items
      const earnings = [
        { label: 'Basic Salary', amount: payroll.baseSalary },
        { label: 'House Rent Allowance (HRA)', amount: payroll.hra },
        { label: 'Special / Other Allowances', amount: payroll.allowances },
        { label: 'Performance Bonus / Incentive', amount: payroll.bonus || 0 },
      ];

      const deductions = [
        { label: 'Provident Fund (PF)', amount: payroll.pf },
        { label: 'Tax Deducted at Source (TDS)', amount: payroll.tax },
        { label: `Loss of Pay (LOP - ${payroll.lopDays}d)`, amount: payroll.lopDeduction },
        { label: 'Other Statutory Deductions', amount: payroll.otherDeductions || 0 },
      ];

      let rowY = tableTop + 24;
      for (let i = 0; i < Math.max(earnings.length, deductions.length); i++) {
        const bg = i % 2 === 0 ? '#ffffff' : '#f9fafb';
        doc.rect(40, rowY, halfW, 22).fill(bg);
        doc.rect(40 + halfW + 11, rowY, halfW, 22).fill(bg);

        // Earnings item
        if (earnings[i]) {
          doc.fillColor(textColor).fontSize(9).font('Helvetica').text(earnings[i].label, 50, rowY + 6);
          doc.font('Helvetica-Bold').text(Number(earnings[i].amount).toLocaleString('en-IN', { minimumFractionDigits: 2 }), 210, rowY + 6, { align: 'right', width: 70 });
        }

        // Deductions item
        if (deductions[i]) {
          doc.fillColor(textColor).fontSize(9).font('Helvetica').text(deductions[i].label, 310, rowY + 6);
          doc.font('Helvetica-Bold').text(Number(deductions[i].amount).toLocaleString('en-IN', { minimumFractionDigits: 2 }), 470, rowY + 6, { align: 'right', width: 70 });
        }

        rowY += 22;
      }

      // Total row
      doc.rect(40, rowY, halfW, 26).fill('#e2e8f0');
      doc.rect(40 + halfW + 11, rowY, halfW, 26).fill('#e2e8f0');
      doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold');
      doc.text('TOTAL GROSS EARNINGS', 50, rowY + 8);
      doc.text(`₹ ${Number(payroll.grossSalary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 200, rowY + 8, { align: 'right', width: 80 });

      doc.text('TOTAL DEDUCTIONS', 310, rowY + 8);
      doc.text(`₹ ${Number(payroll.totalDeductions).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 460, rowY + 8, { align: 'right', width: 80 });

      rowY += 35;

      // 6. Net Disbursed Box
      doc.rect(40, rowY, 515, 55).fill('#ecfdf5').strokeColor('#10b981').lineWidth(1.5).stroke();
      doc.fillColor('#065f46').fontSize(11).font('Helvetica-Bold').text('NET PAYABLE SALARY', 55, rowY + 14);
      doc.fontSize(18).text(`₹ ${Number(payroll.netSalary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 55, rowY + 30);
      
      doc.fontSize(9).font('Helvetica').fillColor('#047857')
        .text(`Status: ${payroll.status} | Disbursement Mode: ${payroll.paymentMethod || 'Bank Transfer'}`, 310, rowY + 16)
        .text(`Txn Ref: ${payroll.transactionReference || 'SIM-PAY-' + payroll.id.slice(0, 8)}`, 310, rowY + 32);

      // 7. Signature & Footer
      const footerY = 560;
      doc.rect(40, footerY, 515, 80).strokeColor('#e2e8f0').lineWidth(1).stroke();

      doc.fillColor(grayColor).fontSize(8).font('Helvetica')
        .text('Remarks / Notes:', 55, footerY + 10)
        .text(payroll.remarks || 'This is a computer-generated salary slip and requires no physical signature under IT Act 2000.', 55, footerY + 22, { width: 300 });

      doc.text('Authorized Signatory', 410, footerY + 50, { align: 'center', width: 120 });
      doc.moveTo(410, footerY + 45).lineTo(530, footerY + 45).strokeColor('#94a3b8').stroke();
      doc.font('Helvetica-Bold').fillColor('#0f172a').text('TECHFLOW HRMS DEPT', 410, footerY + 62, { align: 'center', width: 120 });

      // Confidential notice
      doc.fillColor('#94a3b8').fontSize(7).font('Helvetica')
        .text('CONFIDENTIAL - For recipient use only. Techflow HRMS Automated Generation System.', 40, 660, { align: 'center', width: 515 });

      doc.end();
      dataStream.on('finish', () => resolve(true));
      dataStream.on('error', (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generateSalarySlipPdf,
};
