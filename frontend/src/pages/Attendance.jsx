import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import {
  CalendarCheck,
  Clock,
  CheckCircle,
  AlertCircle,
  Edit3,
  Filter,
  Check,
  X,
  ShieldAlert,
} from 'lucide-react';

export default function Attendance() {
  const { user, isAdminOrHr } = useAuth();
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [todayPunch, setTodayPunch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // Filters
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [department, setDepartment] = useState('ALL');

  // Override Modal State
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideData, setOverrideData] = useState({
    employeeId: '',
    employeeName: '',
    date: '',
    status: 'PRESENT',
    workingHours: 8.5,
    overrideReason: '',
    notes: '',
  });

  useEffect(() => {
    fetchAttendance();
  }, [month, year, department, isAdminOrHr]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      if (isAdminOrHr) {
        let q = `?month=${month}&year=${year}`;
        if (department !== 'ALL') q += `&department=${department}`;
        const res = await api.get(`/attendance${q}`);
        if (res.success) {
          setRecords(res.data);
        }
      } else {
        const [myRes, todayRes] = await Promise.all([
          api.get(`/attendance/my?month=${month}&year=${year}`),
          api.get('/attendance/today'),
        ]);
        if (myRes.success) {
          setRecords(myRes.records);
          setSummary(myRes.summary);
        }
        if (todayRes.success) {
          setTodayPunch(todayRes.data);
        }
      }
    } catch (err) {
      console.error('Fetch attendance error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setFeedback(null);
    try {
      const res = await api.post('/attendance/check-in');
      setTodayPunch(res.data);
      setFeedback({ type: 'success', msg: res.message });
      fetchAttendance();
    } catch (err) {
      setFeedback({ type: 'error', msg: err.message });
    }
  };

  const handleCheckOut = async () => {
    setFeedback(null);
    try {
      const res = await api.post('/attendance/check-out');
      setTodayPunch(res.data);
      setFeedback({ type: 'success', msg: res.message });
      fetchAttendance();
    } catch (err) {
      setFeedback({ type: 'error', msg: err.message });
    }
  };

  const handleOpenOverride = (record) => {
    setOverrideData({
      employeeId: record.employeeId,
      employeeName: record.employee ? `${record.employee.firstName} ${record.employee.lastName}` : 'Employee',
      date: record.date,
      status: record.status || 'PRESENT',
      workingHours: record.workingHours || 8.0,
      overrideReason: record.overrideReason || '',
      notes: record.notes || '',
    });
    setShowOverrideModal(true);
  };

  const handleSubmitOverride = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/attendance/override', overrideData);
      if (res.success) {
        setFeedback({ type: 'success', msg: res.message });
        setShowOverrideModal(false);
        fetchAttendance();
      }
    } catch (err) {
      alert(`Override failed: ${err.message}`);
    }
  };

  return (
    <div>
      {/* Feedback banner */}
      {feedback && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: '12px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: feedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${feedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            color: feedback.type === 'success' ? '#065f46' : '#991b1b',
            fontSize: '13.5px',
          }}
        >
          {feedback.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Employee Quick Punch Bar (Shown if Employee) */}
      {!isAdminOrHr && (
        <div className="card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #1e1b4b, #312e81)', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.8 }}>
                Today's Workshift Punch
              </span>
              <div style={{ fontSize: '20px', fontWeight: '800', margin: '4px 0' }}>
                {todayPunch?.checkIn
                  ? `Checked In at ${new Date(todayPunch.checkIn).toLocaleTimeString()}`
                  : 'You have not checked in today yet.'}
              </div>
              {todayPunch?.checkOut && (
                <div style={{ fontSize: '13px', opacity: 0.9 }}>
                  Checked Out at {new Date(todayPunch.checkOut).toLocaleTimeString()} • Working Hours: {todayPunch.workingHours} hrs
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn btn-success"
                onClick={handleCheckIn}
                disabled={!!todayPunch?.checkIn}
                style={{ opacity: todayPunch?.checkIn ? 0.6 : 1 }}
                id="btn-att-checkin"
              >
                <CheckCircle size={16} /> {todayPunch?.checkIn ? 'Checked In' : 'Punch In'}
              </button>
              <button
                className="btn btn-danger"
                onClick={handleCheckOut}
                disabled={!todayPunch?.checkIn || !!todayPunch?.checkOut}
                style={{ opacity: (!todayPunch?.checkIn || !!todayPunch?.checkOut) ? 0.6 : 1 }}
                id="btn-att-checkout"
              >
                <Clock size={16} /> {todayPunch?.checkOut ? 'Checked Out' : 'Punch Out'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Metrics for Employee */}
      {!isAdminOrHr && summary && (
        <div className="grid-metrics">
          <div className="metric-card" style={{ '--metric-accent': '#10b981', '--metric-bg': '#ecfdf5', '--metric-color': '#10b981' }}>
            <div className="metric-info">
              <h3>Present Days</h3>
              <div className="metric-value">{summary.presentDays}</div>
              <div className="metric-sub">Recorded this month</div>
            </div>
            <div className="metric-icon-box"><CalendarCheck size={24} /></div>
          </div>

          <div className="metric-card" style={{ '--metric-accent': '#f59e0b', '--metric-bg': '#fffbeb', '--metric-color': '#f59e0b' }}>
            <div className="metric-info">
              <h3>Half Days</h3>
              <div className="metric-value">{summary.halfDays}</div>
              <div className="metric-sub">&lt; 4 hours shift</div>
            </div>
            <div className="metric-icon-box"><Clock size={24} /></div>
          </div>

          <div className="metric-card" style={{ '--metric-accent': '#4f46e5', '--metric-bg': '#eef2ff', '--metric-color': '#4f46e5' }}>
            <div className="metric-info">
              <h3>Total Hours</h3>
              <div className="metric-value">{summary.totalHours} hrs</div>
              <div className="metric-sub">Logged working duration</div>
            </div>
            <div className="metric-icon-box"><Clock size={24} /></div>
          </div>
        </div>
      )}

      {/* Filter Header */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 className="card-title">
              {isAdminOrHr ? 'Organizational Attendance Register' : 'My Monthly Attendance Records'}
            </h2>
            <div className="card-subtitle">Daily tracking, punch timestamps, and working hours</div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {isAdminOrHr && (
              <select
                className="form-select"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                style={{ width: '180px' }}
                id="select-att-dept"
              >
                <option value="ALL">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Product & Design">Product & Design</option>
                <option value="Finance">Finance</option>
                <option value="Sales & Marketing">Sales & Marketing</option>
              </select>
            )}

            <select
              className="form-select"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              style={{ width: '140px' }}
              id="select-att-month"
            >
              {[
                { m: '1', n: 'January' }, { m: '2', n: 'February' }, { m: '3', n: 'March' },
                { m: '4', n: 'April' }, { m: '5', n: 'May' }, { m: '6', n: 'June' },
                { m: '7', n: 'July' }, { m: '8', n: 'August' }, { m: '9', n: 'September' },
                { m: '10', n: 'October' }, { m: '11', n: 'November' }, { m: '12', n: 'December' },
              ].map((item) => (
                <option key={item.m} value={item.m}>{item.n}</option>
              ))}
            </select>

            <select
              className="form-select"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              style={{ width: '100px' }}
              id="select-att-year"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading attendance logs...</div>
        ) : records.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No attendance logs found for this period.</div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  {isAdminOrHr && <th>Employee</th>}
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Working Hours</th>
                  <th>Status</th>
                  <th>Override Flag</th>
                  {isAdminOrHr && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id}>
                    {isAdminOrHr && (
                      <td>
                        <div style={{ fontWeight: '600' }}>
                          {r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : 'N/A'}
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                          {r.employee?.employeeCode} • {r.employee?.department}
                        </div>
                      </td>
                    )}
                    <td style={{ fontWeight: '600', whiteSpace: 'nowrap' }}>{r.date}</td>
                    <td>{r.checkIn ? new Date(r.checkIn).toLocaleTimeString() : '-'}</td>
                    <td>{r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : '-'}</td>
                    <td style={{ fontWeight: '600' }}>{r.workingHours ? `${r.workingHours} hrs` : '-'}</td>
                    <td>
                      <span className={`badge badge-${r.status?.toLowerCase()}`}>
                        {r.status}
                      </span>
                    </td>
                    <td>
                      {r.isOverride ? (
                        <span
                          className="badge"
                          style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}
                          title={`Overridden by ${r.overriddenBy}: ${r.overrideReason}`}
                        >
                          <ShieldAlert size={12} /> Overridden
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Standard</span>
                      )}
                    </td>
                    {isAdminOrHr && (
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenOverride(r)}
                          title="Admin Correction Override"
                          id={`btn-override-${r.id}`}
                        >
                          <Edit3 size={13} /> Override
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= ADMIN OVERRIDE MODAL ================= */}
      {showOverrideModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h3>Administrative Attendance Override</h3>
                <span className="card-subtitle">
                  Employee: {overrideData.employeeName} • Date: {overrideData.date}
                </span>
              </div>
              <button className="modal-close-btn" onClick={() => setShowOverrideModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitOverride}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Attendance Status *</label>
                  <select
                    className="form-select"
                    value={overrideData.status}
                    onChange={(e) => setOverrideData({ ...overrideData, status: e.target.value })}
                  >
                    <option value="PRESENT">PRESENT</option>
                    <option value="HALF_DAY">HALF_DAY</option>
                    <option value="ABSENT">ABSENT</option>
                    <option value="ON_LEAVE">ON_LEAVE</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Working Hours Calculated *</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    required
                    value={overrideData.workingHours}
                    onChange={(e) => setOverrideData({ ...overrideData, workingHours: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Mandatory Reason for Override *</label>
                  <textarea
                    className="form-textarea"
                    required
                    rows="3"
                    placeholder="e.g. Missed biometric scan due to offsite client meeting"
                    value={overrideData.overrideReason}
                    onChange={(e) => setOverrideData({ ...overrideData, overrideReason: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Internal Audit Notes</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Authorized by Department Head"
                    value={overrideData.notes}
                    onChange={(e) => setOverrideData({ ...overrideData, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowOverrideModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" id="btn-save-override">
                  Commit Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
