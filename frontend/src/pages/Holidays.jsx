import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Search,
  Trash2,
  Edit2,
  Info,
  CalendarDays,
  Building,
  MapPin,
  Clock,
  Sparkles,
  X,
  Check,
} from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Holidays() {
  const { isAdminOrHr } = useAuth();

  const now = new Date();
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1); // 1-12
  const [viewMode, setViewMode] = useState('monthly'); // 'monthly' | 'yearly'
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const [calendarSummary, setCalendarSummary] = useState(null);
  const [yearHolidays, setYearHolidays] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    endDate: '',
    type: 'COMPANY',
    region: 'ALL',
    description: '',
    isOptional: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [selectedHolidayDetails, setSelectedHolidayDetails] = useState(null);

  const fetchCalendarSummary = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/holidays/calendar-summary?year=${currentYear}&month=${currentMonth}`);
      if (res.success) {
        setCalendarSummary(res.data);
      }
    } catch (err) {
      console.error('Failed to load calendar summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchYearHolidays = async () => {
    try {
      const res = await api.get(`/holidays?year=${currentYear}`);
      if (res.success) {
        setYearHolidays(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load yearly holidays:', err);
    }
  };

  useEffect(() => {
    fetchCalendarSummary();
    fetchYearHolidays();
  }, [currentYear, currentMonth]);

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleOpenAddModal = () => {
    setEditingHoliday(null);
    setFormData({
      name: '',
      date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`,
      endDate: '',
      type: 'COMPANY',
      region: 'ALL',
      description: '',
      isOptional: false,
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (h) => {
    setEditingHoliday(h);
    setFormData({
      name: h.name,
      date: h.date,
      endDate: h.endDate || h.date,
      type: h.type,
      region: h.region,
      description: h.description || '',
      isOptional: !!h.isOptional,
    });
    setShowModal(true);
  };

  const handleSubmitHoliday = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingHoliday) {
        await api.put(`/holidays/${editingHoliday.id}`, formData);
      } else {
        await api.post('/holidays', formData);
      }
      setShowModal(false);
      fetchCalendarSummary();
      fetchYearHolidays();
    } catch (err) {
      alert(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteHoliday = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await api.delete(`/holidays/${id}`);
      fetchCalendarSummary();
      fetchYearHolidays();
    } catch (err) {
      alert(err.message || 'Failed to delete');
    }
  };

  // Build grid for monthly view
  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay(); // 0 is Sun
  const daysInMonth = calendarSummary?.totalDays || new Date(currentYear, currentMonth, 0).getDate();

  const calendarDays = calendarSummary?.calendarDays || [];
  const dayMap = {};
  calendarDays.forEach((cd) => {
    dayMap[cd.day] = cd;
  });

  const filteredYearlyHolidays = yearHolidays.filter((h) => {
    const matchesType = typeFilter === 'ALL' || h.type === typeFilter;
    const matchesSearch =
      searchTerm === '' ||
      h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (h.description && h.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (h.region && h.region.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const getTypeBadge = (type, isOptional) => {
    if (isOptional) {
      return (
        <span
          style={{
            background: '#f3e8ff',
            color: '#6f42c1',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: '600',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <Sparkles size={11} /> Optional Holiday
        </span>
      );
    }
    if (type === 'REGIONAL') {
      return (
        <span
          style={{
            background: '#fff3cd',
            color: '#664d03',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: '600',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <MapPin size={11} /> Regional
        </span>
      );
    }
    return (
      <span
        style={{
          background: '#d1e7dd',
          color: '#0f5132',
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: '600',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <Building size={11} /> Company-Wide
      </span>
    );
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Unified Calendar Card */}
      <div className="card" style={{ padding: '20px' }}>
        {/* Calendar Header Toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
            marginBottom: '18px',
            paddingBottom: '16px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          {/* Left: Navigation and Month Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {viewMode === 'monthly' ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    onClick={handlePrevMonth}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '6px 8px', display: 'flex', alignItems: 'center' }}
                    title="Previous Month"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '6px 8px', display: 'flex', alignItems: 'center' }}
                    title="Next Month"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', margin: 0, minWidth: '150px' }}>
                  {MONTH_NAMES[currentMonth - 1]} {currentYear}
                </h2>

                <button
                  onClick={() => {
                    setCurrentMonth(now.getMonth() + 1);
                    setCurrentYear(now.getFullYear());
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '11px', padding: '4px 10px' }}
                >
                  Today
                </button>

                {/* Compact KPI Badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '6px' }}>
                  <span
                    style={{
                      background: '#f8f9fa',
                      border: '1px solid #e9ecef',
                      color: 'var(--text-muted)',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '11.5px',
                      fontWeight: '600',
                    }}
                  >
                    {calendarSummary?.totalDays || 30} Days
                  </span>
                  <span
                    style={{
                      background: '#e8f5e9',
                      border: '1px solid #c8e6c9',
                      color: '#15803d',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '11.5px',
                      fontWeight: '600',
                    }}
                  >
                    {calendarSummary?.holidayDays || 0} Holidays
                  </span>
                  <span
                    style={{
                      background: '#e7f1ff',
                      border: '1px solid #b6d4fe',
                      color: '#0d6efd',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '11.5px',
                      fontWeight: '600',
                    }}
                  >
                    {calendarSummary?.standardWorkingDays || 22} Working Days
                  </span>
                </div>
              </>
            ) : (
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
                Corporate Holiday Schedule ({currentYear})
              </h2>
            )}
          </div>

          {/* Right: View Toggle and Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                display: 'inline-flex',
                background: '#f1f5f9',
                borderRadius: '8px',
                padding: '3px',
                gap: '2px',
              }}
            >
              <button
                onClick={() => setViewMode('monthly')}
                style={{
                  border: 'none',
                  background: viewMode === 'monthly' ? '#ffffff' : 'transparent',
                  color: viewMode === 'monthly' ? '#0d6efd' : 'var(--text-muted)',
                  boxShadow: viewMode === 'monthly' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  borderRadius: '6px',
                  padding: '5px 12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Month
              </button>
              <button
                onClick={() => setViewMode('yearly')}
                style={{
                  border: 'none',
                  background: viewMode === 'yearly' ? '#ffffff' : 'transparent',
                  color: viewMode === 'yearly' ? '#0d6efd' : 'var(--text-muted)',
                  boxShadow: viewMode === 'yearly' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  borderRadius: '6px',
                  padding: '5px 12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Year Schedule
              </button>
            </div>

            {isAdminOrHr && (
              <button
                onClick={handleOpenAddModal}
                className="btn btn-primary btn-sm"
                id="btn-add-holiday"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={15} />
                <span>+ Add Holiday</span>
              </button>
            )}
          </div>
        </div>

        {/* MONTHLY CALENDAR VIEW */}
        {viewMode === 'monthly' && (
          <div
            style={{
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              overflow: 'hidden',
            }}
          >
            {/* Weekday Header Row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                background: '#f8f9fa',
                borderBottom: '1px solid #e9ecef',
                textAlign: 'center',
              }}
            >
              {DAYS_OF_WEEK.map((day, idx) => (
                <div
                  key={day}
                  style={{
                    padding: '8px 4px',
                    fontWeight: '700',
                    fontSize: '11.5px',
                    color: idx === 0 || idx === 6 ? '#dc3545' : 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                  }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Day Grid (1px gap border style) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '1px',
                background: '#e9ecef',
              }}
            >
              {/* Padding empty boxes for days before month start */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  style={{
                    minHeight: '100px',
                    background: '#fcfcfc',
                  }}
                />
              ))}

              {/* Real Month Days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateInfo = dayMap[dayNum];
                const isWeekend = (firstDayOfMonth + i) % 7 === 0 || (firstDayOfMonth + i) % 7 === 6;
                const hasHoliday = dateInfo?.isHoliday;
                const holiday = dateInfo?.holiday;

                const isToday =
                  now.getFullYear() === currentYear &&
                  now.getMonth() + 1 === currentMonth &&
                  now.getDate() === dayNum;

                let cellBg = isWeekend ? '#fbfcfd' : '#ffffff';
                if (isToday) {
                  cellBg = '#f0f7ff';
                }

                return (
                  <div
                    key={`day-${dayNum}`}
                    style={{
                      minHeight: '102px',
                      background: cellBg,
                      padding: '8px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'background 0.15s ease',
                      position: 'relative',
                    }}
                  >
                    {/* Top Row: Day Number & Today indicator */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      {isToday ? (
                        <span
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: '#0d6efd',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: '700',
                          }}
                        >
                          {dayNum}
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: '600',
                            color: isWeekend ? '#adb5bd' : 'var(--text-main)',
                          }}
                        >
                          {dayNum}
                        </span>
                      )}

                      {isToday && (
                        <span
                          style={{
                            fontSize: '9.5px',
                            color: '#0d6efd',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            letterSpacing: '0.4px',
                          }}
                        >
                          Today
                        </span>
                      )}

                      {isWeekend && !hasHoliday && (
                        <span style={{ fontSize: '9px', color: '#ced4da' }}>
                          Weekend
                        </span>
                      )}
                    </div>

                    {/* Holiday Chip */}
                    {hasHoliday && holiday && (
                      <div
                        onClick={() => setSelectedHolidayDetails(holiday)}
                        style={{
                          marginTop: '6px',
                          padding: '6px 8px',
                          borderRadius: '5px',
                          background: holiday.isOptional
                            ? '#faf5ff'
                            : holiday.type === 'REGIONAL'
                            ? '#fffbeb'
                            : '#f0fdf4',
                          borderLeft: `3px solid ${
                            holiday.isOptional
                              ? '#9333ea'
                              : holiday.type === 'REGIONAL'
                              ? '#d97706'
                              : '#16a34a'
                          }`,
                          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                          cursor: 'pointer',
                          transition: 'transform 0.1s ease',
                        }}
                        title={holiday.description || holiday.name}
                      >
                        <div
                          style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            color: holiday.isOptional
                              ? '#7e22ce'
                              : holiday.type === 'REGIONAL'
                              ? '#b45309'
                              : '#15803d',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {holiday.name}
                        </div>
                        <div
                          style={{
                            fontSize: '9.5px',
                            color: holiday.isOptional
                              ? '#9333ea'
                              : holiday.type === 'REGIONAL'
                              ? '#92400e'
                              : '#166534',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginTop: '2px',
                          }}
                        >
                          <span>{holiday.isOptional ? 'Optional' : holiday.type}</span>
                          {holiday.region !== 'ALL' && <span>{holiday.region}</span>}
                        </div>
                      </div>
                    )}

                    <div style={{ height: '2px' }} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* YEARLY SCHEDULE VIEW */}
        {viewMode === 'yearly' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Filter and Search Bar */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '14px',
                borderBottom: '1px solid var(--border-color)',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1', minWidth: '220px' }}>
                <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
                  <Search
                    size={15}
                    color="var(--text-muted)"
                    style={{ position: 'absolute', left: '10px', top: '10px' }}
                  />
                  <input
                    type="text"
                    placeholder="Search holiday name, region..."
                    className="form-control"
                    style={{ paddingLeft: '32px' }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <select
                  className="form-control"
                  style={{ width: '160px' }}
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="ALL">All Types</option>
                  <option value="COMPANY">Company-Wide</option>
                  <option value="REGIONAL">Regional Only</option>
                  <option value="OPTIONAL">Optional Holidays</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Year:</label>
                <select
                  className="form-control"
                  style={{ width: '90px' }}
                  value={currentYear}
                  onChange={(e) => setCurrentYear(Number(e.target.value))}
                >
                  {[2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Yearly Holidays Table */}
            <div className="table-responsive" style={{ padding: '0' }}>
              <table className="table" style={{ width: '100%', margin: '0' }}>
                <thead>
                  <tr>
                    <th>Holiday Name</th>
                    <th>Date & Day</th>
                    <th>Type & Scope</th>
                    <th>Region Applicability</th>
                    <th>Description</th>
                    {isAdminOrHr && <th style={{ textAlign: 'right' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredYearlyHolidays.length === 0 ? (
                    <tr>
                      <td colSpan={isAdminOrHr ? 6 : 5} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                        No holidays match your criteria for {currentYear}
                      </td>
                    </tr>
                  ) : (
                    filteredYearlyHolidays.map((h) => {
                      const dt = new Date(h.date + 'T00:00:00');
                      const dayName = dt.toLocaleDateString('en-US', { weekday: 'long' });
                      const formattedDate = dt.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      });

                      return (
                        <tr key={h.id}>
                          <td>
                            <div style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '13.5px' }}>
                              {h.name}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: '600', color: '#0d6efd' }}>{formattedDate}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{dayName}</div>
                          </td>
                          <td>{getTypeBadge(h.type, h.isOptional)}</td>
                          <td>
                            <span style={{ fontSize: '12px', color: 'var(--text-main)' }}>
                              {h.region === 'ALL' ? 'All Locations (Pan-India)' : `${h.region} Region`}
                            </span>
                          </td>
                          <td style={{ maxWidth: '240px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              {h.description || 'Enterprise holiday observance'}
                            </span>
                          </td>
                          {isAdminOrHr && (
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: '6px' }}>
                                <button
                                  onClick={() => handleOpenEditModal(h)}
                                  className="btn btn-secondary btn-sm"
                                  title="Edit Holiday"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  onClick={() => handleDeleteHoliday(h.id, h.name)}
                                  className="btn btn-secondary btn-sm"
                                  style={{ color: '#dc3545' }}
                                  title="Delete Holiday"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Holiday Details Drawer Modal */}
      {selectedHolidayDetails && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarIcon size={18} color="#0d6efd" />
                <h3>{selectedHolidayDetails.name}</h3>
              </div>
              <button
                className="btn-icon"
                onClick={() => setSelectedHolidayDetails(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>{getTypeBadge(selectedHolidayDetails.type, selectedHolidayDetails.isOptional)}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-main)' }}>
                <strong>Date:</strong> {selectedHolidayDetails.date}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-main)' }}>
                <strong>Applicability:</strong>{' '}
                {selectedHolidayDetails.region === 'ALL' ? 'Company-wide' : `${selectedHolidayDetails.region} Region`}
              </div>
              {selectedHolidayDetails.description && (
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  <strong>Description:</strong> {selectedHolidayDetails.description}
                </div>
              )}
              <div
                style={{
                  background: '#e8f5e9',
                  borderRadius: '6px',
                  padding: '10px',
                  fontSize: '11.5px',
                  color: '#15803d',
                  border: '1px solid #c8e6c9',
                }}
              >
                ✓ Excluded from attendance calculations & Loss of Pay deductions.
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedHolidayDetails(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Add / Edit Holiday Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarIcon size={18} color="#0d6efd" />
                <h3>{editingHoliday ? 'Edit Holiday' : 'Define New Holiday'}</h3>
              </div>
              <button
                className="btn-icon"
                onClick={() => setShowModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitHoliday}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label>Holiday Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Independence Day, Diwali, Ganesh Chaturthi"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label>Start Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>End Date (Optional)</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label>Holiday Classification</label>
                    <select
                      className="form-control"
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          type: e.target.value,
                          isOptional: e.target.value === 'OPTIONAL',
                        })
                      }
                    >
                      <option value="COMPANY">Company-Wide (Mandatory)</option>
                      <option value="REGIONAL">Regional Holiday</option>
                      <option value="OPTIONAL">Optional / Floating Holiday</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Region Applicability</label>
                    <select
                      className="form-control"
                      value={formData.region}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    >
                      <option value="ALL">All Offices / National</option>
                      <option value="South">South Region (Bengaluru/Hyderabad)</option>
                      <option value="North">North Region (Delhi NCR)</option>
                      <option value="West">West Region (Mumbai/Pune)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Description & Notes</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="Context or celebration details..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <input
                    type="checkbox"
                    id="chk-optional"
                    checked={formData.isOptional}
                    onChange={(e) => setFormData({ ...formData, isOptional: e.target.checked })}
                  />
                  <label htmlFor="chk-optional" style={{ fontSize: '12px', color: '#cbd5e1', cursor: 'pointer' }}>
                    Mark as Floating / Optional Holiday for employees
                  </label>
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingHoliday ? 'Update Holiday' : 'Create Holiday'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
