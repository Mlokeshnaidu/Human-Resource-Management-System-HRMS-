import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Eye,
  Edit,
  Power,
  Upload,
  Download,
  Trash2,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
} from 'lucide-react';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedDocFile, setSelectedDocFile] = useState(null);
  const [documentType, setDocumentType] = useState('RESUME');
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Add Employee Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: 'Welcome@123',
    role: 'EMPLOYEE',
    phone: '',
    department: 'Engineering',
    designation: '',
    joiningDate: new Date().toISOString().split('T')[0],
    baseSalary: 60000,
    hra: 18000,
    allowances: 6000,
    pfDeduction: 4320,
    taxDeduction: 3500,
    bankName: 'HDFC Bank',
    accountNumber: '',
    ifscCode: 'HDFC0001234',
    emergencyContact: '',
    address: '',
  });

  useEffect(() => {
    fetchEmployees();
  }, [department, status]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      let query = `?department=${department}&status=${status}`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      const res = await api.get(`/employees${query}`);
      if (res.success) {
        setEmployees(res.data);
      }
    } catch (err) {
      console.error('Fetch employees error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchEmployees();
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setFeedback(null);
    try {
      const res = await api.post('/employees', formData);
      if (res.success) {
        setFeedback({ type: 'success', msg: `Employee ${res.data.employeeCode} onboarded successfully! Welcome email sent.` });
        setShowAddModal(false);
        fetchEmployees();
        // Reset
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          password: 'Welcome@123',
          role: 'EMPLOYEE',
          phone: '',
          department: 'Engineering',
          designation: '',
          joiningDate: new Date().toISOString().split('T')[0],
          baseSalary: 60000,
          hra: 18000,
          allowances: 6000,
          pfDeduction: 4320,
          taxDeduction: 3500,
          bankName: 'HDFC Bank',
          accountNumber: '',
          ifscCode: 'HDFC0001234',
          emergencyContact: '',
          address: '',
        });
      }
    } catch (err) {
      setFeedback({ type: 'error', msg: err.message });
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    if (!window.confirm(`Are you sure you want to change status to ${currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'}?`)) {
      return;
    }
    try {
      const res = await api.patch(`/employees/${id}/status`);
      if (res.success) {
        setFeedback({ type: 'success', msg: res.message });
        fetchEmployees();
      }
    } catch (err) {
      setFeedback({ type: 'error', msg: err.message });
    }
  };

  const handleOpenViewModal = async (emp) => {
    try {
      const res = await api.get(`/employees/${emp.id}`);
      if (res.success) {
        setSelectedEmployee(res.data);
        setShowViewModal(true);
      }
    } catch (err) {
      alert(`Failed to load employee details: ${err.message}`);
    }
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!selectedDocFile || !selectedEmployee) return;

    setUploadingDoc(true);
    try {
      const data = new FormData();
      data.append('file', selectedDocFile);
      data.append('documentType', documentType);

      const res = await api.post(`/employees/${selectedEmployee.id}/documents`, data);
      if (res.success) {
        alert('Document uploaded successfully!');
        setSelectedDocFile(null);
        // Refresh selected employee
        handleOpenViewModal(selectedEmployee);
      }
    } catch (err) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Delete this employee document permanently?')) return;
    try {
      await api.delete(`/employees/documents/${docId}`);
      handleOpenViewModal(selectedEmployee);
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
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
          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', flex: '1', maxWidth: '420px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Search by name, code, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '36px' }}
                id="input-employee-search"
              />
            </div>
            <button type="submit" className="btn btn-secondary" id="btn-search-employees">
              Search
            </button>
          </form>

          {/* Department and Status filter */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <select
              className="form-select"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              style={{ width: '180px' }}
              id="select-dept-filter"
            >
              <option value="ALL">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Human Resources">Human Resources</option>
              <option value="Product & Design">Product & Design</option>
              <option value="Finance">Finance</option>
              <option value="Sales & Marketing">Sales & Marketing</option>
              <option value="Operations">Operations</option>
            </select>

            <select
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{ width: '140px' }}
              id="select-status-filter"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            <button
              className="btn btn-primary"
              onClick={() => setShowAddModal(true)}
              id="btn-open-onboard-modal"
            >
              <UserPlus size={16} /> Onboard Employee
            </button>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Employee Directory ({employees.length})</h2>
            <div className="card-subtitle">Manage company workforce profiles, compensation, and documents</div>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading employees...</div>
        ) : employees.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No employees found matching filter criteria.</div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Role</th>
                  <th>Joining Date</th>
                  <th>Base Salary</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="user-avatar" style={{ width: '34px', height: '34px', fontSize: '13px' }}>
                          {emp.firstName.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                            {emp.firstName} {emp.lastName}
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                            {emp.employeeCode} • {emp.user?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{emp.department}</td>
                    <td>{emp.designation}</td>
                    <td>
                      <span className={`user-role-badge badge-role-${emp.user?.role?.toLowerCase()}`}>
                        {emp.user?.role}
                      </span>
                    </td>
                    <td style={{ fontSize: '12.5px' }}>
                      {new Date(emp.joiningDate).toLocaleDateString()}
                    </td>
                    <td style={{ fontWeight: '600' }}>
                      ₹{Number(emp.baseSalary).toLocaleString('en-IN')}
                    </td>
                    <td>
                      <span className={`badge badge-${emp.status?.toLowerCase()}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '5px 8px' }}
                          title="View Profile & Documents"
                          onClick={() => handleOpenViewModal(emp)}
                          id={`btn-view-${emp.id}`}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className={`btn btn-sm ${emp.status === 'ACTIVE' ? 'btn-danger' : 'btn-success'}`}
                          style={{ padding: '5px 8px' }}
                          title={emp.status === 'ACTIVE' ? 'Deactivate Employee' : 'Activate Employee'}
                          onClick={() => handleToggleStatus(emp.id, emp.status)}
                          id={`btn-status-${emp.id}`}
                        >
                          <Power size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= ONBOARD EMPLOYEE MODAL ================= */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '720px' }}>
            <div className="modal-header">
              <h3>Onboard New Employee</h3>
              <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateEmployee}>
              <div className="modal-body">
                <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '12px', color: 'var(--primary)' }}>
                  1. Personal & Access Details
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">First Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="e.g. John"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="e.g. Doe"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address (Login) *</label>
                    <input
                      type="email"
                      className="form-input"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john.doe@company.com"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Initial Password</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Portal Role *</label>
                    <select
                      className="form-select"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      <option value="EMPLOYEE">Employee</option>
                      <option value="HR">HR Specialist</option>
                      <option value="ADMIN">Administrator</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1 555-0199"
                    />
                  </div>
                </div>

                <div style={{ fontWeight: '700', fontSize: '14px', margin: '18px 0 12px 0', color: 'var(--primary)' }}>
                  2. Job & Organizational Placement
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Department *</label>
                    <select
                      className="form-select"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    >
                      <option value="Engineering">Engineering</option>
                      <option value="Human Resources">Human Resources</option>
                      <option value="Product & Design">Product & Design</option>
                      <option value="Finance">Finance</option>
                      <option value="Sales & Marketing">Sales & Marketing</option>
                      <option value="Operations">Operations</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Designation *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      placeholder="e.g. Senior Software Engineer"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date of Joining *</label>
                    <input
                      type="date"
                      className="form-input"
                      required
                      value={formData.joiningDate}
                      onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ fontWeight: '700', fontSize: '14px', margin: '18px 0 12px 0', color: 'var(--primary)' }}>
                  3. Compensation & Banking
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Base Monthly Salary (₹) *</label>
                    <input
                      type="number"
                      className="form-input"
                      required
                      value={formData.baseSalary}
                      onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">HRA (₹)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.hra}
                      onChange={(e) => setFormData({ ...formData, hra: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bank Account Number</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                      placeholder="12 digit account number"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bank IFSC Code</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.ifscCode}
                      onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" id="btn-submit-onboard">
                  Complete Onboarding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= VIEW PROFILE & DOCUMENTS MODAL ================= */}
      {showViewModal && selectedEmployee && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <div>
                <h3>
                  {selectedEmployee.firstName} {selectedEmployee.lastName} ({selectedEmployee.employeeCode})
                </h3>
                <span className="card-subtitle">{selectedEmployee.designation} • {selectedEmployee.department}</span>
              </div>
              <button className="modal-close-btn" onClick={() => setShowViewModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {/* Profile Overview */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Email</div>
                  <div style={{ fontWeight: '600', fontSize: '13px' }}>{selectedEmployee.user?.email}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Phone</div>
                  <div style={{ fontWeight: '600', fontSize: '13px' }}>{selectedEmployee.phone || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Status</div>
                  <span className={`badge badge-${selectedEmployee.status.toLowerCase()}`}>{selectedEmployee.status}</span>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Base Salary</div>
                  <div style={{ fontWeight: '600', fontSize: '13px' }}>₹{Number(selectedEmployee.baseSalary).toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Bank Account</div>
                  <div style={{ fontWeight: '600', fontSize: '13px' }}>{selectedEmployee.accountNumber || 'Pending'} ({selectedEmployee.bankName})</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Joining Date</div>
                  <div style={{ fontWeight: '600', fontSize: '13px' }}>{new Date(selectedEmployee.joiningDate).toLocaleDateString()}</div>
                </div>
              </div>

              {/* Documents Section */}
              <div style={{ fontWeight: '700', fontSize: '15px', marginBottom: '14px' }}>
                Employee Documents Repository ({selectedEmployee.documents?.length || 0})
              </div>

              {/* Upload document box */}
              <form onSubmit={handleUploadDocument} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px', background: '#f1f5f9', padding: '12px', borderRadius: '10px' }}>
                <select
                  className="form-select"
                  style={{ width: '160px' }}
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                >
                  <option value="RESUME">Resume</option>
                  <option value="ID_PROOF">ID Proof</option>
                  <option value="OFFER_LETTER">Offer Letter</option>
                  <option value="CERTIFICATE">Certificate</option>
                  <option value="OTHER">Other</option>
                </select>
                <input
                  type="file"
                  className="form-input"
                  style={{ flex: 1 }}
                  required
                  onChange={(e) => setSelectedDocFile(e.target.files[0])}
                />
                <button type="submit" className="btn btn-primary" disabled={uploadingDoc}>
                  <Upload size={14} /> {uploadingDoc ? 'Uploading...' : 'Upload'}
                </button>
              </form>

              {/* Uploaded Documents List */}
              {selectedEmployee.documents?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No documents uploaded for this employee yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedEmployee.documents?.map((doc) => (
                    <div
                      key={doc.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: '#ffffff',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FileText size={18} color="var(--primary)" />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '600' }}>{doc.originalName}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {doc.documentType} • {(doc.fileSize / 1024).toFixed(1)} KB • {new Date(doc.uploadedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleDownloadDoc(doc.id, doc.originalName)}
                          title="Download"
                        >
                          <Download size={14} /> Download
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteDocument(doc.id)}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowViewModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
