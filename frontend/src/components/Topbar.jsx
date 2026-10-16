import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import {
  Calendar,
  Bell,
  CheckCheck,
  Trash2,
  Settings,
  Megaphone,
  Clock,
  CreditCard,
  CalendarDays,
  AlertCircle,
  Radio,
  X,
  Check,
} from 'lucide-react';

export default function Topbar({ title, subtitle }) {
  const { user, isAdminOrHr } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL'); // ALL, UNREAD, ANNOUNCEMENT
  const [showPrefsModal, setShowPrefsModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Preferences state
  const [prefs, setPrefs] = useState({
    emailEnabled: true,
    leaveAlerts: true,
    payrollAlerts: true,
    attendanceAlerts: true,
    announcements: true,
  });

  // Broadcast state
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    message: '',
    targetDepartment: 'ALL',
    targetRole: 'ALL',
  });
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState('');

  const dropdownRef = useRef(null);

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.success) {
        setNotifications(res.data || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  const fetchPrefs = async () => {
    try {
      const res = await api.get('/notifications/preferences');
      if (res.success) {
        setPrefs(res.data);
      }
    } catch (err) {
      console.error('Failed to load notification preferences:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchPrefs();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const markAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const deleteNotification = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      const deleted = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (deleted && !deleted.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/notifications/preferences', prefs);
      setShowPrefsModal(false);
    } catch (err) {
      alert(err.message || 'Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastForm.title || !broadcastForm.message) {
      alert('Please enter title and message');
      return;
    }
    setBroadcasting(true);
    try {
      const res = await api.post('/notifications/broadcast', broadcastForm);
      setBroadcastSuccess(res.message || 'Broadcast delivered successfully');
      setTimeout(() => {
        setBroadcastSuccess('');
        setShowBroadcastModal(false);
        setBroadcastForm({
          title: '',
          message: '',
          targetDepartment: 'ALL',
          targetRole: 'ALL',
        });
        fetchNotifications();
      }, 1500);
    } catch (err) {
      alert(err.message || 'Failed to send broadcast');
    } finally {
      setBroadcasting(false);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'UNREAD') return !n.isRead;
    if (activeFilter === 'ANNOUNCEMENT') return n.isBroadcast || n.type === 'ANNOUNCEMENT';
    return true;
  });

  const getNotifIcon = (type) => {
    switch (type) {
      case 'LEAVE':
        return <CalendarDays size={15} color="#16a34a" />;
      case 'PAYROLL':
        return <CreditCard size={15} color="#7c3aed" />;
      case 'ATTENDANCE':
      case 'SHIFT':
        return <Clock size={15} color="#d97706" />;
      case 'ANNOUNCEMENT':
        return <Megaphone size={15} color="#0284c7" />;
      default:
        return <AlertCircle size={15} color="#0d6efd" />;
    }
  };

  const getNotifBg = (type) => {
    switch (type) {
      case 'LEAVE':
        return '#dcfce7';
      case 'PAYROLL':
        return '#f3e8ff';
      case 'ATTENDANCE':
      case 'SHIFT':
        return '#fef3c7';
      case 'ANNOUNCEMENT':
        return '#e0f2fe';
      default:
        return '#e7f1ff';
    }
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <header className="topbar">
      <div className="topbar-title-group">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ fontSize: '13px', color: '#6c757d', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Calendar size={14} color="#0d6efd" />
          <span>{todayStr}</span>
        </div>

        {/* In-App Notification Center Bell */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="topbar-bell-btn"
            id="btn-notifications-bell"
            title="Notifications"
            style={{
              position: 'relative',
              background: isOpen ? '#e9ecef' : 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '7px 9px',
              cursor: 'pointer',
              color: 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
          >
            <Bell size={17} color={unreadCount > 0 ? '#0d6efd' : '#6c757d'} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-5px',
                  background: '#dc3545',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: '700',
                  borderRadius: '10px',
                  padding: '1px 5px',
                  minWidth: '16px',
                  textAlign: 'center',
                  lineHeight: '1.2',
                }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {isOpen && (
            <div
              className="notification-dropdown"
              style={{
                position: 'absolute',
                top: '44px',
                right: '0',
                width: '360px',
                maxHeight: '480px',
                background: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.12)',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {/* Dropdown Header */}
              <div
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #e9ecef',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#ffffff',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-main)' }}>
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span
                      style={{
                        background: '#e7f1ff',
                        color: '#0d6efd',
                        padding: '2px 7px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600',
                      }}
                    >
                      {unreadCount} unread
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      title="Mark all as read"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#0d6efd')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                    >
                      <CheckCheck size={16} />
                    </button>
                  )}
                  {isAdminOrHr && (
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        setShowBroadcastModal(true);
                      }}
                      title="Send Broadcast Announcement"
                      style={{
                        background: '#e7f1ff',
                        border: '1px solid #b6d4fe',
                        color: '#0d6efd',
                        cursor: 'pointer',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Megaphone size={12} />
                      <span>Broadcast</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      setShowPrefsModal(true);
                    }}
                    title="Notification Settings"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Settings size={15} />
                  </button>
                </div>
              </div>

              {/* Filter Tabs */}
              <div
                style={{
                  display: 'flex',
                  borderBottom: '1px solid #e9ecef',
                  padding: '6px 12px',
                  gap: '4px',
                  background: '#f8f9fa',
                }}
              >
                {['ALL', 'UNREAD', 'ANNOUNCEMENT'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveFilter(tab)}
                    style={{
                      background: activeFilter === tab ? '#ffffff' : 'transparent',
                      color: activeFilter === tab ? '#0d6efd' : 'var(--text-muted)',
                      border: activeFilter === tab ? '1px solid #e9ecef' : '1px solid transparent',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    {tab === 'ALL' ? 'All' : tab === 'UNREAD' ? 'Unread' : 'Announcements'}
                  </button>
                ))}
              </div>

              {/* Notifications List */}
              <div
                style={{
                  overflowY: 'auto',
                  maxHeight: '340px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {filteredNotifications.length === 0 ? (
                  <div
                    style={{
                      padding: '40px 20px',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      fontSize: '13px',
                    }}
                  >
                    <Bell size={24} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                    <p style={{ margin: 0 }}>No notifications in this view</p>
                  </div>
                ) : (
                  filteredNotifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => !n.isRead && markAsRead(n.id)}
                      style={{
                        padding: '11px 14px',
                        borderBottom: '1px solid #f1f3f5',
                        background: n.isRead ? '#ffffff' : '#f8fbff',
                        display: 'flex',
                        gap: '10px',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = n.isRead
                          ? '#ffffff'
                          : '#f8fbff')
                      }
                    >
                      <div
                        style={{
                          padding: '7px',
                          borderRadius: '6px',
                          background: getNotifBg(n.type),
                          height: 'fit-content',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {getNotifIcon(n.type)}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '2px',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '12.5px',
                              fontWeight: n.isRead ? '500' : '700',
                              color: 'var(--text-main)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '180px',
                            }}
                          >
                            {n.title}
                          </span>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            {formatTimeAgo(n.createdAt)}
                          </span>
                        </div>

                        <p
                          style={{
                            fontSize: '11.5px',
                            color: 'var(--text-muted)',
                            lineHeight: '1.4',
                            margin: 0,
                          }}
                        >
                          {n.message}
                        </p>

                        {n.isBroadcast && (
                          <span
                            style={{
                              display: 'inline-block',
                              marginTop: '4px',
                              fontSize: '9.5px',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              background: '#e0f2fe',
                              color: '#0284c7',
                              fontWeight: '600',
                            }}
                          >
                            Broadcast • {n.targetDepartment || 'All'}
                          </span>
                        )}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          paddingLeft: '4px',
                        }}
                      >
                        {!n.isRead ? (
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              background: '#0d6efd',
                            }}
                          />
                        ) : (
                          <span style={{ width: '6px', height: '6px' }} />
                        )}
                        <button
                          onClick={(e) => deleteNotification(n.id, e)}
                          title="Delete"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#adb5bd',
                            cursor: 'pointer',
                            padding: '2px',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#dc3545')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = '#adb5bd')}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Dropdown Footer */}
              <div
                style={{
                  padding: '9px 16px',
                  background: '#f8f9fa',
                  borderTop: '1px solid #e9ecef',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>In-app notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#0d6efd',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Clear all unread
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notification Preferences Modal */}
      {showPrefsModal && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={18} color="#0d6efd" />
                <h3>Notification Preferences</h3>
              </div>
              <button
                className="btn-icon"
                onClick={() => setShowPrefsModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePreferences}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                  Customize which notifications you receive in-app and via email.
                </p>

                {[
                  { key: 'emailEnabled', label: 'Email Notifications', desc: 'Receive HTML email notifications for major events' },
                  { key: 'leaveAlerts', label: 'Leave Status Updates', desc: 'Alerts when leaves are applied, approved, or rejected' },
                  { key: 'payrollAlerts', label: 'Payroll & Salary Slips', desc: 'Alerts when monthly payroll is processed or disbursed' },
                  { key: 'attendanceAlerts', label: 'Attendance & Shift Alerts', desc: 'Late check-in warnings, early exits, and overtime logs' },
                  { key: 'announcements', label: 'Admin Broadcasts', desc: 'Company-wide and department announcements' },
                ].map(({ key, label, desc }) => (
                  <div
                    key={key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      background: '#f8f9fa',
                      borderRadius: '8px',
                      border: '1px solid #e9ecef',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>
                        {label}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{desc}</div>
                    </div>
                    <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '38px', height: '20px' }}>
                      <input
                        type="checkbox"
                        checked={prefs[key]}
                        onChange={(e) => setPrefs({ ...prefs, [key]: e.target.checked })}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          cursor: 'pointer',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: prefs[key] ? '#0d6efd' : '#cbd5e1',
                          transition: '0.2s',
                          borderRadius: '20px',
                        }}
                      >
                        <span
                          style={{
                            position: 'absolute',
                            content: '""',
                            height: '14px',
                            width: '14px',
                            left: prefs[key] ? '20px' : '3px',
                            bottom: '3px',
                            backgroundColor: 'white',
                            transition: '0.2s',
                            borderRadius: '50%',
                          }}
                        />
                      </span>
                    </label>
                  </div>
                ))}
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPrefsModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Broadcast Announcement Modal */}
      {showBroadcastModal && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Megaphone size={18} color="#0d6efd" />
                <h3>Compose Broadcast Announcement</h3>
              </div>
              <button
                className="btn-icon"
                onClick={() => setShowBroadcastModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {broadcastSuccess ? (
              <div style={{ padding: '30px 20px', textAlign: 'center' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: '#d1e7dd',
                    color: '#198754',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                  }}
                >
                  <Check size={24} />
                </div>
                <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-main)', marginBottom: '4px' }}>
                  {broadcastSuccess}
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  All targeted recipients will receive this announcement instantly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendBroadcast}>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Target Department</label>
                      <select
                        className="form-control"
                        value={broadcastForm.targetDepartment}
                        onChange={(e) =>
                          setBroadcastForm({ ...broadcastForm, targetDepartment: e.target.value })
                        }
                      >
                        <option value="ALL">Entire Organization (ALL)</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Human Resources">Human Resources</option>
                        <option value="Finance">Finance</option>
                        <option value="Product & Design">Product & Design</option>
                        <option value="Marketing">Marketing</option>
                        <option value="DevOps">DevOps</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Target Role</label>
                      <select
                        className="form-control"
                        value={broadcastForm.targetRole}
                        onChange={(e) =>
                          setBroadcastForm({ ...broadcastForm, targetRole: e.target.value })
                        }
                      >
                        <option value="ALL">All Roles</option>
                        <option value="EMPLOYEE">Employees Only</option>
                        <option value="HR">HR & Managers</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Announcement Title</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Town Hall Meeting, Policy Update, Festive Notice"
                      value={broadcastForm.title}
                      onChange={(e) =>
                        setBroadcastForm({ ...broadcastForm, title: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Announcement Message</label>
                    <textarea
                      className="form-control"
                      rows={4}
                      placeholder="Detailed announcement information..."
                      value={broadcastForm.message}
                      onChange={(e) =>
                        setBroadcastForm({ ...broadcastForm, message: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowBroadcastModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={broadcasting}>
                    {broadcasting ? 'Delivering...' : 'Send Broadcast'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
