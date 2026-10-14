import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import {
  CalendarDays,
  PlusCircle,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  X,
  FileCheck,
} from 'lucide-react';

export default function Leaves() {
  const { user, isAdminOrHr } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [feedback, setFeedback] = useState(null);

  // Apply Modal
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyData, setApplyData] = useState({
    leaveType: 'CL',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: '',
  });

  // Review Modal (Admin Reject)
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectId, setRejectId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchData();
  }, [statusFilter, isAdminOrHr]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (isAdminOrHr) {
        let q = `?status=${statusFilter}`;
        const res = await api.get(`/leaves${q}`);
        if (res.success) setLeaves(res.data);
      } else {
        const [myLeavesRes, balancesRes] = await Promise.all([
          api.get('/leaves/my'),
          api.get('/leaves/balances'),
        ]);
        if (myLeavesRes.success) setLeaves(myLeavesRes.data);
        if (balancesRes.success) setBalances(balancesRes.data);
      }
    } catch (err) {
      console.error('Error fetching leaves:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);
    try {
      const res = await api.post('/leaves/apply', applyData);
      if (res.success) {
        setFeedback({ type: 'success', msg: 'Leave application submitted successfully for HR approval' });
        setShowApplyModal(false);
        setApplyData({
          leaveType: 'CL',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          reason: '',
        });
        fetchData();
      }
    } catch (err) {
      setFeedback({ type: 'error', msg: err.message });
    }
  };

  const handleReviewAction = async (id, status, reason = '') => {
    try {
      const res = await api.patch(`/leaves/${id}/review`, {
        status,
        rejectionReason: reason,
      });
      if (res.success) {
        setFeedback({ type: 'success', msg: `Leave request marked as ${status}` });
        setShowRejectModal(false);
        setRejectionReason('');
        fetchData();
      }
    } catch (err) {
      alert(`Action failed: ${err.message}`);
    }
  };

  const handleOpenReject = (id) => {
    setRejectId(id);
    setRejectionReason('');
    setShowRejectModal(true);
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
          {feedback.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Leave Balances Grid (Shown if Employee) */}
      {!isAdminOrHr && balances.length > 0 && (
        <div className="grid-metrics">
          {balances.map((b) => (
            <div
              key={b.leaveType}
              className="metric-card"
              style={{
                '--metric-accent': b.leaveType === 'CL' ? '#4f46e5' : (b.leaveType === 'SL' ? '#f59e0b' : '#10b981'),
                '--metric-bg': b.leaveType === 'CL' ? '#eef2ff' : (b.leaveType === 'SL' ? '#fffbeb' : '#ecfdf5'),
                '--metric-color': b.leaveType === 'CL' ? '#4f46e5' : (b.leaveType === 'SL' ? '#f59e0b' : '#10b981'),
              }}
            >
              <div className="metric-info">
                <h3>
                  {b.leaveType === 'CL' ? 'Casual Leave (CL)' : (b.leaveType === 'SL' ? 'Sick Leave (SL)' : 'Paid Leave (PL)')}
                </h3>
                <div className="metric-value">{b.remainingDays} Days</div>
                <div className="metric-sub">
                  Used: {b.usedDays} • Quota: {b.totalDays} days
                </div>
              </div>
              <div className="metric-icon-box">
                <CalendarDays size={24} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter and Apply Bar */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 className="card-title">
              {isAdminOrHr ? 'Leave Management & Approval Queue' : 'My Leave Applications'}
            </h2>
            <div className="card-subtitle">
              {isAdminOrHr ? 'Review, approve, or reject team leave requests' : 'Apply for paid or Loss of Pay (LOP) leaves'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {isAdminOrHr && (
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: '160px' }}
                id="select-leave-status-filter"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending Review</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            )}

            {!isAdminOrHr && (
              <button
                className="btn btn-primary"
                onClick={() => setShowApplyModal(true)}
                id="btn-open-apply-leave"
              >
                <PlusCircle size={16} /> Apply for Leave
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Leaves Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading leaves...</div>
        ) : leaves.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No leave applications found.</div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  {isAdminOrHr && <th>Employee</th>}
                  <th>Leave Type</th>
                  <th>Duration</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Reviewed By / Notes</th>
                  {isAdminOrHr && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {leaves.map((l) => (
                  <tr key={l.id}>
                    {isAdminOrHr && (
                      <td>
                        <div style={{ fontWeight: '600' }}>
                          {l.employee ? `${l.employee.firstName} ${l.employee.lastName}` : 'N/A'}
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                          {l.employee?.employeeCode} • {l.employee?.department}
                        </div>
                      </td>
                    )}
                    <td>
                      <span style={{ fontWeight: '700', color: l.leaveType === 'LOP' ? '#dc2626' : 'var(--primary)' }}>
                        {l.leaveType}
                      </span>
                      {l.isLossOfPay && (
                        <span style={{ fontSize: '10px', background: '#fee2e2', color: '#991b1b', padding: '2px 5px', borderRadius: '4px', marginLeft: '6px' }}>
                          LOP
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>
                      {l.startDate} to {l.endDate}
                    </td>
                    <td style={{ fontWeight: '600' }}>{l.totalDays}d</td>
                    <td style={{ maxWidth: '240px', fontSize: '12.5px' }}>{l.reason}</td>
                    <td>
                      <span className={`badge badge-${l.status.toLowerCase()}`}>
                        {l.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {l.status === 'APPROVED' && <span>Approved by {l.reviewedBy}</span>}
                      {l.status === 'REJECTED' && <span style={{ color: '#dc2626' }}>Reason: {l.rejectionReason}</span>}
                      {l.status === 'PENDING' && <span style={{ color: '#f59e0b' }}>Awaiting review</span>}
                    </td>
                    {isAdminOrHr && (
                      <td>
                        {l.status === 'PENDING' ? (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              className="btn btn-success btn-sm"
                              style={{ padding: '4px 8px' }}
                              title="Approve Leave"
                              onClick={() => handleReviewAction(l.id, 'APPROVED')}
                              id={`btn-approve-leave-${l.id}`}
                            >
                              <CheckCircle size={14} /> Approve
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              style={{ padding: '4px 8px' }}
                              title="Reject Leave"
                              onClick={() => handleOpenReject(l.id)}
                              id={`btn-reject-leave-${l.id}`}
                            >
                              <XCircle size={14} /> Reject
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Completed</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= APPLY LEAVE MODAL ================= */}
      {showApplyModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Apply for Leave</h3>
              <button className="modal-close-btn" onClick={() => setShowApplyModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleApplySubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Leave Type *</label>
                  <select
                    className="form-select"
                    value={applyData.leaveType}
                    onChange={(e) => setApplyData({ ...applyData, leaveType: e.target.value })}
                  >
                    <option value="CL">Casual Leave (CL)</option>
                    <option value="SL">Sick Leave (SL)</option>
                    <option value="PL">Paid Leave (PL)</option>
                    <option value="LOP">Loss of Pay (LOP) - Unpaid Leave</option>
                  </select>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Start Date *</label>
                    <input
                      type="date"
                      className="form-input"
                      required
                      value={applyData.startDate}
                      onChange={(e) => setApplyData({ ...applyData, startDate: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date *</label>
                    <input
                      type="date"
                      className="form-input"
                      required
                      value={applyData.endDate}
                      onChange={(e) => setApplyData({ ...applyData, endDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Reason for Leave *</label>
                  <textarea
                    className="form-textarea"
                    required
                    rows="3"
                    placeholder="Provide details regarding your leave request..."
                    value={applyData.reason}
                    onChange={(e) => setApplyData({ ...applyData, reason: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowApplyModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" id="btn-submit-leave">
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= REJECT REASON MODAL ================= */}
      {showRejectModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Decline Leave Request</h3>
              <button className="modal-close-btn" onClick={() => setShowRejectModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Reason for Rejection *</label>
                <textarea
                  className="form-textarea"
                  required
                  rows="3"
                  placeholder="e.g. Critical release sprint or insufficient team coverage on requested dates..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowRejectModal(false)}>
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleReviewAction(rejectId, 'REJECTED', rejectionReason)}
                id="btn-confirm-reject-leave"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
