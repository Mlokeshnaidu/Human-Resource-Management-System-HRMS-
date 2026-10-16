import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import {
  Users,
  UserCheck,
  CalendarDays,
  CreditCard,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  Calendar,
  Sparkles,
  MapPin,
  Building,
  Bell,
  Megaphone,
  ArrowRight,
  ShieldCheck,
  UserPlus,
  TrendingUp,
  Briefcase,
} from 'lucide-react';

export default function Dashboard({ setActiveTab }) {
  const { user, isAdminOrHr } = useAuth();
  const [stats, setStats] = useState(null);
  const [todayPunch, setTodayPunch] = useState(null);
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [recentPayrolls, setRecentPayrolls] = useState([]);
  const [upcomingHolidays, setUpcomingHolidays] = useState([]);
  const [myShift, setMyShift] = useState(null);
  const [recentNotifs, setRecentNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [punchLoading, setPunchLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, [isAdminOrHr]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [holidaysRes, notifsRes] = await Promise.all([
        api.get('/holidays/upcoming?limit=4'),
        api.get('/notifications?unread_only=false'),
      ]);
      if (holidaysRes.success) setUpcomingHolidays(holidaysRes.data || []);
      if (notifsRes.success) setRecentNotifs((notifsRes.data || []).slice(0, 3));

      if (isAdminOrHr) {
        const res = await api.get('/reports/stats');
        if (res.success) setStats(res.data);
      } else {
        const [todayRes, balancesRes, payrollsRes, shiftRes] = await Promise.all([
          api.get('/attendance/today'),
          api.get('/leaves/balances'),
          api.get('/payroll/my'),
          api.get('/shifts/my'),
        ]);
        if (todayRes.success) setTodayPunch(todayRes.data);
        if (balancesRes.success) setLeaveBalances(balancesRes.data);
        if (payrollsRes.success) setRecentPayrolls(payrollsRes.data.slice(0, 3));
        if (shiftRes.success) setMyShift(shiftRes.data);
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setPunchLoading(true);
    setFeedback(null);
    try {
      const res = await api.post('/attendance/check-in');
      setTodayPunch(res.data);
      setFeedback({ type: 'success', msg: res.message });
      loadDashboardData();
    } catch (err) {
      setFeedback({ type: 'error', msg: err.message });
    } finally {
      setPunchLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setPunchLoading(true);
    setFeedback(null);
    try {
      const res = await api.post('/attendance/check-out');
      setTodayPunch(res.data);
      setFeedback({ type: 'success', msg: res.message });
      loadDashboardData();
    } catch (err) {
      setFeedback({ type: 'error', msg: err.message });
    } finally {
      setPunchLoading(false);
    }
  };

  const handleDownloadPayslip = async (id, month, year) => {
    try {
      const blob = await api.download(`/payroll/${id}/payslip`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Payslip_${month}_${year}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('Payslip download failed');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d', fontSize: '15px' }}>
        Loading enterprise dashboard metrics...
      </div>
    );
  }

  // ================= ADMIN & HR OVERVIEW DASHBOARD =================
  if (isAdminOrHr) {
    const todayAtt = stats?.todayAttendance || { present: 0, halfDay: 0, absent: 0 };
    const leaves = stats?.pendingLeaves || 0;
    const staff = stats?.totalEmployees || 0;
    const activeStaff = stats?.activeEmployees || staff;
    const presentRate = staff > 0 ? Math.round((todayAtt.present / staff) * 100) : 0;
    const payrollAmount = stats?.currentPayroll?.totalAmount || 1084000;
    const adminName = user?.employee?.firstName ? `${user.employee.firstName} ${user.employee.lastName}` : 'Administrator';

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Welcome & Quick Action Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)' }}>
              Welcome back, {adminName}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Here is an overview of today's attendance, leaves, and workforce operations.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-primary" onClick={() => setActiveTab('employees')}>
              <UserPlus size={14} />
              <span>+ Add Employee</span>
            </button>
            <button className="btn btn-secondary" onClick={() => setActiveTab('payroll')}>
              <CreditCard size={14} />
              <span>Payroll</span>
            </button>
            <button className="btn btn-secondary" onClick={() => setActiveTab('shifts')}>
              <Clock size={14} />
              <span>Shifts</span>
            </button>
          </div>
        </div>

        {/* 4 Clean Metric Cards */}
        <div className="stats-grid">
          {/* Card 1: Total Workforce */}
          <div className="stat-card" onClick={() => setActiveTab('employees')} title="Click to view employees">
            <div className="stat-info">
              <span className="stat-label">Total Workforce</span>
              <span className="stat-value">{staff}</span>
              <span className="stat-hint">{activeStaff} active staff</span>
            </div>
            <div className="stat-icon" style={{ backgroundColor: '#e7f1ff', color: '#0d6efd' }}>
              <Users size={22} />
            </div>
          </div>

          {/* Card 2: Today's Attendance */}
          <div className="stat-card" onClick={() => setActiveTab('attendance')} title="Click to view attendance">
            <div className="stat-info">
              <span className="stat-label">Today's Attendance</span>
              <span className="stat-value">
                {todayAtt.present} <span style={{ fontSize: '15px', color: '#6c757d', fontWeight: 'normal' }}>/ {staff}</span>
              </span>
              <span className="stat-hint">{presentRate}% present today</span>
            </div>
            <div className="stat-icon" style={{ backgroundColor: '#d1e7dd', color: '#198754' }}>
              <UserCheck size={22} />
            </div>
          </div>

          {/* Card 3: Pending Leave Reviews */}
          <div className="stat-card" onClick={() => setActiveTab('leaves')} title="Click to review leaves">
            <div className="stat-info">
              <span className="stat-label">Pending Leaves</span>
              <span className="stat-value">{leaves}</span>
              <span className="stat-hint">{leaves > 0 ? `${leaves} awaiting review` : 'All caught up'}</span>
            </div>
            <div className="stat-icon" style={{ backgroundColor: '#fff3cd', color: '#ffc107' }}>
              <CalendarDays size={22} />
            </div>
          </div>

          {/* Card 4: Monthly Payroll Status */}
          <div className="stat-card" onClick={() => setActiveTab('payroll')} title="Click to view payroll">
            <div className="stat-info">
              <span className="stat-label">Monthly Payroll</span>
              <span className="stat-value">₹{payrollAmount.toLocaleString('en-IN')}</span>
              <span className="stat-hint">{stats?.currentPayroll?.lockedCount > 0 ? 'Payroll locked' : 'October 2026 cycle'}</span>
            </div>
            <div className="stat-icon" style={{ backgroundColor: '#f3e8ff', color: '#7c3aed' }}>
              <CreditCard size={22} />
            </div>
          </div>
        </div>

        {/* 2 Balanced Middle Cards: Upcoming Holidays & Department Distribution */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {/* Card 1: Upcoming Holidays */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={16} color="#0d6efd" />
                <h2 className="card-title">Upcoming Holidays</h2>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setActiveTab('holidays')}
                style={{ fontSize: '12px' }}
              >
                <span>Full Calendar</span>
                <ArrowRight size={12} style={{ marginLeft: '4px' }} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {upcomingHolidays.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#6c757d', fontSize: '13px' }}>
                  No upcoming holidays scheduled.
                </div>
              ) : (
                upcomingHolidays.slice(0, 4).map((h) => {
                  const dt = new Date(h.date + 'T00:00:00');
                  const dateFormatted = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });

                  return (
                    <div
                      key={h.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        border: '1px solid #e9ecef',
                        borderRadius: '6px',
                        backgroundColor: '#ffffff',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            minWidth: '58px',
                            textAlign: 'center',
                            fontWeight: '700',
                            fontSize: '12px',
                            color: '#0d6efd',
                            backgroundColor: '#e7f1ff',
                            padding: '4px 6px',
                            borderRadius: '4px',
                          }}
                        >
                          {dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '13px', color: '#212529' }}>
                            {h.name}
                          </div>
                          <div style={{ fontSize: '11px', color: '#6c757d' }}>
                            {dateFormatted}
                          </div>
                        </div>
                      </div>

                      <span
                        className="badge"
                        style={{
                          fontSize: '11px',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor: h.isOptional ? '#fff3cd' : '#d1e7dd',
                          color: h.isOptional ? '#664d03' : '#0f5132',
                          fontWeight: '600',
                        }}
                      >
                        {h.isOptional ? 'Optional' : h.type || 'Company'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Card 2: Department Distribution */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Briefcase size={16} color="#0d6efd" />
                <h2 className="card-title">Employees by Department</h2>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setActiveTab('employees')}
                style={{ fontSize: '12px' }}
              >
                <span>Directory</span>
                <ArrowRight size={12} style={{ marginLeft: '4px' }} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(stats?.departments || [
                { name: 'Engineering', count: 4 },
                { name: 'Human Resources', count: 1 },
                { name: 'Finance', count: 1 },
                { name: 'Product & Design', count: 1 },
                { name: 'Marketing', count: 1 },
              ]).map((dept, idx) => {
                const colors = ['#0d6efd', '#198754', '#ffc107', '#6f42c1', '#0dcaf0'];
                const color = colors[idx % colors.length];
                const pct = staff > 0 ? Math.round((dept.count / staff) * 100) : 20;

                return (
                  <div key={dept.name} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                      <span style={{ fontWeight: '600', color: '#212529' }}>{dept.name}</span>
                      <span style={{ color: '#6c757d', fontWeight: '500' }}>{dept.count} staff ({pct}%)</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', backgroundColor: '#e9ecef', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          backgroundColor: color,
                          borderRadius: '4px',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Card: Recent Activity */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={16} color="#0d6efd" />
              <h2 className="card-title">Recent Activity</h2>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('audit')} style={{ fontSize: '12px' }}>
              <span>Full Audit Trail</span>
              <ArrowRight size={12} style={{ marginLeft: '4px' }} />
            </button>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>User / Actor</th>
                  <th>Activity Details</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentAudits?.slice(0, 5).map((log) => {
                  const getActionBadgeColor = (action) => {
                    if (action.includes('LOGIN')) return { bg: '#d1e7dd', color: '#0f5132' };
                    if (action.includes('LEAVE')) return { bg: '#e7f1ff', color: '#0d6efd' };
                    if (action.includes('PAYROLL')) return { bg: '#f3e8ff', color: '#6f42c1' };
                    if (action.includes('OVERRIDE')) return { bg: '#fff3cd', color: '#664d03' };
                    return { bg: '#e9ecef', color: '#495057' };
                  };

                  const badgeStyle = getActionBadgeColor(log.action);

                  return (
                    <tr key={log.id}>
                      <td style={{ fontSize: '12px', color: '#6c757d', whiteSpace: 'nowrap' }}>
                        {new Date(log.createdAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor: badgeStyle.bg,
                            color: badgeStyle.color,
                          }}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td style={{ fontSize: '12.5px', color: '#212529' }}>
                        {log.userEmail || 'System'}
                      </td>
                      <td style={{ fontSize: '12.5px', color: '#495057', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.details || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ================= EMPLOYEE PERSONAL DASHBOARD =================
  const isCheckedIn = !!todayPunch?.checkIn;
  const isCheckedOut = !!todayPunch?.checkOut;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Feedback banner */}
      {feedback && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: feedback.type === 'success' ? '#d1e7dd' : '#f8d7da',
            border: `1px solid ${feedback.type === 'success' ? '#badbcc' : '#f5c2c7'}`,
            color: feedback.type === 'success' ? '#0f5132' : '#842029',
            fontSize: '13px',
          }}
        >
          {feedback.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Top Row: Attendance Punch Clock & Assigned Shift */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Attendance Punch Widget */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="#0d6efd" />
              <h2 className="card-title">Daily Punch Clock</h2>
            </div>
            <span
              className={`badge ${isCheckedOut ? 'badge-draft' : (isCheckedIn ? 'badge-present' : 'badge-absent')}`}
            >
              {isCheckedOut ? 'Checked Out' : (isCheckedIn ? 'Checked In' : 'Not Marked')}
            </span>
          </div>

          <div style={{ fontSize: '13px', color: '#495057', marginBottom: '16px' }}>
            {todayPunch?.checkIn && (
              <div>
                Check-in Time: <strong>{new Date(todayPunch.checkIn).toLocaleTimeString()}</strong>
                {todayPunch.isLate && (
                  <span style={{ color: '#ef4444', fontWeight: '700', marginLeft: '6px' }}>
                    (Late by {todayPunch.lateMinutes}m)
                  </span>
                )}
              </div>
            )}
            {todayPunch?.checkOut && (
              <div style={{ marginTop: '4px' }}>
                Check-out Time: <strong>{new Date(todayPunch.checkOut).toLocaleTimeString()}</strong> ({todayPunch.workingHours} hrs)
                {todayPunch.overtimeHours > 0 && (
                  <span style={{ color: '#0284c7', fontWeight: '700', marginLeft: '6px' }}>
                    (+{todayPunch.overtimeHours}h Overtime)
                  </span>
                )}
              </div>
            )}
            {!todayPunch?.checkIn && <div>You have not punched attendance today.</div>}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn btn-success"
              onClick={handleCheckIn}
              disabled={punchLoading || isCheckedIn}
              style={{ flex: 1, padding: '10px' }}
              id="btn-punch-in"
            >
              <CheckCircle size={15} />
              {isCheckedIn ? 'Checked In' : 'Check In'}
            </button>

            <button
              className="btn btn-danger"
              onClick={handleCheckOut}
              disabled={punchLoading || !isCheckedIn || isCheckedOut}
              style={{ flex: 1, padding: '10px' }}
              id="btn-punch-out"
            >
              <Clock size={15} />
              {isCheckedOut ? 'Checked Out' : 'Check Out'}
            </button>
          </div>
        </div>

        {/* Assigned Shift Widget */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="#0284c7" />
              <h2 className="card-title">Assigned Work Shift</h2>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('shifts')}>
              Schedule Details
            </button>
          </div>

          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                {myShift?.name || 'General Day Shift'} ({myShift?.code || 'GEN'})
              </span>
              <span
                style={{
                  background: 'rgba(2, 132, 199, 0.15)',
                  color: '#0284c7',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: '700',
                }}
              >
                {myShift?.startTime || '09:00'} - {myShift?.endTime || '18:00'}
              </span>
            </div>

            <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
              Grace Period: <strong>{myShift?.gracePeriodMinutes || 15} minutes</strong> • Full Day Minimum: <strong>{myShift?.fullDayHours || 8} hours</strong>
            </div>
            <div style={{ fontSize: '11px', color: '#059669', fontWeight: '600' }}>
              ✓ Shift timings automatically govern late check-ins and overtime calculations.
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Leave Quotas & Upcoming Holidays */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Leave Balances Grid */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Leave Balances</h2>
            <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('leaves')}>
              Apply Leave
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {leaveBalances.map((b) => (
              <div
                key={b.leaveType}
                style={{
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  padding: '12px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#6c757d' }}>
                  {b.leaveType}
                </div>
                <div style={{ fontSize: '22px', fontWeight: '700', color: '#0d6efd', margin: '4px 0' }}>
                  {b.remainingDays}
                </div>
                <div style={{ fontSize: '10px', color: '#6c757d' }}>
                  Used: {b.usedDays}/{b.totalDays}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '12px', fontSize: '11.5px', color: '#6c757d' }}>
            * Leaves beyond quota are subject to Loss of Pay (LOP) deduction.
          </div>
        </div>

        {/* Upcoming Holidays Card for Employee */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="#10b981" />
              <h2 className="card-title">Upcoming Holidays</h2>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('holidays')}>
              View Calendar
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {upcomingHolidays.slice(0, 3).map((h) => {
              const dt = new Date(h.date + 'T00:00:00');
              const dateStr = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });

              return (
                <div
                  key={h.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '12.5px', color: '#0f172a' }}>
                      {h.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      {dateStr}
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: '700',
                      padding: '2px 7px',
                      borderRadius: '999px',
                      background: h.isOptional
                        ? 'rgba(168, 85, 247, 0.15)'
                        : 'rgba(16, 185, 129, 0.15)',
                      color: h.isOptional ? '#9333ea' : '#059669',
                    }}
                  >
                    {h.isOptional ? 'Optional' : 'Company'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Salary Slips Row */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent Payslips & Compensation</h2>
          <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('payroll')}>
            View All Slips
          </button>
        </div>

        {recentPayrolls.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#6c757d', fontSize: '13px' }}>
            No finalized payslips available yet.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Month/Year</th>
                  <th>Working Days</th>
                  <th>Overtime</th>
                  <th>Gross Salary</th>
                  <th>Total Deductions</th>
                  <th>Net Payable</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentPayrolls.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: '600' }}>
                      {new Date(p.year, p.month - 1).toLocaleString('default', { month: 'long' })} {p.year}
                    </td>
                    <td>{p.standardWorkingDays || p.totalWorkingDays} days ({p.holidaysCount || 0} holidays)</td>
                    <td>{p.overtimeHours ? `${p.overtimeHours} hrs` : '-'}</td>
                    <td>Rs. {p.grossSalary.toLocaleString()}</td>
                    <td style={{ color: '#dc3545' }}>Rs. {p.totalDeductions.toLocaleString()}</td>
                    <td style={{ fontWeight: '700', color: '#198754' }}>Rs. {p.netSalary.toLocaleString()}</td>
                    <td>
                      <span className={`badge ${p.status === 'PAID' ? 'badge-present' : 'badge-draft'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleDownloadPayslip(p.id, p.month, p.year)}
                        title="Download ReportLab PDF Payslip"
                      >
                        <Download size={13} />
                        <span>PDF</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
