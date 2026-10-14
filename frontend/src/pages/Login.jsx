import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Building2, User, Lock, ArrowRight } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@hrms.com');
  const [password, setPassword] = useState('Admin@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setRole = (role) => {
    setError('');
    if (role === 'ADMIN') {
      setEmail('admin@hrms.com');
      setPassword('Admin@123');
    } else if (role === 'HR') {
      setEmail('hr@hrms.com');
      setPassword('Hr@123');
    } else if (role === 'EMPLOYEE') {
      setEmail('employee@hrms.com');
      setPassword('Employee@123');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f0f2f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: '#ffffff',
          borderRadius: '6px',
          border: '1px solid #ced4da',
          padding: '28px',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
        }}
      >
        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              backgroundColor: '#0d6efd',
              borderRadius: '4px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              marginBottom: '10px',
            }}
          >
            <Building2 size={24} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#212529' }}>
            HRMS Portal
          </h2>
          <p style={{ fontSize: '13px', color: '#6c757d', marginTop: '4px' }}>
            Human Resource Management System
          </p>
        </div>

        {/* Role Selection Buttons (Admin, HR, Employee) */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#495057', marginBottom: '6px' }}>
            Select Role:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setRole('ADMIN')}
              style={{
                padding: '8px 4px',
                fontSize: '12px',
                fontWeight: '600',
                borderRadius: '4px',
                border: email === 'admin@hrms.com' ? '2px solid #0d6efd' : '1px solid #ced4da',
                backgroundColor: email === 'admin@hrms.com' ? '#e7f1ff' : '#ffffff',
                color: email === 'admin@hrms.com' ? '#0d6efd' : '#495057',
                cursor: 'pointer',
              }}
              id="role-btn-admin"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => setRole('HR')}
              style={{
                padding: '8px 4px',
                fontSize: '12px',
                fontWeight: '600',
                borderRadius: '4px',
                border: email === 'hr@hrms.com' ? '2px solid #0d6efd' : '1px solid #ced4da',
                backgroundColor: email === 'hr@hrms.com' ? '#e7f1ff' : '#ffffff',
                color: email === 'hr@hrms.com' ? '#0d6efd' : '#495057',
                cursor: 'pointer',
              }}
              id="role-btn-hr"
            >
              HR
            </button>
            <button
              type="button"
              onClick={() => setRole('EMPLOYEE')}
              style={{
                padding: '8px 4px',
                fontSize: '12px',
                fontWeight: '600',
                borderRadius: '4px',
                border: email === 'employee@hrms.com' ? '2px solid #0d6efd' : '1px solid #ced4da',
                backgroundColor: email === 'employee@hrms.com' ? '#e7f1ff' : '#ffffff',
                color: email === 'employee@hrms.com' ? '#0d6efd' : '#495057',
                cursor: 'pointer',
              }}
              id="role-btn-employee"
            >
              Employee
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: '4px',
              backgroundColor: '#f8d7da',
              border: '1px solid #f5c2c7',
              color: '#842029',
              fontSize: '13px',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={14} color="#6c757d" /> Email Address
            </label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter email"
              id="input-login-email"
            />
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={14} color="#6c757d" /> Password
            </label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter password"
              id="input-login-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '10px', fontSize: '14px' }}
            id="btn-submit-login"
          >
            {loading ? 'Logging in...' : 'Sign In'}
            {!loading && <ArrowRight size={15} />}
          </button>
        </form>

        <div style={{ marginTop: '18px', paddingTop: '12px', borderTop: '1px solid #e9ecef', fontSize: '11.5px', color: '#6c757d', lineHeight: '1.6' }}>
          <div><strong>Credentials:</strong></div>
          <div>Admin: admin@hrms.com / Admin@123</div>
          <div>HR: hr@hrms.com / Hr@123</div>
          <div>Employee: employee@hrms.com / Employee@123 (Kiran V)</div>
        </div>
      </div>
    </div>
  );
}
