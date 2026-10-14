import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Attendance from './pages/Attendance';
import Leaves from './pages/Leaves';
import Payroll from './pages/Payroll';
import Reports from './pages/Reports';
import AuditLogs from './pages/AuditLogs';
import Profile from './pages/Profile';

function MainLayout() {
  const { user, loading, isAdminOrHr } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f172a',
          color: 'white',
          fontSize: '16px',
          fontWeight: '600',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '16px', fontSize: '28px' }}>🏢</div>
          <div>Initializing Techflow HRMS Portal...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const getPageMeta = () => {
    switch (activeTab) {
      case 'dashboard':
        return {
          title: isAdminOrHr ? 'Administrative Overview Dashboard' : 'My Employee Workplace',
          subtitle: isAdminOrHr ? 'Workforce metrics, live attendance summary, and quick management' : 'Personal punch clock, leave balances, and salary summary',
        };
      case 'employees':
        return {
          title: 'Employee Directory & Onboarding',
          subtitle: 'Manage organizational headcount, designations, compensation, and personnel files',
        };
      case 'attendance':
        return {
          title: 'Attendance & Time Tracking',
          subtitle: 'Daily check-in / check-out records, working hours calculation, and administrative overrides',
        };
      case 'leaves':
        return {
          title: 'Leave Management & Approvals',
          subtitle: 'Leave requests, quota balance tracking, and Loss of Pay (LOP) calculations',
        };
      case 'payroll':
        return {
          title: 'Payroll Processing & Salary Slips',
          subtitle: 'Automated monthly compensation generation, LOP deductions, salary locking, and PDF generation',
        };
      case 'reports':
        return {
          title: 'Reports & Analytics Intelligence',
          subtitle: 'Attendance rates, leave utilization analytics, and CSV/PDF data exports',
        };
      case 'audit':
        return {
          title: 'Compliance & Audit Trail',
          subtitle: 'Read-only chronological record of all administrative actions and email notifications',
        };
      case 'profile':
        return {
          title: 'My Profile & Account Security',
          subtitle: 'Personal details, compensation structure, documents, and password management',
        };
      default:
        return { title: 'Techflow HRMS', subtitle: 'Enterprise Suite' };
    }
  };

  const { title, subtitle } = getPageMeta();

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="main-wrapper">
        <Topbar title={title} subtitle={subtitle} />
        <main className="content-body">
          {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} />}
          {activeTab === 'employees' && isAdminOrHr && <Employees />}
          {activeTab === 'attendance' && <Attendance />}
          {activeTab === 'leaves' && <Leaves />}
          {activeTab === 'payroll' && <Payroll />}
          {activeTab === 'reports' && isAdminOrHr && <Reports />}
          {activeTab === 'audit' && isAdminOrHr && <AuditLogs />}
          {activeTab === 'profile' && <Profile />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
