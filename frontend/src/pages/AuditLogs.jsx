import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  ShieldCheck,
  Mail,
  Search,
  Filter,
  Clock,
  Terminal,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function AuditLogs() {
  const [activeTab, setActiveTab] = useState('audit'); // 'audit' | 'email'
  const [logs, setLogs] = useState([]);
  const [emailLogs, setEmailLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [activeTab]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      if (activeTab === 'audit') {
        let q = '';
        if (search) q = `?search=${encodeURIComponent(search)}`;
        const res = await api.get(`/audit${q}`);
        if (res.success) setLogs(res.data);
      } else {
        const res = await api.get('/audit/emails');
        if (res.success) setEmailLogs(res.data);
      }
    } catch (err) {
      console.error('Audit fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  return (
    <div>
      {/* Header and Switcher */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 className="card-title">Compliance & System Audit Trails</h2>
            <div className="card-subtitle">
              Read-only immutable logs of user authorizations, payroll modifications, and email dispatches
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className={`btn ${activeTab === 'audit' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('audit')}
              id="tab-audit-logs"
            >
              <ShieldCheck size={16} /> Administrative Audit Logs
            </button>
            <button
              className={`btn ${activeTab === 'email' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('email')}
              id="tab-email-logs"
            >
              <Mail size={16} /> Notification Email Logs
            </button>
          </div>
        </div>

        {activeTab === 'audit' && (
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', marginTop: '16px', maxWidth: '400px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Filter by action, actor, or details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id="input-audit-search"
            />
            <button type="submit" className="btn btn-secondary">
              Search
            </button>
          </form>
        )}
      </div>

      {/* Audit Logs Table */}
      {activeTab === 'audit' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recorded System Actions ({logs.length})</h3>
          </div>
          {loading ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading audit entries...</div>
          ) : logs.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No audit logs found.</div>
          ) : (
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Action</th>
                    <th>Target Entity</th>
                    <th>Actor Account</th>
                    <th>Role</th>
                    <th>IP Address</th>
                    <th>Activity Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td>
                        <span className="badge badge-active">{log.action}</span>
                      </td>
                      <td style={{ fontWeight: '600' }}>{log.targetEntity}</td>
                      <td style={{ fontSize: '13px' }}>{log.userEmail || 'System'}</td>
                      <td>
                        <span className={`user-role-badge badge-role-${log.userRole?.toLowerCase() || 'employee'}`}>
                          {log.userRole || 'SYSTEM'}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {log.ipAddress || '127.0.0.1'}
                      </td>
                      <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                        {log.details || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Email Dispatch Logs */}
      {activeTab === 'email' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Dispatched Email Notification Logs ({emailLogs.length})</h3>
          </div>
          {loading ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading email logs...</div>
          ) : emailLogs.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No email dispatch logs found.</div>
          ) : (
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Sent At</th>
                    <th>Recipient</th>
                    <th>Subject</th>
                    <th>Template</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {emailLogs.map((e) => (
                    <tr key={e.id}>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(e.sentAt).toLocaleString()}
                      </td>
                      <td style={{ fontWeight: '600' }}>{e.to}</td>
                      <td style={{ fontSize: '13px' }}>{e.subject}</td>
                      <td>
                        <span className="badge badge-pending">{e.template}</span>
                      </td>
                      <td>
                        <span className={`badge ${e.status === 'SENT' ? 'badge-approved' : 'badge-rejected'}`}>
                          {e.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
