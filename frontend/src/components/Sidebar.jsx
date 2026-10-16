import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CalendarDays,
  CreditCard,
  BarChart3,
  ShieldCheck,
  UserCircle,
  LogOut,
  Building2,
  Clock,
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { user, logout, isAdminOrHr } = useAuth();

  const employee = user?.employee;
  const fullName = employee ? `${employee.firstName} ${employee.lastName}` : (user?.email?.split('@')[0] || 'User');
  const roleClass = user?.role === 'ADMIN' ? 'badge-role-admin' : (user?.role === 'HR' ? 'badge-role-hr' : 'badge-role-employee');

  return (
    <aside className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo-icon">
          <Building2 size={18} />
        </div>
        <div>
          <div className="sidebar-title">HRMS Portal</div>
          <div className="sidebar-subtitle">Management System</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="nav-section-title">Main</div>

        <div
          className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
          id="nav-dashboard"
        >
          <LayoutDashboard size={16} />
          <span>Dashboard</span>
        </div>

        {isAdminOrHr && (
          <div
            className={`nav-item ${activeTab === 'employees' ? 'active' : ''}`}
            onClick={() => setActiveTab('employees')}
            id="nav-employees"
          >
            <Users size={16} />
            <span>Employees</span>
          </div>
        )}

        <div
          className={`nav-item ${activeTab === 'attendance' ? 'active' : ''}`}
          onClick={() => setActiveTab('attendance')}
          id="nav-attendance"
        >
          <CalendarCheck size={16} />
          <span>Attendance</span>
        </div>

        <div
          className={`nav-item ${activeTab === 'shifts' ? 'active' : ''}`}
          onClick={() => setActiveTab('shifts')}
          id="nav-shifts"
        >
          <Clock size={16} />
          <span>Shifts & Schedule</span>
        </div>

        <div
          className={`nav-item ${activeTab === 'holidays' ? 'active' : ''}`}
          onClick={() => setActiveTab('holidays')}
          id="nav-holidays"
        >
          <CalendarDays size={16} />
          <span>Holidays & Calendar</span>
        </div>

        <div
          className={`nav-item ${activeTab === 'leaves' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaves')}
          id="nav-leaves"
        >
          <CalendarDays size={16} />
          <span>Leaves</span>
        </div>

        <div
          className={`nav-item ${activeTab === 'payroll' ? 'active' : ''}`}
          onClick={() => setActiveTab('payroll')}
          id="nav-payroll"
        >
          <CreditCard size={16} />
          <span>Payroll & Slips</span>
        </div>

        {isAdminOrHr && (
          <>
            <div className="nav-section-title">Admin</div>
            <div
              className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}
              id="nav-reports"
            >
              <BarChart3 size={16} />
              <span>Reports</span>
            </div>

            <div
              className={`nav-item ${activeTab === 'audit' ? 'active' : ''}`}
              onClick={() => setActiveTab('audit')}
              id="nav-audit"
            >
              <ShieldCheck size={16} />
              <span>Audit Logs</span>
            </div>
          </>
        )}

        <div className="nav-section-title">Account</div>
        <div
          className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
          id="nav-profile"
        >
          <UserCircle size={16} />
          <span>My Profile</span>
        </div>
      </nav>

      {/* Footer Profile & Logout */}
      <div className="sidebar-footer">
        <div className="user-snippet">
          <div className="user-avatar">
            {fullName.charAt(0).toUpperCase()}
          </div>
          <div className="user-info">
            <div className="user-name" title={fullName}>{fullName}</div>
            <span className={`user-role-badge ${roleClass}`}>{user?.role}</span>
          </div>
          <button
            onClick={logout}
            className="btn btn-secondary btn-sm"
            style={{ padding: '4px 8px', background: '#34495e', borderColor: '#4e6782', color: '#ecf0f1' }}
            title="Sign Out"
            id="btn-logout"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
