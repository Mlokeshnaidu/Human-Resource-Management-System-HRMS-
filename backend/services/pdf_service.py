import io
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet

MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
]

def format_inr(amount) -> str:
    """Format numeric amount into Indian numbering system (Lakhs & Crores) with 2 decimals"""
    if amount is None:
        return "0.00"
    val = f"{float(amount):.2f}"
    parts = val.split(".")
    whole = parts[0]
    dec = parts[1]
    is_neg = whole.startswith("-")
    if is_neg:
        whole = whole[1:]

    if len(whole) <= 3:
        formatted = f"{whole}.{dec}"
    else:
        last3 = whole[-3:]
        remaining = whole[:-3]
        groups = []
        while len(remaining) > 2:
            groups.insert(0, remaining[-2:])
            remaining = remaining[:-2]
        if remaining:
            groups.insert(0, remaining)
        groups.append(last3)
        formatted = f"{','.join(groups)}.{dec}"

    return f"-{formatted}" if is_neg else formatted

def generate_salary_slip_pdf(payroll, employee, user=None) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    normal_style = styles["Normal"]

    month_name = MONTH_NAMES[payroll.month - 1] if 1 <= payroll.month <= 12 else f"Month {payroll.month}"

    elements = []

    # 1. Company Header Banner with Indian Location & Contact
    header_data = [
        [
            Paragraph("<font size=16 color=white><b>TECHFLOW ENTERPRISE HRMS</b></font><br/>"
                      "<font size=8.5 color='#cbd5e1'>Building 12B, Mindspace Cybercity, HITEC City, Hyderabad, Telangana 500081 • hr@techflow.in • +91 40 4910 2000</font>",
                      normal_style)
        ]
    ]
    header_table = Table(header_data, colWidths=[522])
    header_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#0f172a')),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('LEFTPADDING', (0, 0), (-1, -1), 16),
        ('RIGHTPADDING', (0, 0), (-1, -1), 16),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 10))

    # 2. Payslip Title Box
    title_data = [[
        Paragraph(f"<para align=center><font size=11 color='#1e3a8a'><b>SALARY SLIP FOR THE MONTH OF {month_name.upper()} {payroll.year}</b></font></para>", normal_style)
    ]]
    title_table = Table(title_data, colWidths=[522])
    title_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#e0e7ff')),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(title_table)
    elements.append(Spacer(1, 10))

    # 3. Employee Info Grid
    join_str = employee.joiningDate.strftime('%d-%m-%Y') if employee.joiningDate else 'N/A'
    user_email = user.email if user else (employee.user.email if hasattr(employee, 'user') and employee.user else 'N/A')

    emp_info = [
        [
            Paragraph("<b>Employee Code:</b>", normal_style), Paragraph(str(employee.employeeCode), normal_style),
            Paragraph("<b>Designation:</b>", normal_style), Paragraph(str(employee.designation), normal_style)
        ],
        [
            Paragraph("<b>Employee Name:</b>", normal_style), Paragraph(f"{employee.firstName} {employee.lastName}", normal_style),
            Paragraph("<b>Department:</b>", normal_style), Paragraph(str(employee.department), normal_style)
        ],
        [
            Paragraph("<b>Date of Joining:</b>", normal_style), Paragraph(join_str, normal_style),
            Paragraph("<b>Bank Account:</b>", normal_style), Paragraph(str(employee.accountNumber or 'Pending Verification'), normal_style)
        ],
        [
            Paragraph("<b>Email:</b>", normal_style), Paragraph(user_email, normal_style),
            Paragraph("<b>Bank / IFSC:</b>", normal_style), Paragraph(f"{employee.bankName or 'State Bank of India'} / {employee.ifscCode or 'SBIN0001002'}", normal_style)
        ]
    ]
    emp_table = Table(emp_info, colWidths=[100, 161, 100, 161])
    emp_table.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#f1f5f9')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(emp_table)
    elements.append(Spacer(1, 10))

    # 4. Attendance Summary Bar
    att_data = [[
        Paragraph(f"<b>Total Days:</b> {payroll.totalWorkingDays}", normal_style),
        Paragraph(f"<b>Present Days:</b> {payroll.presentDays}", normal_style),
        Paragraph(f"<b>Paid Leaves:</b> {payroll.paidLeaveDays}", normal_style),
        Paragraph(f"<font color='#dc2626'><b>Loss of Pay (LOP):</b> {payroll.lopDays} Days</font>", normal_style)
    ]]
    att_table = Table(att_data, colWidths=[130, 130, 130, 132])
    att_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(att_table)
    elements.append(Spacer(1, 12))

    # 5. Earnings and Deductions Table with Indian Number Formatting
    fin_headers = [
        [
            Paragraph("<b><font color=white>EARNINGS</font></b>", normal_style),
            Paragraph("<para align=right><b><font color=white>AMOUNT (INR)</font></b></para>", normal_style),
            Paragraph("<b><font color=white>DEDUCTIONS</font></b>", normal_style),
            Paragraph("<para align=right><b><font color=white>AMOUNT (INR)</font></b></para>", normal_style),
        ]
    ]

    earnings_rows = [
        ("Base Salary", format_inr(payroll.baseSalary)),
        ("House Rent Allowance (HRA)", format_inr(payroll.hra)),
        ("Special Allowances", format_inr(payroll.allowances)),
        ("Performance Bonus", format_inr(payroll.bonus)),
    ]

    deductions_rows = [
        ("Provident Fund (PF)", format_inr(payroll.pf)),
        ("Income Tax (TDS)", format_inr(payroll.tax)),
        ("Loss of Pay (LOP) Deduction", format_inr(payroll.lopDeduction)),
        ("Other Deductions", format_inr(payroll.otherDeductions)),
    ]

    fin_data = fin_headers
    for i in range(4):
        e_lbl, e_val = earnings_rows[i]
        d_lbl, d_val = deductions_rows[i]
        fin_data.append([
            Paragraph(e_lbl, normal_style), Paragraph(f"<para align=right>{e_val}</para>", normal_style),
            Paragraph(d_lbl, normal_style), Paragraph(f"<para align=right>{d_val}</para>", normal_style),
        ])

    fin_data.append([
        Paragraph("<b>Total Gross Earnings</b>", normal_style), Paragraph(f"<para align=right><b>Rs. {format_inr(payroll.grossSalary)}</b></para>", normal_style),
        Paragraph("<b>Total Deductions</b>", normal_style), Paragraph(f"<para align=right><b>Rs. {format_inr(payroll.totalDeductions)}</b></para>", normal_style),
    ])

    fin_table = Table(fin_data, colWidths=[180, 81, 180, 81])
    fin_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (1, 0), colors.HexColor('#1e293b')),
        ('BACKGROUND', (2, 0), (3, 0), colors.HexColor('#1e293b')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#f1f5f9')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(fin_table)
    elements.append(Spacer(1, 15))

    # 6. Net Salary Callout Box with Indian Rupees
    net_data = [[
        Paragraph("<para align=center><font size=9 color='#15803d'><b>TOTAL NET PAYABLE SALARY</b></font><br/>"
                  f"<font size=18 color='#166534'><b>Rs. {format_inr(payroll.netSalary)}</b></font><br/>"
                  f"<font size=8 color='#64748b'>Payment Method: {payroll.paymentMethod or 'NEFT / DIRECT_BANK_TRANSFER'} • Ref: {payroll.transactionReference or 'AUTO-GENERATED'}</font></para>", normal_style)
    ]]
    net_table = Table(net_data, colWidths=[522])
    net_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f0fdf4')),
        ('BOX', (0, 0), (-1, -1), 1.5, colors.HexColor('#86efac')),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ]))
    elements.append(net_table)
    elements.append(Spacer(1, 20))

    # 7. Signature & Stamp Footer
    sig_data = [
        [
            Paragraph("<font size=8 color='#64748b'>Note: This is a system-generated salary slip authorized by Techflow HRMS India.<br/>No physical signature required.</font>", normal_style),
            Paragraph("<para align=right><font size=8 color='#334155'><b>Authorized Signatory</b><br/>HR & Finance Department</font></para>", normal_style)
        ]
    ]
    sig_table = Table(sig_data, colWidths=[360, 162])
    sig_table.setStyle(TableStyle([
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    elements.append(sig_table)

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()
