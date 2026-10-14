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
} from 'lucide-react';

export default function Payroll() {
  const { user, isAdminOrHr } = useAuth();
  const [payrolls, setPayrolls] = useState([]);
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

  useEffect(() => {
    fetchPayrolls();
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

  const handleGeneratePayroll = async () => {
    if (!window.confirm(`Generate monthly payroll for Month ${month}, Year ${year}? This recalculates attendance & LOP days.`)) {
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
    if (!window.confirm('Lock this payroll cycle? Once locked, attendance adjustments are frozen and employee notification emails are dispatched.')) {
      return;
    }
    try {
      const res = await api.patch(`/payroll/${id}/lock`);
      if (res.success) {
        setFeedback({ type: 'success', msg: res.message });
        fetchPayrolls();
      }
    } catch (err) {
      alert(`Lock failed: ${err.message}`);
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
      alert(`Disbursement simulation failed: ${err.message}`);
    }
  };

  const handleDownloadPayslip = async (id, empCode, m, y) => {
    try {
      const blob = await api.download(`/payroll/${id}/payslip`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SalarySlip_${empCode || 'EMP'}_${m}_${y}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert(`Download failed: ${err.message}`);
    }
  };

  const openPreview = (p) => {
    setSelectedPayroll(p);
    setShowPreviewModal(true);
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

      {/* Action Header & Filters */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 className="card-title">
              {isAdminOrHr ? 'Payroll Processing & Salary Management' : 'My Salary Slips & History'}
            </h2>
            <div className="card-subtitle">
              {isAdminOrHr
                ? 'Automated monthly calculation with LOP deductions, salary locking, and banking simulation'
                : 'Download authorized PDF salary slips and review compensation breakdown'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {isAdminOrHr && (
              <>
                <select
                  className="form-select"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  style={{ width: '130px' }}
                  id="select-payroll-month"
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
                  style={{ width: '90px' }}
                  id="select-payroll-year"
                >
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                </select>

                <button
                  className="btn btn-primary"
                  onClick={handleGeneratePayroll}
                  disabled={processingRun}
                  id="btn-generate-payroll"
                >
                  <Play size={15} /> {processingRun ? 'Processing...' : 'Run Monthly Payroll'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Payroll Records Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading payroll records...</div>
        ) : payrolls.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No payroll records found for this period. Click 'Run Monthly Payroll' to generate.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  {isAdminOrHr && <th>Employee</th>}
                  <th>Period</th>
                  <th>Gross Salary</th>
                  <th>LOP Days</th>
                  <th>LOP Deduction</th>
                  <th>Total Deductions</th>
                  <th>Net Disbursed</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payrolls.map((p) => {
                  const emp = p.employee || user?.employee;
                  return (
                    <tr key={p.id}>
                      {isAdminOrHr && (
                        <td>
                          <div style={{ fontWeight: '600' }}>
                            {emp ? `${emp.firstName} ${emp.lastName}` : 'N/A'}
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                            {emp?.employeeCode} • {emp?.department}
                          </div>
                        </td>
                      )}
                      <td style={{ fontWeight: '600', whiteSpace: 'nowrap' }}>
                        Month {p.month}, {p.year}
                      </td>
                      <td style={{ fontWeight: '600' }}>
                        ₹{Number(p.grossSalary).toLocaleString('en-IN')}
                      </td>
                      <td>
                        {p.lopDays > 0 ? (
                          <span style={{ color: '#dc2626', fontWeight: '700' }}>{p.lopDays}d LOP</span>
                        ) : (
                          <span style={{ color: '#10b981' }}>0d</span>
                        )}
                      </td>
                      <td style={{ color: p.lopDeduction > 0 ? '#dc2626' : 'var(--text-muted)' }}>
                        ₹{Number(p.lopDeduction).toLocaleString('en-IN')}
                      </td>
                      <td style={{ color: '#dc2626' }}>
                        ₹{Number(p.totalDeductions).toLocaleString('en-IN')}
                      </td>
                      <td style={{ fontWeight: '800', color: '#059669', fontSize: '14.5px' }}>
                        ₹{Number(p.netSalary).toLocaleString('en-IN')}
                      </td>
                      <td>
                        <span className={`badge badge-${p.status?.toLowerCase()}`}>
                          {p.status}
                        </span>
                        {p.isLocked && (
                          <span style={{ fontSize: '10px', color: '#64748b', display: 'block', marginTop: '2px' }}>
                            🔒 Locked
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => openPreview(p)}
                            title="Preview Slip Breakdown"
                            id={`btn-preview-slip-${p.id}`}
                          >
                            <Eye size={13} />
                          </button>

                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleDownloadPayslip(p.id, emp?.employeeCode, p.month, p.year)}
                            title="Download PDF Salary Slip"
                            id={`btn-download-pdf-${p.id}`}
                          >
                            <Download size={13} /> PDF
                          </button>

                          {isAdminOrHr && !p.isLocked && (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleLockPayroll(p.id)}
                              title="Lock Payroll & Notify"
                              id={`btn-lock-${p.id}`}
                            >
                              <Lock size={13} /> Lock
                            </button>
                          )}

                          {isAdminOrHr && p.status !== 'PAID' && (
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleSimulateDisbursement(p.id)}
                              title="Simulate Bank Disbursement"
                              id={`btn-disburse-${p.id}`}
                            >
                              <Send size={13} /> Disburse
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

      {/* ================= SALARY SLIP PREVIEW MODAL ================= */}
      {showPreviewModal && selectedPayroll && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <div>
                <h3>Salary Slip Summary</h3>
                <span className="card-subtitle">
                  Period: Month {selectedPayroll.month}, {selectedPayroll.year} • Ref: {selectedPayroll.transactionReference || 'PENDING'}
                </span>
              </div>
              <button className="modal-close-btn" onClick={() => setShowPreviewModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {/* Earnings & Deductions Comparison */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                {/* Earnings Box */}
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '10px' }}>
                    Gross Earnings
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Basic Salary</span>
                    <span style={{ fontWeight: '600' }}>₹{Number(selectedPayroll.baseSalary).toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>HRA Allowance</span>
                    <span style={{ fontWeight: '600' }}>₹{Number(selectedPayroll.hra).toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Special Allowances</span>
                    <span style={{ fontWeight: '600' }}>₹{Number(selectedPayroll.allowances).toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Bonus / Incentive</span>
                    <span style={{ fontWeight: '600' }}>₹{Number(selectedPayroll.bonus || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <hr style={{ border: '0', borderTop: '1px solid var(--border-color)', margin: '10px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '700' }}>
                    <span>Total Gross</span>
                    <span style={{ color: 'var(--primary)' }}>₹{Number(selectedPayroll.grossSalary).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Deductions Box */}
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#dc2626', marginBottom: '10px' }}>
                    Statutory Deductions
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Provident Fund (PF)</span>
                    <span style={{ fontWeight: '600' }}>₹{Number(selectedPayroll.pf).toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Tax Deducted (TDS)</span>
                    <span style={{ fontWeight: '600' }}>₹{Number(selectedPayroll.tax).toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Loss of Pay ({selectedPayroll.lopDays}d)</span>
                    <span style={{ fontWeight: '600', color: '#dc2626' }}>₹{Number(selectedPayroll.lopDeduction).toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Other Deductions</span>
                    <span style={{ fontWeight: '600' }}>₹{Number(selectedPayroll.otherDeductions || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <hr style={{ border: '0', borderTop: '1px solid var(--border-color)', margin: '10px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '700' }}>
                    <span>Total Deductions</span>
                    <span style={{ color: '#dc2626' }}>₹{Number(selectedPayroll.totalDeductions).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Net Disbursed Highlight */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #065f46, #047857)',
                  color: 'white',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Net Disbursed Take-Home Salary
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: '800' }}>
                    ₹{Number(selectedPayroll.netSalary).toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <button
                    className="btn btn-secondary"
                    onClick={() =>
                      handleDownloadPayslip(
                        selectedPayroll.id,
                        selectedPayroll.employee?.employeeCode,
                        selectedPayroll.month,
                        selectedPayroll.year
                      )
                    }
                  >
                    <Download size={15} /> Download Signed PDF
                  </button>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowPreviewModal(false)}>
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
