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
} from 'lucide-react';

export default function Dashboard({ setActiveTab }) {
  const { user, isAdminOrHr } = useAuth();
  const [stats, setStats] = useState(null);
  const [todayPunch, setTodayPunch] = useState(null);
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [recentPayrolls, setRecentPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [punchLoading, setPunchLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, [isAdminOrHr]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      if (isAdminOrHr) {
        const res = await api.get('/reports/stats');
        if (res.success) setStats(res.data);
      } else {
        const [todayRes, balancesRes, payrollsRes] = await Promise.all([
          api.get('/attendance/today'),
          api.get('/leaves/balances'),
          api.get('/payroll/my'),
        ]);
        if (todayRes.success) setTodayPunch(todayRes.data);
        if (balancesRes.success) setLeaveBalances(balancesRes.data);
        if (payrollsRes.success) setRecentPayrolls(payrollsRes.data.slice(0, 3));
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
      alert(`Download failed: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '30px', textAlign: 'center', color: '#6c757d' }}>
        Loading dashboard data...
      </div>
    );
  }

  // ================= ADMIN & HR DASHBOARD =================
  if (isAdminOrHr) {
    return (
      <div>
        {/* Metric Cards Row */}
        <div className="grid-metrics">
          <div className="metric-card" style={{ '--metric-color': '#0d6efd' }}>
            <div className="metric-info">
              <h3>Total Employees</h3>
              <div className="metric-value">{stats?.totalEmployees || 0}</div>
              <div className="metric-sub">{stats?.activeEmployees || 0} Active Staff</div>
            </div>
            <div className="metric-icon-box">
              <Users size={20} />
            </div>
          </div>

          <div className="metric-card" style={{ '--metric-color': '#198754' }}>
            <div className="metric-info">
              <h3>Present Today</h3>
              <div className="metric-value">{stats?.todayAttendance?.present || 0}</div>
              <div className="metric-sub">
                {stats?.todayAttendance?.halfDay || 0} Half-day • {stats?.todayAttendance?.absent || 0} Absent
              </div>
            </div>
            <div className="metric-icon-box">
              <UserCheck size={20} />
            </div>
          </div>

          <div className="metric-card" style={{ '--metric-color': '#ffc107' }}>
            <div className="metric-info">
              <h3>Pending Leaves</h3>
              <div className="metric-value">{stats?.pendingLeaves || 0}</div>
              <div className="metric-sub">Awaiting Approval</div>
            </div>
            <div className="metric-icon-box">
              <CalendarDays size={20} />
            </div>
          </div>

          <div className="metric-card" style={{ '--metric-color': '#0dcaf0' }}>
            <div className="metric-info">
              <h3>Monthly Payroll</h3>
              <div className="metric-value">₹{Number(stats?.currentPayroll?.totalAmount || 0).toLocaleString('en-IN')}</div>
              <div className="metric-sub">
                {stats?.currentPayroll?.lockedCount || 0} Locked • Month {stats?.currentPayroll?.month}
              </div>
            </div>
            <div className="metric-icon-box">
              <CreditCard size={20} />
            </div>
          </div>
        </div>

        {/* Quick Links & Departments Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Quick Actions</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                className="btn btn-secondary"
                style={{ justifyContent: 'flex-start', padding: '10px 14px' }}
                onClick={() => setActiveTab('employees')}
                id="quick-onboard-btn"
              >
                <Users size={16} color="#0d6efd" />
                <span>Manage Employees</span>
              </button>

              <button
                className="btn btn-secondary"
                style={{ justifyContent: 'flex-start', padding: '10px 14px' }}
                onClick={() => setActiveTab('leaves')}
                id="quick-leaves-btn"
              >
                <CalendarDays size={16} color="#ffc107" />
                <span>Review Leaves ({stats?.pendingLeaves || 0})</span>
              </button>

              <button
                className="btn btn-secondary"
                style={{ justifyContent: 'flex-start', padding: '10px 14px' }}
                onClick={() => setActiveTab('payroll')}
                id="quick-payroll-btn"
              >
                <CreditCard size={16} color="#198754" />
                <span>Process Payroll</span>
              </button>

              <button
                className="btn btn-secondary"
                style={{ justifyContent: 'flex-start', padding: '10px 14px' }}
                onClick={() => setActiveTab('reports')}
                id="quick-reports-btn"
              >
                <Clock size={16} color="#0dcaf0" />
                <span>View Reports</span>
              </button>
            </div>
          </div>

          {/* Department Distribution */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Department Summary</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {stats?.departments?.map((dept) => {
                const percentage = Math.round((dept.count / (stats.totalEmployees || 1)) * 100);
                return (
                  <div key={dept.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '3px' }}>
                      <span style={{ fontWeight: '600' }}>{dept.name}</span>
                      <span style={{ color: '#6c757d' }}>{dept.count} ({percentage}%)</span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: '#e9ecef', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: '#0d6efd' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Audit Activities */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recent Activity Logs</h2>
            <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('audit')}>
              View All Logs
            </button>
          </div>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>User</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentAudits?.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '12px', color: '#6c757d', whiteSpace: 'nowrap' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td>
                      <span className="badge badge-active">{log.action}</span>
                    </td>
                    <td style={{ fontWeight: '600' }}>{log.targetEntity}</td>
                    <td style={{ fontSize: '12px', color: '#6c757d' }}>{log.userEmail || 'System'}</td>
                    <td style={{ fontSize: '12px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.details || '-'}
                    </td>
                  </tr>
                ))}
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
    <div>
      {/* Feedback banner */}
      {feedback && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '4px',
            marginBottom: '16px',
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

      {/* Top Row: Attendance & Leave Balances */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Attendance Widget */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Daily Attendance</h2>
            <span
              className={`badge ${isCheckedOut ? 'badge-draft' : (isCheckedIn ? 'badge-present' : 'badge-absent')}`}
            >
              {isCheckedOut ? 'Checked Out' : (isCheckedIn ? 'Checked In' : 'Not Marked')}
            </span>
          </div>

          <div style={{ fontSize: '13px', color: '#495057', marginBottom: '16px' }}>
            {todayPunch?.checkIn && (
              <div>Check-in Time: <strong>{new Date(todayPunch.checkIn).toLocaleTimeString()}</strong></div>
            )}
            {todayPunch?.checkOut && (
              <div style={{ marginTop: '4px' }}>Check-out Time: <strong>{new Date(todayPunch.checkOut).toLocaleTimeString()}</strong> ({todayPunch.workingHours} hrs)</div>
            )}
            {!todayPunch?.checkIn && <div>You have not marked attendance today.</div>}
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
      </div>

      {/* Recent Salary Slips Row */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent Payslips</h2>
          <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('payroll')}>
            View All Slips
          </button>
        </div>

        {recentPayrolls.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#6c757d', fontSize: '13px' }}>
            No finalized salary slips generated yet.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Gross Salary</th>
                  <th>Deductions</th>
                  <th>Net Salary</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentPayrolls.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: '600' }}>
                      Month {p.month}, {p.year}
                    </td>
                    <td>₹{Number(p.grossSalary).toLocaleString('en-IN')}</td>
                    <td style={{ color: '#dc3545' }}>₹{Number(p.totalDeductions).toLocaleString('en-IN')}</td>
                    <td style={{ fontWeight: '700', color: '#198754' }}>
                      ₹{Number(p.netSalary).toLocaleString('en-IN')}
                    </td>
                    <td>
                      <span className="badge badge-paid">{p.status}</span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleDownloadPayslip(p.id, p.month, p.year)}
                        id={`btn-download-slip-${p.id}`}
                      >
                        <Download size={13} /> Download PDF
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
