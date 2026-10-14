import json
from datetime import datetime
from sqlalchemy.orm import Session
from backend.models import EmailLog, Notification

TEMPLATES = {
    "ONBOARDING": lambda d: {
        "subject": f"Welcome to HRMS Portal, {d.get('name', 'Team Member')}!",
        "html": f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2>Welcome to Techflow HRMS</h2>
                <p>Dear <strong>{d.get('name')}</strong>,</p>
                <p>Your employee profile has been officially created in our Human Resource Management System.</p>
                <p><strong>Employee Code:</strong> {d.get('employeeCode')}<br>
                <strong>Email:</strong> {d.get('email')}<br>
                <strong>Department:</strong> {d.get('department')}<br>
                <strong>Designation:</strong> {d.get('designation')}</p>
            </div>
        """
    },
    "LEAVE_APPLIED": lambda d: {
        "subject": f"Leave Request Submitted: {d.get('name')} ({d.get('leaveType')})",
        "html": f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h3>Leave Application Submitted</h3>
                <p>Employee: {d.get('name')} ({d.get('employeeCode')})</p>
                <p>Type: {d.get('leaveType')} | Duration: {d.get('startDate')} to {d.get('endDate')} ({d.get('totalDays')} days)</p>
                <p>Reason: {d.get('reason')}</p>
            </div>
        """
    },
    "LEAVE_STATUS_UPDATE": lambda d: {
        "subject": f"Leave Request {str(d.get('status')).upper()}: {d.get('leaveType')} ({d.get('startDate')} to {d.get('endDate')})",
        "html": f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h3>Leave Request {d.get('status')}</h3>
                <p>Dear {d.get('name')}, your leave request for {d.get('totalDays')} day(s) from {d.get('startDate')} to {d.get('endDate')} has been {d.get('status')}.</p>
            </div>
        """
    },
    "PAYROLL_PROCESSED": lambda d: {
        "subject": f"Payroll Processed & Salary Slip Generated for {d.get('monthYear')}",
        "html": f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h3>Salary Slip Generated - {d.get('monthYear')}</h3>
                <p>Dear {d.get('name')}, your monthly salary has been processed.</p>
                <p>Gross: ₹{d.get('grossSalary')} | Deductions: ₹{d.get('totalDeductions')} | Net: ₹{d.get('netSalary')}</p>
            </div>
        """
    }
}

def send_notification_email(
    db: Session,
    to: str,
    email_type: str,
    data: dict,
    user_id: str = None
):
    try:
        template_fn = TEMPLATES.get(email_type)
        if template_fn:
            rendered = template_fn(data)
            subject = rendered["subject"]
            html_body = rendered["html"]
        else:
            subject = f"HRMS Notification: {email_type}"
            html_body = f"<p>{json.dumps(data)}</p>"

        # 1. Log to EmailLog table
        email_log = EmailLog(
            to=to,
            subject=subject,
            template=email_type,
            payload=json.dumps(data),
            status="SENT"
        )
        db.add(email_log)

        # 2. In-app notification if user_id is provided
        if user_id:
            notif = Notification(
                userId=user_id,
                title=subject,
                message=f"Status update for {email_type.replace('_', ' ').lower()}",
                type=email_type,
                isRead=False
            )
            db.add(notif)

        db.commit()
        print(f"[Email Service] Sent template email '{email_type}' to {to}")
    except Exception as e:
        print(f"[Email Service Error]: {e}")
        db.rollback()
