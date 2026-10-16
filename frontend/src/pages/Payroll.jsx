import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import {
  CreditCard,
  Download,
  Lock,
  Play,
  CheckCircle,
  Eye,
  DollarSign,
  AlertCircle,
  ShieldCheck,
  Send,
  X,
  FileText,
  Sliders,
  TrendingUp,
  Plus,
  Edit2,
  Calendar,
  Sparkles,
} from 'lucide-react';

export default function Payroll() {
  const { user, isAdminOrHr } = useAuth();

  const [activeTab, setActiveTab] = useState('cycles'); // 'cycles' | 'structures' | 'revisions'
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [processingRun, setProcessingRun] = useState(false);

  // Filters
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState('2026');
  const [department, setDepartment] = useState('ALL');

  // Preview Modal
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Salary Structure Modal
  const [showStructureModal, setShowStructureModal] = useState(false);
  const [structureForm, setStructureForm] = useState({
    employeeId: '',
    employeeName: '',
    baseSalary: 50000,
    hra: 15000,
    conveyanceAllowance: 2000,
    medicalAllowance: 1500,
    specialAllowance: 3500,
    pfDeduction: 3600,
    taxDeduction: 2500,
    professionalTax: 200,
    overtimeHourlyRate: 250,
  });

  // Salary Revision Modal
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionForm, setRevisionForm] = useState({
    employeeId: '',
    newBase: 60000,
    newHra: 18000,
    newConveyance: 2000,
    newMedical: 1500,
    newSpecial: 4500,
    newPf: 4320,
    newTax: 3200,
    newOvertimeRate: 300,
    effectiveDate: new Date().toISOString().split('T')[0],
    reason: 'Annual Performance Appraisal 2026',
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPayrolls();
    if (isAdminOrHr) {
      fetchEmployees();
    }
  }, [month, year, department, isAdminOrHr]);

  const fetchPayrolls = async () => {
    setLoading(true);
    try {
      if (isAdminOrHr) {
        let q = `?month=${month}&year=${year}`;
        if (department !== 'ALL') q += `&department=${department}`;
        const res = await api.get(`/payroll${q}`);
        if (res.success) setPayrolls(res.data);
      } else {
        const res = await api.get('/payroll/my');
        if (res.success) setPayrolls(res.data);
      }
    } catch (err) {
      console.error('Error fetching payrolls:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees?status=ACTIVE');
      if (res.success) setEmployees(res.data || []);
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  const fetchRevisions = async (empId) => {
    try {
      const target = empId || (employees[0]?.id);
      if (!target) return;
      const res = await api.get(`/payroll/salary-revision/${target}`);
      if (res.success) setRevisions(res.data || []);
    } catch (err) {
      console.error('Error fetching revisions:', err);
    }
  };

  const handleGeneratePayroll = async () => {
    if (!window.confirm(`Generate advanced payroll for Month ${month}, Year ${year}? This dynamically factors in company holidays, attendance, shift overtime, and LOP days.`)) {
      return;
    }
    setProcessingRun(true);
    setFeedback(null);
    try {
      const res = await api.post('/payroll/generate', {
        month: parseInt(month),
        year: parseInt(year),
      });
      if (res.success) {
        setFeedback({ type: 'success', msg: `Payroll generated successfully for ${res.processedCount} employees!` });
        fetchPayrolls();
      }
    } catch (err) {
      setFeedback({ type: 'error', msg: err.message });
    } finally {
      setProcessingRun(false);
    }
  };

  const handleLockPayroll = async (id) => {
    if (!window.confirm('Lock this payroll cycle? Locked payrolls freeze attendance and dispatches email notifications.')) {
      return;
    }
    try {
      const res = await api.patch(`/payroll/${id}/lock`);
      if (res.success) {
        setFeedback({ type: 'success', msg: 'Payroll cycle successfully locked!' });
        fetchPayrolls();
      }
    } catch (err) {
      setFeedback({ type: 'error', msg: err.message });
    }
  };

  const handleSimulateDisbursement = async (id) => {
    try {
      const res = await api.post(`/payroll/${id}/disburse`);
      if (res.success) {
        setFeedback({ type: 'success', msg: res.message });
        fetchPayrolls();
      }
    } catch (err) {
      setFeedback({ type: 'error', msg: err.message });
    }
  };

  const handleDownloadPayslip = async (id, empCode, m, y) => {
    try {
      const blob = await api.download(`/payroll/${id}/payslip`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Payslip_${empCode || 'Techflow'}_${m}_${y}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('Payslip download failed');
    }
  };

  const handleOpenStructureModal = async (emp) => {
    try {
      const res = await api.get(`/payroll/salary-structure/${emp.id}`);
      if (res.success && res.structure) {
        const s = res.structure;
        setStructureForm({
          employeeId: emp.id,
          employeeName: `${emp.firstName} ${emp.lastName}`,
          baseSalary: s.baseSalary,
          hra: s.hra,
          conveyanceAllowance: s.conveyanceAllowance,
          medicalAllowance: s.medicalAllowance,
          specialAllowance: s.specialAllowance,
          pfDeduction: s.pfDeduction,
          taxDeduction: s.taxDeduction,
          professionalTax: s.professionalTax,
          overtimeHourlyRate: s.overtimeHourlyRate,
        });
      } else {
        setStructureForm({
          employeeId: emp.id,
          employeeName: `${emp.firstName} ${emp.lastName}`,
          baseSalary: emp.baseSalary,
          hra: emp.hra,
          conveyanceAllowance: 2000,
          medicalAllowance: 1500,
          specialAllowance: Math.max(0, emp.allowances - 3500),
          pfDeduction: emp.pfDeduction,
          taxDeduction: emp.taxDeduction,
          professionalTax: 200,
          overtimeHourlyRate: Math.round(emp.baseSalary / 200),
        });
      }
      setShowStructureModal(true);
    } catch (err) {
      alert('Failed to load salary structure');
    }
  };

  const handleSubmitStructure = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.put(`/payroll/salary-structure/${structureForm.employeeId}`, structureForm);
      setShowStructureModal(false);
      alert('Salary structure updated successfully');
      fetchEmployees();
    } catch (err) {
      alert(err.message || 'Failed to update structure');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenRevisionModal = (emp) => {
    const target = emp || employees[0];
    if (!target) return;
    const base = target.baseSalary || 50000;
    const newBase = Math.round(base * 1.1);
    setRevisionForm({
      employeeId: target.id,
      newBase: newBase,
      newHra: Math.round(newBase * 0.3),
      newConveyance: 2000,
      newMedical: 1500,
      newSpecial: 4500,
      newPf: Math.round(newBase * 0.072),
      newTax: Math.round(newBase * 0.05),
      newOvertimeRate: Math.round(newBase / 200),
      effectiveDate: new Date().toISOString().split('T')[0],
      reason: 'Annual Performance Appraisal 2026',
      notes: 'Excellent performance and delivery consistency.',
    });
    setShowRevisionModal(true);
  };

  const handleSubmitRevision = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/payroll/salary-revision', revisionForm);
      setShowRevisionModal(false);
      alert(res.message || 'Compensation revision applied successfully!');
      fetchEmployees();
      fetchRevisions(revisionForm.employeeId);
    } catch (err) {
      alert(err.message || 'Revision failed');
    } finally {
      setSubmitting(false);
    }
  };

  const openPreview = (p) => {
    setSelectedPayroll(p);
    setShowPreviewModal(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Controls Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '12px',
          padding: '16px 20px',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              padding: '10px',
              borderRadius: '10px',
              background: 'rgba(168, 85, 247, 0.15)',
              color: '#a855f7',
            }}
          >
            <CreditCard size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
              Payroll & Compensation Module
            </h2>
            <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: 0 }}>
              Dynamic compensation engine factoring in attendance, approved leaves, overtime, holidays, and salary revisions.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isAdminOrHr && (
            <div
              style={{
                display: 'flex',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '3px',
              }}
            >
              <button
                onClick={() => setActiveTab('cycles')}
                style={{
                  background: activeTab === 'cycles' ? '#0d6efd' : 'transparent',
                  color: activeTab === 'cycles' ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Payroll Runs
              </button>
              <button
                onClick={() => setActiveTab('structures')}
                style={{
                  background: activeTab === 'structures' ? '#0d6efd' : 'transparent',
                  color: activeTab === 'structures' ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Salary Structures
              </button>
              <button
                onClick={() => {
                  setActiveTab('revisions');
                  if (employees.length > 0) fetchRevisions(employees[0].id);
                }}
                style={{
                  background: activeTab === 'revisions' ? '#0d6efd' : 'transparent',
                  color: activeTab === 'revisions' ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Compensation Revisions
              </button>
            </div>
          )}

          {isAdminOrHr && activeTab === 'cycles' && (
            <button
              className="btn btn-primary"
              onClick={handleGeneratePayroll}
              disabled={processingRun}
              id="btn-generate-payroll"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Play size={15} />
              {processingRun ? 'Calculating...' : 'Run Payroll Calculation'}
            </button>
          )}

          {isAdminOrHr && activeTab === 'revisions' && (
            <button
              className="btn btn-primary"
              onClick={() => handleOpenRevisionModal(employees[0])}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={15} />
              <span>Revise Compensation</span>
            </button>
          )}
        </div>
      </div>

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

      {/* ================= TAB 1: PAYROLL RUNS ================= */}
      {activeTab === 'cycles' && (
        <div className="card">
          {/* Filters Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '14px',
              marginBottom: '16px',
            }}
          >
            <div>
              <h2 className="card-title">
                {isAdminOrHr ? 'Organizational Payroll Records' : 'My Official Salary Slips'}
              </h2>
              <div className="card-subtitle">
                Factor: Standard Working Days = Calendar Days - Weekends - Company Holidays
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

          {loading ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#6c757d' }}>Loading payroll cycle...</div>
          ) : payrolls.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#6c757d' }}>
              No payroll records found. Click "Run Payroll Calculation" to process this cycle.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    {isAdminOrHr && <th>Employee</th>}
                    <th>Working / Holidays</th>
                    <th>Attendance</th>
                    <th>Overtime Pay</th>
                    <th>Gross Salary</th>
                    <th>LOP Deduction</th>
                    <th>Deductions</th>
                    <th>Net Salary</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payrolls.map((p) => {
                    const emp = p.employee;
                    return (
                      <tr key={p.id}>
                        {isAdminOrHr && (
                          <td>
                            <div style={{ fontWeight: '700', color: '#f8fafc' }}>
                              {emp ? `${emp.firstName} ${emp.lastName}` : 'N/A'}
                            </div>
                            <div style={{ fontSize: '11px', color: '#38bdf8' }}>
                              {emp?.employeeCode} • {emp?.department}
                            </div>
                          </td>
                        )}
                        <td>
                          <div style={{ fontWeight: '600', color: '#f8fafc' }}>
                            {p.standardWorkingDays || p.totalWorkingDays} days
                          </div>
                          <div style={{ fontSize: '11px', color: '#10b981' }}>
                            {p.holidaysCount || 0} holidays excl.
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '12px' }}>
                            {p.presentDays}d present / {p.paidLeaveDays}d leave
                          </div>
                          {p.lopDays > 0 && (
                            <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: '700' }}>
                              {p.lopDays}d LOP
                            </span>
                          )}
                        </td>
                        <td>
                          {p.overtimeHours > 0 ? (
                            <div>
                              <strong style={{ color: '#38bdf8' }}>₹{Number(p.overtimePay || 0).toLocaleString('en-IN')}</strong>
                              <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>({p.overtimeHours} hrs)</div>
                            </div>
                          ) : (
                            <span style={{ color: '#64748b', fontSize: '12px' }}>-</span>
                          )}
                        </td>
                        <td style={{ fontWeight: '600', color: '#f8fafc' }}>
                          ₹{Number(p.grossSalary).toLocaleString('en-IN')}
                        </td>
                        <td>
                          {p.lopDeduction > 0 ? (
                            <span style={{ color: '#ef4444', fontWeight: '700' }}>
                              ₹{Number(p.lopDeduction).toLocaleString('en-IN')}
                            </span>
                          ) : (
                            <span style={{ color: '#10b981' }}>₹0</span>
                          )}
                        </td>
                        <td style={{ color: '#ef4444' }}>
                          ₹{Number(p.totalDeductions).toLocaleString('en-IN')}
                        </td>
                        <td>
                          <strong style={{ color: '#34d399', fontSize: '14px' }}>
                            ₹{Number(p.netSalary).toLocaleString('en-IN')}
                          </strong>
                        </td>
                        <td>
                          <span className={`badge badge-${p.status?.toLowerCase()}`}>
                            {p.status}
                          </span>
                          {p.isLocked && (
                            <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginTop: '2px' }}>
                              🔒 Locked
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => openPreview(p)}
                              title="Preview Payslip Breakdown"
                            >
                              <Eye size={13} />
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleDownloadPayslip(p.id, emp?.employeeCode, p.month, p.year)}
                              title="Download ReportLab PDF Payslip"
                            >
                              <Download size={13} /> PDF
                            </button>
                            {isAdminOrHr && !p.isLocked && (
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleLockPayroll(p.id)}
                                title="Lock Payroll & Notify"
                              >
                                <Lock size={13} />
                              </button>
                            )}
                            {isAdminOrHr && p.status !== 'PAID' && (
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => handleSimulateDisbursement(p.id)}
                                title="Simulate Bank Disbursement"
                              >
                                <Send size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: SALARY STRUCTURES ================= */}
      {activeTab === 'structures' && isAdminOrHr && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Employee Salary Structures & Components</h2>
              <p className="card-subtitle">
                Configure itemized earnings (Basic, HRA, Conveyance, Medical, Special Allowance) and deductions.
              </p>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Basic Pay</th>
                  <th>HRA Allowance</th>
                  <th>Conveyance</th>
                  <th>Medical</th>
                  <th>Special Allowance</th>
                  <th>PF Deduction</th>
                  <th>TDS Deduction</th>
                  <th>Overtime Rate</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <div style={{ fontWeight: '700', color: '#f8fafc' }}>
                        {e.firstName} {e.lastName}
                      </div>
                      <div style={{ fontSize: '11px', color: '#38bdf8' }}>
                        {e.employeeCode} • {e.department}
                      </div>
                    </td>
                    <td><strong>₹{e.baseSalary.toLocaleString()}</strong></td>
                    <td>₹{e.hra.toLocaleString()}</td>
                    <td>₹2,000</td>
                    <td>₹1,500</td>
                    <td>₹{Math.max(0, e.allowances - 3500).toLocaleString()}</td>
                    <td>₹{e.pfDeduction.toLocaleString()}</td>
                    <td>₹{e.taxDeduction.toLocaleString()}</td>
                    <td><strong style={{ color: '#38bdf8' }}>₹{Math.round(e.baseSalary / 200)}/hr</strong></td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenStructureModal(e)}
                      >
                        <Edit2 size={12} /> Configure
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 3: COMPENSATION REVISIONS ================= */}
      {activeTab === 'revisions' && isAdminOrHr && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Header Row */}
          <div
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '12px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
                Compensation Revision History Ledger
              </h3>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                Audit trail of all salary increments, promotions, and annual compensation adjustments.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '12px', color: '#94a3b8' }}>Select Employee:</label>
              <select
                className="form-control"
                style={{ width: '220px' }}
                onChange={(e) => fetchRevisions(e.target.value)}
              >
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.firstName} {e.lastName} ({e.employeeCode})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Effective Date</th>
                  <th>Previous Gross</th>
                  <th>Revised New Gross</th>
                  <th>Increment</th>
                  <th>Revision Reason</th>
                  <th>Approved By</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {revisions.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#6c757d' }}>
                      No revision history found for this staff member.
                    </td>
                  </tr>
                ) : (
                  revisions.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: '600', color: '#38bdf8' }}>{r.effectiveDate}</td>
                      <td>₹{Number(r.previousGross).toLocaleString('en-IN')}</td>
                      <td>
                        <strong style={{ color: '#34d399' }}>
                          ₹{Number(r.newGross).toLocaleString('en-IN')}
                        </strong>
                      </td>
                      <td>
                        <span
                          style={{
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#34d399',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontWeight: '700',
                          }}
                        >
                          +{r.incrementPercentage}%
                        </span>
                      </td>
                      <td style={{ fontWeight: '600' }}>{r.reason}</td>
                      <td style={{ fontSize: '12px', color: '#94a3b8' }}>{r.revisedBy}</td>
                      <td style={{ fontSize: '12px', color: '#cbd5e1', maxWidth: '240px' }}>
                        {r.notes || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= MODAL: SALARY STRUCTURE CONFIGURATION ================= */}
      {showStructureModal && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div>
                <h3>Configure Salary Structure</h3>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  {structureForm.employeeName}
                </span>
              </div>
              <button
                className="btn-icon"
                onClick={() => setShowStructureModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitStructure}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label>Base Salary (INR) *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={structureForm.baseSalary}
                      onChange={(e) => setStructureForm({ ...structureForm, baseSalary: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>House Rent Allowance (HRA) *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={structureForm.hra}
                      onChange={(e) => setStructureForm({ ...structureForm, hra: Number(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <div className="form-group">
                    <label>Conveyance</label>
                    <input
                      type="number"
                      className="form-control"
                      value={structureForm.conveyanceAllowance}
                      onChange={(e) => setStructureForm({ ...structureForm, conveyanceAllowance: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Medical</label>
                    <input
                      type="number"
                      className="form-control"
                      value={structureForm.medicalAllowance}
                      onChange={(e) => setStructureForm({ ...structureForm, medicalAllowance: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Special Allowance</label>
                    <input
                      type="number"
                      className="form-control"
                      value={structureForm.specialAllowance}
                      onChange={(e) => setStructureForm({ ...structureForm, specialAllowance: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <div className="form-group">
                    <label>PF Deduction</label>
                    <input
                      type="number"
                      className="form-control"
                      value={structureForm.pfDeduction}
                      onChange={(e) => setStructureForm({ ...structureForm, pfDeduction: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Tax (TDS)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={structureForm.taxDeduction}
                      onChange={(e) => setStructureForm({ ...structureForm, taxDeduction: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Overtime Rate (INR/hr)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={structureForm.overtimeHourlyRate}
                      onChange={(e) => setStructureForm({ ...structureForm, overtimeHourlyRate: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowStructureModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Structure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: COMPENSATION REVISION ================= */}
      {showRevisionModal && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} color="#34d399" />
                <h3>Revise Personnel Compensation</h3>
              </div>
              <button
                className="btn-icon"
                onClick={() => setShowRevisionModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitRevision}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label>Staff Member *</label>
                  <select
                    className="form-control"
                    value={revisionForm.employeeId}
                    onChange={(e) => setRevisionForm({ ...revisionForm, employeeId: e.target.value })}
                    required
                  >
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.firstName} {e.lastName} ({e.employeeCode}) - Current Base: ₹{e.baseSalary.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label>New Base Salary (INR) *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={revisionForm.newBase}
                      onChange={(e) => {
                        const b = Number(e.target.value);
                        setRevisionForm({
                          ...revisionForm,
                          newBase: b,
                          newHra: Math.round(b * 0.3),
                          newOvertimeRate: Math.round(b / 200),
                        });
                      }}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>New HRA Allowance *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={revisionForm.newHra}
                      onChange={(e) => setRevisionForm({ ...revisionForm, newHra: Number(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label>Effective Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={revisionForm.effectiveDate}
                      onChange={(e) => setRevisionForm({ ...revisionForm, effectiveDate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Revision Reason *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Annual Appraisal, Promotion"
                      value={revisionForm.reason}
                      onChange={(e) => setRevisionForm({ ...revisionForm, reason: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Evaluation Notes / Justification</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    value={revisionForm.notes}
                    onChange={(e) => setRevisionForm({ ...revisionForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowRevisionModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Applying...' : 'Apply Revision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: SALARY SLIP PREVIEW ================= */}
      {showPreviewModal && selectedPayroll && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>Itemized Salary Slip Statement</h3>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Period: Month {selectedPayroll.month}/{selectedPayroll.year} • Ref: {selectedPayroll.transactionReference || 'PENDING'}
                </span>
              </div>
              <button
                className="btn-icon"
                onClick={() => setShowPreviewModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Working Days & Attendance bar */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '8px',
                  background: '#1e293b',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  textAlign: 'center',
                }}
              >
                <div>
                  <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>Working Days</span>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#f8fafc' }}>
                    {selectedPayroll.standardWorkingDays || selectedPayroll.totalWorkingDays}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '10.5px', color: '#10b981' }}>Holidays Excluded</span>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#10b981' }}>
                    {selectedPayroll.holidaysCount || 0}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '10.5px', color: '#38bdf8' }}>Present Days</span>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#38bdf8' }}>
                    {selectedPayroll.presentDays}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '10.5px', color: '#ef4444' }}>LOP Days</span>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#ef4444' }}>
                    {selectedPayroll.lopDays}
                  </div>
                </div>
              </div>

              {/* Earnings & Deductions Split */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                {/* Earnings */}
                <div
                  style={{
                    background: '#1e293b',
                    padding: '14px',
                    borderRadius: '8px',
                    border: '1px solid #334155',
                  }}
                >
                  <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#f8fafc', marginBottom: '8px' }}>
                    Gross Earnings Breakdown
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span style={{ color: '#94a3b8' }}>Basic Pay</span>
                    <span style={{ color: '#f8fafc' }}>₹{Number(selectedPayroll.baseSalary).toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span style={{ color: '#94a3b8' }}>HRA</span>
                    <span style={{ color: '#f8fafc' }}>₹{Number(selectedPayroll.hra).toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span style={{ color: '#94a3b8' }}>Conveyance</span>
                    <span style={{ color: '#f8fafc' }}>₹{Number(selectedPayroll.conveyanceAllowance || 2000).toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span style={{ color: '#94a3b8' }}>Medical Allowance</span>
                    <span style={{ color: '#f8fafc' }}>₹{Number(selectedPayroll.medicalAllowance || 1500).toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span style={{ color: '#94a3b8' }}>Special Allowance</span>
                    <span style={{ color: '#f8fafc' }}>₹{Number(selectedPayroll.specialAllowance || 0).toLocaleString('en-IN')}</span>
                  </div>
                  {selectedPayroll.overtimeHours > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px', color: '#38bdf8' }}>
                      <span>Overtime Pay ({selectedPayroll.overtimeHours}h)</span>
                      <span>₹{Number(selectedPayroll.overtimePay || 0).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div style={{ borderTop: '1px solid #334155', marginTop: '8px', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '13px' }}>
                    <span style={{ color: '#f8fafc' }}>Total Gross</span>
                    <span style={{ color: '#38bdf8' }}>₹{Number(selectedPayroll.grossSalary).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Deductions */}
                <div
                  style={{
                    background: '#1e293b',
                    padding: '14px',
                    borderRadius: '8px',
                    border: '1px solid #334155',
                  }}
                >
                  <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#ef4444', marginBottom: '8px' }}>
                    Statutory & Other Deductions
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span style={{ color: '#94a3b8' }}>Provident Fund (PF)</span>
                    <span style={{ color: '#f8fafc' }}>₹{Number(selectedPayroll.pf).toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span style={{ color: '#94a3b8' }}>Income Tax (TDS)</span>
                    <span style={{ color: '#f8fafc' }}>₹{Number(selectedPayroll.tax).toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span style={{ color: '#ef4444' }}>LOP Deduction ({selectedPayroll.lopDays}d)</span>
                    <span style={{ color: '#ef4444' }}>₹{Number(selectedPayroll.lopDeduction).toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span style={{ color: '#94a3b8' }}>Professional Tax / Other</span>
                    <span style={{ color: '#f8fafc' }}>₹{Number(selectedPayroll.otherDeductions || 200).toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ borderTop: '1px solid #334155', marginTop: '8px', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '13px' }}>
                    <span style={{ color: '#f8fafc' }}>Total Deductions</span>
                    <span style={{ color: '#ef4444' }}>₹{Number(selectedPayroll.totalDeductions).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Net Payable Banner */}
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1.5px solid #10b981',
                  borderRadius: '10px',
                  padding: '14px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '11px', color: '#10b981', fontWeight: '700', letterSpacing: '0.5px' }}>
                  TOTAL NET PAYABLE SALARY
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#34d399', margin: '4px 0' }}>
                  ₹{Number(selectedPayroll.netSalary).toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Method: {selectedPayroll.paymentMethod || 'NEFT / DIRECT_BANK_TRANSFER'} • Ref: {selectedPayroll.transactionReference || 'SIM-PENDING'}
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
              <button
                className="btn btn-primary"
                onClick={() =>
                  handleDownloadPayslip(
                    selectedPayroll.id,
                    selectedPayroll.employee?.employeeCode,
                    selectedPayroll.month,
                    selectedPayroll.year
                  )
                }
              >
                <Download size={14} /> Download PDF Salary Slip
              </button>
              <button className="btn btn-secondary" onClick={() => setShowPreviewModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
