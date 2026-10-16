import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import {
  Clock,
  Plus,
  Users,
  Building2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Edit2,
  Trash2,
  History,
  TrendingUp,
  FileText,
  X,
  Check,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

export default function Shifts() {
  const { user, isAdminOrHr } = useAuth();

  const [activeTab, setActiveTab] = useState('shifts'); // 'shifts' | 'assignments' | 'reports' | 'my-schedule'
  const [shifts, setShifts] = useState([]);
  const [deptAssignments, setDeptAssignments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [myShift, setMyShift] = useState(null);
  const [attendanceReport, setAttendanceReport] = useState([]);
  const [reportDateRange, setReportDateRange] = useState({
    startDate: '2026-10-01',
    endDate: '2026-10-31',
  });
  const [loading, setLoading] = useState(false);

  // Modals state
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [shiftForm, setShiftForm] = useState({
    name: '',
    code: '',
    startTime: '09:00',
    endTime: '18:00',
    gracePeriodMinutes: 15,
    earlyExitThresholdMinutes: 15,
    fullDayHours: 8.0,
    halfDayHours: 4.0,
    description: '',
    isDefault: false,
  });

  const [showAssignEmpModal, setShowAssignEmpModal] = useState(false);
  const [assignEmpForm, setAssignEmpForm] = useState({
    employeeId: '',
    shiftId: '',
    startDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [showAssignDeptModal, setShowAssignDeptModal] = useState(false);
  const [assignDeptForm, setAssignDeptForm] = useState({
    department: 'Engineering',
    shiftId: '',
  });

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedEmpHistory, setSelectedEmpHistory] = useState([]);
  const [selectedEmpName, setSelectedEmpName] = useState('');

  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideForm, setOverrideForm] = useState({
    attendanceId: '',
    shiftId: '',
    isLate: false,
    lateMinutes: 0,
    isEarlyExit: false,
    earlyExitMinutes: 0,
    overtimeHours: 0.0,
    overrideReason: '',
  });

  const [submitting, setSubmitting] = useState(false);

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/shifts');
      if (res.success) {
        setShifts(res.data || []);
        setDeptAssignments(res.departmentAssignments || []);
      }
    } catch (err) {
      console.error('Failed to load shifts:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    if (!isAdminOrHr) return;
    try {
      const res = await api.get('/employees?status=ACTIVE');
      if (res.success) {
        setEmployees(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load employees:', err);
    }
  };

  const fetchMyShift = async () => {
    try {
      const res = await api.get('/shifts/my');
      if (res.success) {
        setMyShift(res.data);
      }
    } catch (err) {
      console.error('Failed to load my shift:', err);
    }
  };

  const fetchAttendanceReport = async () => {
    if (!isAdminOrHr) return;
    try {
      const res = await api.get(
        `/shifts/attendance-report?startDate=${reportDateRange.startDate}&endDate=${reportDateRange.endDate}`
      );
      if (res.success) {
        setAttendanceReport(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load shift attendance report:', err);
    }
  };

  useEffect(() => {
    fetchShifts();
    if (isAdminOrHr) {
      fetchEmployees();
      fetchAttendanceReport();
    } else {
      fetchMyShift();
      setActiveTab('my-schedule');
    }
  }, []);

  const handleOpenAddShift = () => {
    setEditingShift(null);
    setShiftForm({
      name: '',
      code: '',
      startTime: '09:00',
      endTime: '18:00',
      gracePeriodMinutes: 15,
      earlyExitThresholdMinutes: 15,
      fullDayHours: 8.0,
      halfDayHours: 4.0,
      description: '',
      isDefault: false,
    });
    setShowShiftModal(true);
  };

  const handleOpenEditShift = (s) => {
    setEditingShift(s);
    setShiftForm({
      name: s.name,
      code: s.code,
      startTime: s.startTime,
      endTime: s.endTime,
      gracePeriodMinutes: s.gracePeriodMinutes,
      earlyExitThresholdMinutes: s.earlyExitThresholdMinutes,
      fullDayHours: s.fullDayHours,
      halfDayHours: s.halfDayHours,
      description: s.description || '',
      isDefault: !!s.isDefault,
    });
    setShowShiftModal(true);
  };

  const handleSubmitShift = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingShift) {
        await api.put(`/shifts/${editingShift.id}`, shiftForm);
      } else {
        await api.post('/shifts', shiftForm);
      }
      setShowShiftModal(false);
      fetchShifts();
    } catch (err) {
      alert(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivateShift = async (id, name) => {
    if (!window.confirm(`Are you sure you want to deactivate shift "${name}"?`)) return;
    try {
      await api.delete(`/shifts/${id}`);
      fetchShifts();
    } catch (err) {
      alert(err.message || 'Failed to deactivate shift');
    }
  };

  const handleAssignEmpShift = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/shifts/assign-employee', assignEmpForm);
      setShowAssignEmpModal(false);
      fetchShifts();
      alert('Shift assigned successfully!');
    } catch (err) {
      alert(err.message || 'Assignment failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignDeptShift = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/shifts/assign-department', assignDeptForm);
      setShowAssignDeptModal(false);
      fetchShifts();
      alert('Department schedule updated successfully!');
    } catch (err) {
      alert(err.message || 'Department assignment failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewEmpHistory = async (emp) => {
    setSelectedEmpName(`${emp.firstName} ${emp.lastName}`);
    try {
      const res = await api.get(`/shifts/employee/${emp.id}/history`);
      if (res.success) {
        setSelectedEmpHistory(res.data || []);
        setShowHistoryModal(true);
      }
    } catch (err) {
      alert(err.message || 'Failed to load shift history');
    }
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Controls & Navigation Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 18px',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {isAdminOrHr && (
            <>
              <button
                onClick={() => setActiveTab('shifts')}
                className={`btn btn-sm ${activeTab === 'shifts' ? 'btn-primary' : 'btn-secondary'}`}
              >
                All Shifts
              </button>
              <button
                onClick={() => setActiveTab('assignments')}
                className={`btn btn-sm ${activeTab === 'assignments' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Assignments
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`btn btn-sm ${activeTab === 'reports' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Attendance Reports
              </button>
            </>
          )}
          <button
            onClick={() => setActiveTab('my-schedule')}
            className={`btn btn-sm ${activeTab === 'my-schedule' ? 'btn-primary' : 'btn-secondary'}`}
          >
            My Work Schedule
          </button>
        </div>

        {isAdminOrHr && activeTab === 'shifts' && (
          <button
            onClick={handleOpenAddShift}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={15} />
            <span>+ Create Shift</span>
          </button>
        )}
      </div>

      {/* TAB 1: ALL SHIFTS CARDS */}
      {activeTab === 'shifts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '16px',
            }}
          >
            {shifts.map((s) => (
              <div
                key={s.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  borderTop: s.isDefault ? '3px solid var(--primary)' : '1px solid var(--border-color)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        background: '#e7f1ff',
                        color: '#0d6efd',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '700',
                      }}
                    >
                      {s.code}
                    </span>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
                      {s.name}
                    </h3>
                  </div>

                  {s.isDefault && (
                    <span
                      className="badge"
                      style={{
                        background: '#d1e7dd',
                        color: '#0f5132',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                      }}
                    >
                      Default Shift
                    </span>
                  )}
                </div>

                {/* Timings Highlight Box */}
                <div
                  style={{
                    background: '#f8f9fa',
                    border: '1px solid #e9ecef',
                    borderRadius: '6px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '11px', color: '#6c757d', fontWeight: '600', textTransform: 'uppercase' }}>
                      Scheduled Timings
                    </span>
                    <div style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-main)' }}>
                      {s.startTime} - {s.endTime}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', color: '#6c757d', fontWeight: '600', textTransform: 'uppercase' }}>
                      Grace Period
                    </span>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#d97706' }}>
                      {s.gracePeriodMinutes} mins
                    </div>
                  </div>
                </div>

                {/* Key Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                  <div style={{ color: '#6c757d' }}>
                    Full Day: <strong style={{ color: 'var(--text-main)' }}>{s.fullDayHours} hrs</strong>
                  </div>
                  <div style={{ color: '#6c757d' }}>
                    Half Day: <strong style={{ color: 'var(--text-main)' }}>{s.halfDayHours} hrs</strong>
                  </div>
                  <div style={{ color: '#6c757d' }}>
                    Early Exit: <strong style={{ color: 'var(--text-main)' }}>{s.earlyExitThresholdMinutes}m threshold</strong>
                  </div>
                  <div style={{ color: '#6c757d' }}>
                    Active Personnel: <strong style={{ color: '#0d6efd' }}>{s.staffCount} staff</strong>
                  </div>
                </div>

                {s.description && (
                  <p style={{ fontSize: '12px', color: '#6c757d', margin: 0, lineHeight: '1.4' }}>
                    {s.description}
                  </p>
                )}

                {/* Admin Actions */}
                {isAdminOrHr && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: '8px',
                      paddingTop: '10px',
                      borderTop: '1px solid #e9ecef',
                      marginTop: 'auto',
                    }}
                  >
                    <button
                      onClick={() => handleOpenEditShift(s)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '12px' }}
                    >
                      <Edit2 size={12} />
                      <span>Edit</span>
                    </button>
                    {!s.isDefault && (
                      <button
                        onClick={() => handleDeactivateShift(s.id, s.name)}
                        className="btn btn-secondary btn-sm"
                        style={{ color: '#dc3545', fontSize: '12px' }}
                        title="Delete Shift"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: SHIFT ASSIGNMENTS (DEPARTMENT & EMPLOYEE) */}
      {activeTab === 'assignments' && isAdminOrHr && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Department Schedules Card */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Department Default Schedules</h3>
                <p className="card-subtitle">
                  Employees inherit their department shift unless an individual shift is explicitly assigned.
                </p>
              </div>

              <button
                onClick={() => setShowAssignDeptModal(true)}
                className="btn btn-secondary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Plus size={14} />
                <span>Assign Department Shift</span>
              </button>
            </div>

            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Assigned Shift</th>
                    <th>Timings</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {deptAssignments.map((d) => (
                    <tr key={d.id}>
                      <td style={{ fontWeight: '600', color: 'var(--text-main)' }}>{d.department}</td>
                      <td>
                        <span
                          style={{
                            background: '#e7f1ff',
                            color: '#0d6efd',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600',
                          }}
                        >
                          {d.shiftName}
                        </span>
                      </td>
                      <td style={{ color: '#6c757d', fontSize: '12.5px' }}>Standard operating hours</td>
                      <td>
                        <button
                          onClick={() => {
                            setAssignDeptForm({ department: d.department, shiftId: d.shiftId });
                            setShowAssignDeptModal(true);
                          }}
                          className="btn btn-secondary btn-sm"
                        >
                          Reassign
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Individual Employee Assignments Card */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Personnel Shift Overrides & History</h3>
                <p className="card-subtitle">
                  Assign custom shifts to individual staff members and view their shift history timeline.
                </p>
              </div>

              <button
                onClick={() => setShowAssignEmpModal(true)}
                className="btn btn-primary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Plus size={14} />
                <span>Assign Staff Shift</span>
              </button>
            </div>

            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th>Current Shift</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.id}>
                      <td>
                        <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                          {emp.firstName} {emp.lastName}
                        </div>
                        <div style={{ fontSize: '11px', color: '#6c757d' }}>{emp.employeeCode}</div>
                      </td>
                      <td>{emp.department}</td>
                      <td>{emp.designation}</td>
                      <td>
                        <span
                          style={{
                            background: '#d1e7dd',
                            color: '#0f5132',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600',
                          }}
                        >
                          {emp.department === 'Engineering'
                            ? 'Flexible Shift'
                            : emp.department === 'DevOps'
                            ? 'Night Shift'
                            : 'General Day Shift'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            onClick={() => {
                              setAssignEmpForm({
                                employeeId: emp.id,
                                shiftId: shifts[0]?.id || '',
                                startDate: new Date().toISOString().split('T')[0],
                                notes: '',
                              });
                              setShowAssignEmpModal(true);
                            }}
                            className="btn btn-secondary btn-sm"
                            title="Assign Shift"
                          >
                            Assign Shift
                          </button>
                          <button
                            onClick={() => handleViewEmpHistory(emp)}
                            className="btn btn-secondary btn-sm"
                            title="View Shift Timeline History"
                          >
                            <History size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SHIFT-WISE ATTENDANCE REPORT */}
      {activeTab === 'reports' && isAdminOrHr && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Filter Bar */}
          <div
            className="card"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>From:</label>
                <input
                  type="date"
                  className="form-control"
                  style={{ width: '140px' }}
                  value={reportDateRange.startDate}
                  onChange={(e) =>
                    setReportDateRange({ ...reportDateRange, startDate: e.target.value })
                  }
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>To:</label>
                <input
                  type="date"
                  className="form-control"
                  style={{ width: '140px' }}
                  value={reportDateRange.endDate}
                  onChange={(e) =>
                    setReportDateRange({ ...reportDateRange, endDate: e.target.value })
                  }
                />
              </div>

              <button onClick={fetchAttendanceReport} className="btn btn-primary btn-sm">
                Apply Date Range
              </button>
            </div>

            <div style={{ fontSize: '12px', color: '#198754', fontWeight: '600' }}>
              ✓ Shift timings dynamically applied to Late & Overtime thresholds
            </div>
          </div>

          {/* Shift Analytics Summary Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-responsive">
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Shift Name & Code</th>
                    <th>Scheduled Hours</th>
                    <th>Active Staff</th>
                    <th>Total Logs</th>
                    <th>On-Time Rate</th>
                    <th>Late Arrivals</th>
                    <th>Early Exits</th>
                    <th>Total Overtime</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceReport.map((r) => (
                    <tr key={r.shiftId}>
                      <td>
                        <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{r.shiftName}</div>
                        <span
                          style={{
                            background: '#e7f1ff',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            color: '#0d6efd',
                            fontWeight: '600',
                          }}
                        >
                          {r.shiftCode}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{r.timings}</td>
                      <td>
                        <strong style={{ color: 'var(--text-main)' }}>{r.staffAssigned}</strong>
                      </td>
                      <td>{r.totalPunches}</td>
                      <td>
                        <span
                          style={{
                            color: r.onTimeRate >= 90 ? '#198754' : '#d97706',
                            fontWeight: '700',
                          }}
                        >
                          {r.onTimeRate}%
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            background: r.lateCheckins > 0 ? '#f8d7da' : 'transparent',
                            color: r.lateCheckins > 0 ? '#dc3545' : '#6c757d',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontWeight: '600',
                          }}
                        >
                          {r.lateCheckins}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            background: r.earlyCheckouts > 0 ? '#fff3cd' : 'transparent',
                            color: r.earlyCheckouts > 0 ? '#664d03' : '#6c757d',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontWeight: '600',
                          }}
                        >
                          {r.earlyCheckouts}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: '#0d6efd', fontWeight: '600' }}>
                          {r.totalOvertimeHours} hrs
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MY SCHEDULE (FOR EMPLOYEE) */}
      {activeTab === 'my-schedule' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span
                  style={{
                    background: '#e7f1ff',
                    color: '#0d6efd',
                    padding: '3px 10px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                  }}
                >
                  Active Assigned Work Schedule
                </span>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-main)', marginTop: '8px' }}>
                  {myShift?.name || 'General Day Shift'} ({myShift?.code || 'GEN'})
                </h2>
              </div>

              <div
                style={{
                  background: '#d1e7dd',
                  color: '#0f5132',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontWeight: '600',
                  fontSize: '13px',
                }}
              >
                Status: Operational
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '14px',
                marginTop: '6px',
              }}
            >
              <div style={{ background: '#f8f9fa', border: '1px solid #e9ecef', padding: '14px', borderRadius: '6px' }}>
                <span style={{ fontSize: '11px', color: '#6c757d', fontWeight: '600' }}>SHIFT START TIME</span>
                <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', marginTop: '4px' }}>
                  {myShift?.startTime || '09:00'}
                </div>
                <span style={{ fontSize: '11.5px', color: '#d97706' }}>
                  Grace period: {myShift?.gracePeriodMinutes || 15} mins
                </span>
              </div>

              <div style={{ background: '#f8f9fa', border: '1px solid #e9ecef', padding: '14px', borderRadius: '6px' }}>
                <span style={{ fontSize: '11px', color: '#6c757d', fontWeight: '600' }}>SHIFT END TIME</span>
                <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', marginTop: '4px' }}>
                  {myShift?.endTime || '18:00'}
                </div>
                <span style={{ fontSize: '11.5px', color: '#6c757d' }}>
                  Early exit threshold: {myShift?.earlyExitThresholdMinutes || 15} mins
                </span>
              </div>

              <div style={{ background: '#f8f9fa', border: '1px solid #e9ecef', padding: '14px', borderRadius: '6px' }}>
                <span style={{ fontSize: '11px', color: '#6c757d', fontWeight: '600' }}>STANDARD WORKING HOURS</span>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#0d6efd', marginTop: '4px' }}>
                  {myShift?.fullDayHours || 8.0} Hours
                </div>
                <span style={{ fontSize: '11.5px', color: '#198754' }}>
                  Half day: {myShift?.halfDayHours || 4.0} Hours
                </span>
              </div>
            </div>

            <div
              style={{
                padding: '12px 16px',
                background: '#e7f1ff',
                border: '1px solid #b6d4fe',
                borderRadius: '6px',
                fontSize: '12.5px',
                color: '#084298',
                lineHeight: '1.4',
              }}
            >
              💡 <strong>Attendance Guidelines:</strong> Clock in within your grace period to avoid being flagged as
              late. Working hours beyond {myShift?.fullDayHours || 8} hours are automatically credited as overtime!
            </div>
          </div>
        </div>
      )}


      {/* MODAL 1: CREATE / EDIT SHIFT */}
      {showShiftModal && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="#0d6efd" />
                <h3>{editingShift ? 'Edit Work Shift' : 'Create Work Shift'}</h3>
              </div>
              <button
                className="btn-icon"
                onClick={() => setShowShiftModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitShift}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label>Shift Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Morning Shift"
                      value={shiftForm.name}
                      onChange={(e) => setShiftForm({ ...shiftForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Code</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. MORN"
                      value={shiftForm.code}
                      onChange={(e) => setShiftForm({ ...shiftForm, code: e.target.value })}
                      disabled={!!editingShift}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label>Start Time (HH:MM)</label>
                    <input
                      type="time"
                      className="form-control"
                      value={shiftForm.startTime}
                      onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>End Time (HH:MM)</label>
                    <input
                      type="time"
                      className="form-control"
                      value={shiftForm.endTime}
                      onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label>Grace Period (Minutes)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={shiftForm.gracePeriodMinutes}
                      onChange={(e) =>
                        setShiftForm({ ...shiftForm, gracePeriodMinutes: Number(e.target.value) })
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Early Exit Threshold (Mins)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={shiftForm.earlyExitThresholdMinutes}
                      onChange={(e) =>
                        setShiftForm({ ...shiftForm, earlyExitThresholdMinutes: Number(e.target.value) })
                      }
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label>Full Day Hours</label>
                    <input
                      type="number"
                      step="0.5"
                      className="form-control"
                      value={shiftForm.fullDayHours}
                      onChange={(e) => setShiftForm({ ...shiftForm, fullDayHours: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Half Day Minimum Hours</label>
                    <input
                      type="number"
                      step="0.5"
                      className="form-control"
                      value={shiftForm.halfDayHours}
                      onChange={(e) => setShiftForm({ ...shiftForm, halfDayHours: Number(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    value={shiftForm.description}
                    onChange={(e) => setShiftForm({ ...shiftForm, description: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id="chk-default-shift"
                    checked={shiftForm.isDefault}
                    onChange={(e) => setShiftForm({ ...shiftForm, isDefault: e.target.checked })}
                  />
                  <label htmlFor="chk-default-shift" style={{ fontSize: '12px', color: 'var(--text-main)' }}>
                    Set as default organization shift
                  </label>
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowShiftModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingShift ? 'Update Shift' : 'Create Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ASSIGN EMPLOYEE SHIFT */}
      {showAssignEmpModal && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} color="#0d6efd" />
                <h3>Assign Personnel Shift</h3>
              </div>
              <button
                className="btn-icon"
                onClick={() => setShowAssignEmpModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignEmpShift}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label>Select Employee</label>
                  <select
                    className="form-control"
                    value={assignEmpForm.employeeId}
                    onChange={(e) => setAssignEmpForm({ ...assignEmpForm, employeeId: e.target.value })}
                    required
                  >
                    <option value="">-- Choose Staff Member --</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.firstName} {e.lastName} ({e.employeeCode}) - {e.department}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Target Shift</label>
                  <select
                    className="form-control"
                    value={assignEmpForm.shiftId}
                    onChange={(e) => setAssignEmpForm({ ...assignEmpForm, shiftId: e.target.value })}
                    required
                  >
                    <option value="">-- Choose Shift --</option>
                    {shifts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.startTime} - {s.endTime})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Effective Start Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={assignEmpForm.startDate}
                    onChange={(e) => setAssignEmpForm({ ...assignEmpForm, startDate: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Assignment Notes (Optional)</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="Reason or project schedule..."
                    value={assignEmpForm.notes}
                    onChange={(e) => setAssignEmpForm({ ...assignEmpForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAssignEmpModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ASSIGN DEPARTMENT SHIFT */}
      {showAssignDeptModal && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={18} color="#0d6efd" />
                <h3>Assign Department Schedule</h3>
              </div>
              <button
                className="btn-icon"
                onClick={() => setShowAssignDeptModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignDeptShift}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label>Department</label>
                  <select
                    className="form-control"
                    value={assignDeptForm.department}
                    onChange={(e) => setAssignDeptForm({ ...assignDeptForm, department: e.target.value })}
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Finance">Finance</option>
                    <option value="Product & Design">Product & Design</option>
                    <option value="Marketing">Marketing</option>
                    <option value="DevOps">DevOps</option>
                    <option value="Executive Management">Executive Management</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Default Shift for this Department</label>
                  <select
                    className="form-control"
                    value={assignDeptForm.shiftId}
                    onChange={(e) => setAssignDeptForm({ ...assignDeptForm, shiftId: e.target.value })}
                    required
                  >
                    <option value="">-- Choose Shift --</option>
                    {shifts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.startTime} - {s.endTime})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAssignDeptModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Set Department Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: EMPLOYEE SHIFT HISTORY TIMELINE */}
      {showHistoryModal && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={18} color="#38bdf8" />
                <h3>Shift History: {selectedEmpName}</h3>
              </div>
              <button
                className="btn-icon"
                onClick={() => setShowHistoryModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {selectedEmpHistory.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>
                  No historical shift records found for this employee.
                </p>
              ) : (
                selectedEmpHistory.map((h, i) => (
                  <div
                    key={h.id}
                    style={{
                      padding: '12px 14px',
                      background: h.isActive ? '#e7f1ff' : '#f8f9fa',
                      border: `1px solid ${h.isActive ? '#b6d4fe' : '#e9ecef'}`,
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '13px' }}>
                        {h.shiftName} ({h.timings})
                      </span>
                      {h.isActive && (
                        <span
                          style={{
                            background: '#0d6efd',
                            color: 'white',
                            fontSize: '10px',
                            fontWeight: '700',
                            padding: '1px 6px',
                            borderRadius: '4px',
                          }}
                        >
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: '#6c757d' }}>
                      Duration: {h.startDate} to {h.endDate}
                    </div>
                    {h.notes && (
                      <div style={{ fontSize: '11px', color: '#495057', fontStyle: 'italic' }}>
                        Notes: {h.notes}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
              <button className="btn btn-secondary" onClick={() => setShowHistoryModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
