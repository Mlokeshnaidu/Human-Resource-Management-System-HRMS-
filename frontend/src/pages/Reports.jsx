import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  BarChart3,
  Download,
  Filter,
  FileSpreadsheet,
  FileText,
  Calendar,
  Users,
  CreditCard,
  PieChart,
} from 'lucide-react';

export default function Reports() {
  const [activeReport, setActiveReport] = useState('payroll'); // 'payroll' | 'attendance' | 'leave'
  const [department, setDepartment] = useState('ALL');
  const [month, setMonth] = useState('9');
  const [year, setYear] = useState('2026');

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [activeReport, department, month, year]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let endpoint = `/reports/${activeReport}?month=${month}&year=${year}`;
      if (department !== 'ALL') endpoint += `&department=${department}`;
      const res = await api.get(endpoint);
      if (res.success) {
        setReportData(res);
      }
    } catch (err) {
      console.error('Report fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const blob = await api.download(`/reports/export/csv?type=${activeReport}&month=${month}&year=${year}&department=${department}`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeReport}_report_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert(`CSV export failed: ${err.message}`);
    }
  };

  const handleExportPdf = async () => {
    try {
      const blob = await api.download(`/reports/export/pdf?type=${activeReport}&month=${month}&year=${year}&department=${department}`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeReport}_report_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert(`PDF export failed: ${err.message}`);
    }
  };

  return (
    <div>
      {/* Report Module Tabs & Filter Bar */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          {/* Sub tabs */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`btn ${activeReport === 'payroll' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveReport('payroll')}
              id="tab-report-payroll"
            >
              <CreditCard size={15} /> Payroll Summaries
            </button>
            <button
              className={`btn ${activeReport === 'attendance' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveReport('attendance')}
              id="tab-report-attendance"
            >
              <Calendar size={15} /> Attendance Reports
            </button>
            <button
              className={`btn ${activeReport === 'leave' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveReport('leave')}
              id="tab-report-leave"
            >
              <Users size={15} /> Leave Utilization
            </button>
          </div>

          {/* Export Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={handleExportCsv} id="btn-export-csv">
              <FileSpreadsheet size={15} color="#10b981" /> Export CSV
            </button>
            <button className="btn btn-secondary" onClick={handleExportPdf} id="btn-export-pdf">
              <FileText size={15} color="#ef4444" /> Export PDF
            </button>
          </div>
        </div>

        {/* Filter selects */}
        <div style={{ display: 'flex', gap: '14px', marginTop: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Filters:</div>
          <select
            className="form-select"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            style={{ width: '180px' }}
          >
            <option value="ALL">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Human Resources">Human Resources</option>
            <option value="Product & Design">Product & Design</option>
            <option value="Finance">Finance</option>
            <option value="Sales & Marketing">Sales & Marketing</option>
          </select>

          <select
            className="form-select"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            style={{ width: '140px' }}
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
          >
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>
        </div>
      </div>

      {/* Render selected report content */}
      {loading ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Compiling analytical dataset...
        </div>
      ) : (
        <>
          {/* ================= PAYROLL REPORT VIEW ================= */}
          {activeReport === 'payroll' && reportData && (
            <div>
              <div className="grid-metrics">
                <div className="metric-card" style={{ '--metric-accent': '#10b981', '--metric-bg': '#ecfdf5', '--metric-color': '#10b981' }}>
                  <div className="metric-info">
                    <h3>Total Net Payout</h3>
                    <div className="metric-value">₹{Number(reportData.totals?.net || 0).toLocaleString('en-IN')}</div>
                    <div className="metric-sub">Disbursed salary expense</div>
                  </div>
                  <div className="metric-icon-box"><CreditCard size={24} /></div>
                </div>

                <div className="metric-card" style={{ '--metric-accent': '#4f46e5', '--metric-bg': '#eef2ff', '--metric-color': '#4f46e5' }}>
                  <div className="metric-info">
                    <h3>Gross Earnings</h3>
                    <div className="metric-value">₹{Number(reportData.totals?.gross || 0).toLocaleString('en-IN')}</div>
                    <div className="metric-sub">Base, HRA & allowances</div>
                  </div>
                  <div className="metric-icon-box"><DollarSign size={24} /></div>
                </div>

                <div className="metric-card" style={{ '--metric-accent': '#dc2626', '--metric-bg': '#fef2f2', '--metric-color': '#dc2626' }}>
                  <div className="metric-info">
                    <h3>LOP Deductions</h3>
                    <div className="metric-value">₹{Number(reportData.totals?.lop || 0).toLocaleString('en-IN')}</div>
                    <div className="metric-sub">Loss of pay penalty savings</div>
                  </div>
                  <div className="metric-icon-box"><BarChart3 size={24} /></div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Payroll Expenditure Details</h2>
                </div>
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Department</th>
                        <th>Gross</th>
                        <th>PF</th>
                        <th>Tax</th>
                        <th>LOP Deduction</th>
                        <th>Net Salary</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.payrolls?.map((p) => (
                        <tr key={p.id}>
                          <td style={{ fontWeight: '600' }}>
                            {p.employee?.firstName} {p.employee?.lastName} ({p.employee?.employeeCode})
                          </td>
                          <td>{p.employee?.department}</td>
                          <td>₹{Number(p.grossSalary).toLocaleString('en-IN')}</td>
                          <td>₹{Number(p.pf).toLocaleString('en-IN')}</td>
                          <td>₹{Number(p.tax).toLocaleString('en-IN')}</td>
                          <td style={{ color: p.lopDeduction > 0 ? '#dc2626' : 'inherit' }}>
                            ₹{Number(p.lopDeduction).toLocaleString('en-IN')}
                          </td>
                          <td style={{ fontWeight: '700', color: '#059669' }}>
                            ₹{Number(p.netSalary).toLocaleString('en-IN')}
                          </td>
                          <td><span className={`badge badge-${p.status.toLowerCase()}`}>{p.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= ATTENDANCE REPORT VIEW ================= */}
          {activeReport === 'attendance' && reportData && (
            <div>
              <div className="grid-metrics">
                <div className="metric-card" style={{ '--metric-accent': '#10b981', '--metric-bg': '#ecfdf5', '--metric-color': '#10b981' }}>
                  <div className="metric-info">
                    <h3>Present Punches</h3>
                    <div className="metric-value">{reportData.summary?.present || 0}</div>
                    <div className="metric-sub">Full working shifts</div>
                  </div>
                  <div className="metric-icon-box"><Calendar size={24} /></div>
                </div>

                <div className="metric-card" style={{ '--metric-accent': '#f59e0b', '--metric-bg': '#fffbeb', '--metric-color': '#f59e0b' }}>
                  <div className="metric-info">
                    <h3>Half Days</h3>
                    <div className="metric-value">{reportData.summary?.halfDay || 0}</div>
                    <div className="metric-sub">&lt; 4 hours logged</div>
                  </div>
                  <div className="metric-icon-box"><Calendar size={24} /></div>
                </div>

                <div className="metric-card" style={{ '--metric-accent': '#3b82f6', '--metric-bg': '#eff6ff', '--metric-color': '#3b82f6' }}>
                  <div className="metric-info">
                    <h3>On Leave</h3>
                    <div className="metric-value">{reportData.summary?.onLeave || 0}</div>
                    <div className="metric-sub">Approved leave entries</div>
                  </div>
                  <div className="metric-icon-box"><Calendar size={24} /></div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Attendance Tracking Logs</h2>
                </div>
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Employee</th>
                        <th>Department</th>
                        <th>Check In</th>
                        <th>Check Out</th>
                        <th>Hours</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.records?.map((r) => (
                        <tr key={r.id}>
                          <td style={{ fontWeight: '600' }}>{r.date}</td>
                          <td>{r.employee?.firstName} {r.employee?.lastName} ({r.employee?.employeeCode})</td>
                          <td>{r.employee?.department}</td>
                          <td>{r.checkIn ? new Date(r.checkIn).toLocaleTimeString() : '-'}</td>
                          <td>{r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : '-'}</td>
                          <td>{r.workingHours} hrs</td>
                          <td><span className={`badge badge-${r.status.toLowerCase()}`}>{r.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= LEAVE REPORT VIEW ================= */}
          {activeReport === 'leave' && reportData && (
            <div>
              <div className="grid-metrics">
                <div className="metric-card" style={{ '--metric-accent': '#4f46e5', '--metric-bg': '#eef2ff', '--metric-color': '#4f46e5' }}>
                  <div className="metric-info">
                    <h3>Casual Leaves (CL)</h3>
                    <div className="metric-value">{reportData.summary?.CL || 0}</div>
                    <div className="metric-sub">Total requests submitted</div>
                  </div>
                  <div className="metric-icon-box"><Users size={24} /></div>
                </div>

                <div className="metric-card" style={{ '--metric-accent': '#f59e0b', '--metric-bg': '#fffbeb', '--metric-color': '#f59e0b' }}>
                  <div className="metric-info">
                    <h3>Sick Leaves (SL)</h3>
                    <div className="metric-value">{reportData.summary?.SL || 0}</div>
                    <div className="metric-sub">Medical absence claims</div>
                  </div>
                  <div className="metric-icon-box"><Users size={24} /></div>
                </div>

                <div className="metric-card" style={{ '--metric-accent': '#dc2626', '--metric-bg': '#fef2f2', '--metric-color': '#dc2626' }}>
                  <div className="metric-info">
                    <h3>Loss of Pay (LOP)</h3>
                    <div className="metric-value">{reportData.summary?.LOP || 0}</div>
                    <div className="metric-sub">Unpaid leave applications</div>
                  </div>
                  <div className="metric-icon-box"><Users size={24} /></div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Leave Applications Register</h2>
                </div>
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Type</th>
                        <th>Dates</th>
                        <th>Days</th>
                        <th>Reason</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.leaves?.map((l) => (
                        <tr key={l.id}>
                          <td style={{ fontWeight: '600' }}>
                            {l.employee?.firstName} {l.employee?.lastName} ({l.employee?.employeeCode})
                          </td>
                          <td style={{ fontWeight: '700' }}>{l.leaveType}</td>
                          <td>{l.startDate} to {l.endDate}</td>
                          <td>{l.totalDays}d</td>
                          <td style={{ maxWidth: '250px', fontSize: '12.5px' }}>{l.reason}</td>
                          <td><span className={`badge badge-${l.status.toLowerCase()}`}>{l.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
