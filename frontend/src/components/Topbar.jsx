import React from 'react';
import { Calendar } from 'lucide-react';

export default function Topbar({ title, subtitle }) {
  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <header className="topbar">
      <div className="topbar-title-group">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <div className="topbar-actions">
        <div style={{ fontSize: '13px', color: '#6c757d', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Calendar size={14} color="#0d6efd" />
          <span>{todayStr}</span>
        </div>
      </div>
    </header>
  );
}
