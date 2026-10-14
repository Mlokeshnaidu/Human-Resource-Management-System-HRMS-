import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import {
  UserCircle,
  Mail,
  Phone,
  Building,
  Calendar,
  CreditCard,
  Lock,
  Upload,
  Download,
  Trash2,
  FileText,
  CheckCircle,
  AlertCircle,
  Shield,
} from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);

  // Document Upload State
  const [docFile, setDocFile] = useState(null);
  const [docType, setDocType] = useState('ID_PROOF');
  const [uploadingDoc, setUploadingDoc] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/me');
      if (res.success) {
        setProfile(res.user);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setFeedback(null);

    if (newPassword !== confirmPassword) {
      setFeedback({ type: 'error', msg: 'New password and confirmation do not match.' });
      return;
    }

    setPassLoading(true);
    try {
      const res = await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      if (res.success) {
        setFeedback({ type: 'success', msg: 'Password updated successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setFeedback({ type: 'error', msg: err.message });
    } finally {
      setPassLoading(false);
    }
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!docFile || !profile?.employee?.id) return;

    setUploadingDoc(true);
    try {
      const data = new FormData();
      data.append('file', docFile);
      data.append('documentType', docType);

      const res = await api.post(`/employees/${profile.employee.id}/documents`, data);
      if (res.success) {
        setFeedback({ type: 'success', msg: 'Document uploaded successfully!' });
        setDocFile(null);
        fetchProfile();
      }
    } catch (err) {
      setFeedback({ type: 'error', msg: err.message });
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDownloadDoc = async (docId, fileName) => {
    try {
      const blob = await api.download(`/employees/documents/${docId}/download`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert(`Download failed: ${err.message}`);
    }
  };

  if (loading) {
    return <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading profile...</div>;
  }

  const emp = profile?.employee;

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

      {/* Header Profile Hero Card */}
      <div className="card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              fontWeight: '800',
              boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
            }}
          >
            {emp ? emp.firstName.charAt(0) : 'U'}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '800' }}>
                {emp ? `${emp.firstName} ${emp.lastName}` : profile?.email}
              </h2>
              <span className={`user-role-badge badge-role-${profile?.role.toLowerCase()}`}>
                {profile?.role}
              </span>
            </div>
            <div style={{ fontSize: '13.5px', opacity: 0.9, marginTop: '4px' }}>
              {emp?.designation || 'Staff Account'} • {emp?.department || 'Operations'} • Code: {emp?.employeeCode || 'N/A'}
            </div>
            <div style={{ fontSize: '12.5px', opacity: 0.7, marginTop: '4px' }}>
              Email: {profile?.email} • Joined: {emp?.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : 'Active'}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px' }}>
        {/* Left Column: Job & Compensation Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {emp && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Salary & Banking Details</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Base Monthly Salary</div>
                  <div style={{ fontWeight: '700', fontSize: '16px', color: 'var(--primary)' }}>
                    ₹{Number(emp.baseSalary).toLocaleString('en-IN')}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>HRA Allowance</div>
                  <div style={{ fontWeight: '600', fontSize: '15px' }}>
                    ₹{Number(emp.hra).toLocaleString('en-IN')}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Bank Account Number</div>
                  <div style={{ fontWeight: '600', fontSize: '13px' }}>
                    {emp.accountNumber || 'Pending Verification'}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Bank Name & IFSC</div>
                  <div style={{ fontWeight: '600', fontSize: '13px' }}>
                    {emp.bankName || 'HDFC Bank'} ({emp.ifscCode || 'HDFC0001234'})
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Personal Documents */}
          {emp && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">My Uploaded Documents ({emp.documents?.length || 0})</h3>
              </div>

              {/* Upload input */}
              <form onSubmit={handleUploadDocument} style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                <select
                  className="form-select"
                  style={{ width: '150px' }}
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                >
                  <option value="ID_PROOF">ID Proof</option>
                  <option value="RESUME">Resume</option>
                  <option value="CERTIFICATE">Certificate</option>
                  <option value="OTHER">Other Document</option>
                </select>
                <input
                  type="file"
                  className="form-input"
                  required
                  onChange={(e) => setDocFile(e.target.files[0])}
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn btn-primary" disabled={uploadingDoc}>
                  <Upload size={14} /> {uploadingDoc ? 'Uploading...' : 'Upload'}
                </button>
              </form>

              {emp.documents?.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No documents uploaded yet. Upload your ID proof or resumes above.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {emp.documents?.map((d) => (
                    <div
                      key={d.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FileText size={18} color="var(--primary)" />
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '13px' }}>{d.originalName}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {d.documentType} • {(d.fileSize / 1024).toFixed(1)} KB
                          </div>
                        </div>
                      </div>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleDownloadDoc(d.id, d.originalName)}
                      >
                        <Download size={13} /> Download
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Security & Password Update */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Security & Credentials</h3>
              <div className="card-subtitle">Update your portal account password</div>
            </div>
          </div>

          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label className="form-label">Current Password *</label>
              <input
                type="password"
                className="form-input"
                required
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                id="input-current-pass"
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Password *</label>
              <input
                type="password"
                className="form-input"
                required
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                id="input-new-pass"
              />
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Confirm New Password *</label>
              <input
                type="password"
                className="form-input"
                required
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                id="input-confirm-pass"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={passLoading}
              style={{ width: '100%', padding: '11px' }}
              id="btn-update-password"
            >
              <Lock size={15} /> {passLoading ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
