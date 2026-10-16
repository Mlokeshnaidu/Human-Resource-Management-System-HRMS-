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
  Calendar,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

export default function Attendance() {
  const { user, isAdminOrHr } = useAuth();
  const [records, setRecords] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [todayPunch, setTodayPunch] = useState(null);
  const [shiftsList, setShiftsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // Filters
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [department, setDepartment] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Override Modal State
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideData, setOverrideData] = useState({
    id: '',
    employeeId: '',
    employeeName: '',
    date: '',
    status: 'PRESENT',
    workingHours: 8.0,
    shiftId: '',
    isLate: false,
    lateMinutes: 0,
    isEarlyExit: false,
    earlyExitMinutes: 0,
    overtimeHours: 0.0,
    overrideReason: '',
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
    fetchAttendance();
    fetchShifts();
  }, [month, year, department, isAdminOrHr]);

  const fetchShifts = async () => {
    try {
      const res = await api.get('/shifts');
      if (res.success) setShiftsList(res.data || []);
    } catch (err) {
      console.error('Failed to load shifts:', err);
    }
  };

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      if (isAdminOrHr) {
        let q = `?month=${month}&year=${year}`;
        if (department !== 'ALL') q += `&department=${department}`;
        const res = await api.get(`/attendance${q}`);
        if (res.success) {
          setRecords(res.data || []);
        }
      } else {
        const [myRes, todayRes, summaryRes] = await Promise.all([
          api.get(`/attendance/my`),
          api.get('/attendance/today'),
          api.get(`/attendance/monthly-summary?month=${month}&year=${year}`),
        ]);
        if (myRes.success) {
          setRecords(myRes.data || myRes.records || []);
        }
        if (todayRes.success) {
          setTodayPunch(todayRes.data);
        }
        if (summaryRes.success) {
          setMonthlySummary(summaryRes);
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

  const handleOpenOverride = (rec) => {
    setOverrideData({
      id: rec.id,
      employeeId: rec.employeeId,
      employeeName: rec.employee ? `${rec.employee.firstName} ${rec.employee.lastName}` : rec.employeeId,
      date: rec.date,
      status: rec.status,
      workingHours: rec.workingHours || 8.0,
      shiftId: rec.shiftId || '',
      isLate: !!rec.isLate,
      lateMinutes: rec.lateMinutes || 0,
      isEarlyExit: !!rec.isEarlyExit,
      earlyExitMinutes: rec.earlyExitMinutes || 0,
      overtimeHours: rec.overtimeHours || 0.0,
      overrideReason: rec.overrideReason || '',
      notes: rec.notes || '',
    });
    setShowOverrideModal(true);
  };

  const handleSubmitOverride = async (e) => {
    e.preventDefault();
    if (!overrideData.overrideReason) {
      alert('Mandatory override audit reason required');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/attendance/override', overrideData);
      setShowOverrideModal(false);
      fetchAttendance();
      alert('Attendance record updated with override audit log');
    } catch (err) {
      alert(err.message || 'Override failed');
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.ceil(records.length / pageSize) || 1;
  const paginatedRecords = records.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Feedback banner */}
      {feedback && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '6px',
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

      {/* Punch Clock for Employees */}
      {!isAdminOrHr && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={20} color="#0d6efd" />
                <h2 className="card-title" style={{ margin: 0 }}>
                  Work Shift Punch Clock
                </h2>
              </div>
              <div className="card-subtitle" style={{ marginTop: '4px' }}>
                Assigned Shift: <strong>{todayPunch?.shift?.name || 'General Day Shift'}</strong> ({todayPunch?.shift?.startTime || '09:00'} - {todayPunch?.shift?.endTime || '18:00'})
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn btn-success"
                onClick={handleCheckIn}
                disabled={!!todayPunch?.checkIn}
                style={{ opacity: todayPunch?.checkIn ? 0.6 : 1 }}
                id="btn-att-checkin"
              >
                <Check size={16} /> {todayPunch?.checkIn ? 'Punched In' : 'Punch In'}
              </button>

              <button
                className="btn btn-danger"
                onClick={handleCheckOut}
                disabled={!todayPunch?.checkIn || !!todayPunch?.checkOut}
                style={{ opacity: (!todayPunch?.checkIn || !!todayPunch?.checkOut) ? 0.6 : 1 }}
                id="btn-att-checkout"
              >
                <Clock size={16} /> {todayPunch?.checkOut ? 'Punched Out' : 'Punch Out'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Attendance Summary Metrics Bar */}
      {!isAdminOrHr && monthlySummary && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#d1e7dd', color: '#198754' }}>
              <CalendarCheck size={22} />
            </div>
            <div className="stat-content">
              <span className="stat-label">EFFECTIVE PRESENT</span>
              <span className="stat-value">{monthlySummary.metrics.effectivePresent} Days</span>
              <span className="stat-hint">{monthlySummary.metrics.presentDays} full, {monthlySummary.metrics.halfDays} half-day</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#e7f1ff', color: '#0d6efd' }}>
              <Calendar size={22} />
            </div>
            <div className="stat-content">
              <span className="stat-label">WORKING DAYS EXCL. HOLIDAYS</span>
              <span className="stat-value">{monthlySummary.calendar.standardWorkingDays} Days</span>
              <span className="stat-hint">{monthlySummary.calendar.holidays} Company Holidays</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#fff3cd', color: '#d97706' }}>
              <Clock size={22} />
            </div>
            <div className="stat-content">
              <span className="stat-label">LATE ARRIVALS</span>
              <span className="stat-value">{monthlySummary.metrics.lateCheckins}</span>
              <span className="stat-hint">{monthlySummary.metrics.earlyCheckouts} early checkouts</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#f3e8ff', color: '#9333ea' }}>
              <TrendingUp size={22} />
            </div>
            <div className="stat-content">
              <span className="stat-label">TOTAL OVERTIME</span>
              <span className="stat-value">{monthlySummary.metrics.overtimeHours} Hrs</span>
              <span className="stat-hint">{monthlySummary.metrics.totalWorkingHours} total logged hrs</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Register Header */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
          <div>
            <h2 className="card-title">
              {isAdminOrHr ? 'Attendance Register' : 'My Attendance Register'}
            </h2>
            <div className="card-subtitle">
              Daily punches, shift compliance, and working hours
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {isAdminOrHr && (
              <select
                className="form-control"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                style={{ width: '160px' }}
              >
                <option value="ALL">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Finance">Finance</option>
                <option value="Product & Design">Product & Design</option>
                <option value="Marketing">Marketing</option>
                <option value="DevOps">DevOps</option>
              </select>
            )}

            <select
              className="form-control"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              style={{ width: '120px' }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                <option key={m} value={String(m)}>
                  {new Date(2026, m - 1).toLocaleString('default', { month: 'short' })}
                </option>
              ))}
            </select>

            <select
              className="form-control"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              style={{ width: '90px' }}
            >
              {[2025, 2026, 2027].map((y) => (
                <option key={y} value={String(y)}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Attendance Records Table */}
        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading records...</div>
        ) : records.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No attendance records found for this period.</div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    {isAdminOrHr && <th>Employee</th>}
                    <th>Date</th>
                    <th>Shift</th>
                    <th>Punches (In / Out)</th>
                    <th>Duration</th>
                    <th>Status & Compliance</th>
                    <th>Override</th>
                    {isAdminOrHr && <th style={{ textAlign: 'right' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {paginatedRecords.map((r) => (
                    <tr key={r.id}>
                      {isAdminOrHr && (
                        <td>
                          <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                            {r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : 'N/A'}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {r.employee?.employeeCode} • {r.employee?.department}
                          </div>
                        </td>
                      )}
                      <td style={{ fontWeight: '600', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>{r.date}</td>
                      <td>
                        <span
                          style={{
                            background: '#e7f1ff',
                            border: '1px solid #b6d4fe',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '600',
                            color: '#0d6efd',
                          }}
                        >
                          {r.shift?.code || 'GEN'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px', color: 'var(--text-main)' }}>
                          In: <strong>{r.checkIn ? new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</strong>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Out: {r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </div>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--text-main)' }}>{r.workingHours ? `${r.workingHours} hrs` : '-'}</strong>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
                          <span className={`badge badge-${r.status?.toLowerCase()}`}>
                            {r.status}
                          </span>

                          {r.isLate && (
                            <span
                              style={{
                                background: '#fee2e2',
                                color: '#b91c1c',
                                fontSize: '10px',
                                fontWeight: '700',
                                padding: '1px 6px',
                                borderRadius: '4px',
                              }}
                            >
                              Late ({r.lateMinutes}m)
                            </span>
                          )}

                          {r.isEarlyExit && (
                            <span
                              style={{
                                background: '#fef3c7',
                                color: '#b45309',
                                fontSize: '10px',
                                fontWeight: '700',
                                padding: '1px 6px',
                                borderRadius: '4px',
                              }}
                            >
                              Early Exit ({r.earlyExitMinutes}m)
                            </span>
                          )}

                          {r.overtimeHours > 0 && (
                            <span
                              style={{
                                background: '#e0f2fe',
                                color: '#0369a1',
                                fontSize: '10px',
                                fontWeight: '700',
                                padding: '1px 6px',
                                borderRadius: '4px',
                              }}
                            >
                              +{r.overtimeHours}h OT
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        {r.isOverride ? (
                          <span
                            style={{
                              background: '#fef3c7',
                              color: '#b45309',
                              border: '1px solid #fde68a',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '10.5px',
                              fontWeight: '600',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            title={`Overridden by ${r.overriddenBy}: ${r.overrideReason}`}
                          >
                            <ShieldAlert size={11} /> Overridden
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Standard</span>
                        )}
                      </td>
                      {isAdminOrHr && (
                        <td style={{ textAlign: 'right' }}>
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

            {/* Pagination Controls */}
            {records.length > pageSize && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 6px 0 6px',
                  borderTop: '1px solid var(--border-color)',
                  marginTop: '12px',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Showing {(currentPage - 1) * pageSize + 1} to{' '}
                  {Math.min(currentPage * pageSize, records.length)} of {records.length} records
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>

                  <span style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: '600' }}>
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ADMIN OVERRIDE MODAL */}
      {showOverrideModal && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <div>
                <h3>Administrative Attendance & Shift Override</h3>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  {overrideData.employeeName} • {overrideData.date}
                </span>
              </div>
              <button
                className="btn-icon"
                onClick={() => setShowOverrideModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitOverride}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label>Attendance Status *</label>
                    <select
                      className="form-control"
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
                    <label>Shift Allocation</label>
                    <select
                      className="form-control"
                      value={overrideData.shiftId}
                      onChange={(e) => setOverrideData({ ...overrideData, shiftId: e.target.value })}
                    >
                      <option value="">Default Shift</option>
                      {shiftsList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label>Working Hours</label>
                    <input
                      type="number"
                      step="0.1"
                      className="form-control"
                      value={overrideData.workingHours}
                      onChange={(e) =>
                        setOverrideData({ ...overrideData, workingHours: Number(e.target.value) })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Overtime Hours</label>
                    <input
                      type="number"
                      step="0.5"
                      className="form-control"
                      value={overrideData.overtimeHours}
                      onChange={(e) =>
                        setOverrideData({ ...overrideData, overtimeHours: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label>Late Arrival Minutes</label>
                    <input
                      type="number"
                      className="form-control"
                      value={overrideData.lateMinutes}
                      onChange={(e) =>
                        setOverrideData({
                          ...overrideData,
                          lateMinutes: Number(e.target.value),
                          isLate: Number(e.target.value) > 0,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Early Exit Minutes</label>
                    <input
                      type="number"
                      className="form-control"
                      value={overrideData.earlyExitMinutes}
                      onChange={(e) =>
                        setOverrideData({
                          ...overrideData,
                          earlyExitMinutes: Number(e.target.value),
                          isEarlyExit: Number(e.target.value) > 0,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Mandatory Override Audit Reason *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Biometric scanner malfunction, On-duty site visit"
                    value={overrideData.overrideReason}
                    onChange={(e) =>
                      setOverrideData({ ...overrideData, overrideReason: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Additional Notes</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    value={overrideData.notes}
                    onChange={(e) => setOverrideData({ ...overrideData, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowOverrideModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Apply Override'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
