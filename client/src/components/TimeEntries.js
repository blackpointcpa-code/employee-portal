import React, { useState, useEffect } from 'react';
import axios from 'axios';

function TimeEntries({ employeeName }) {
  const [entries, setEntries] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    fetchEntries();
  }, [selectedDate, employeeName]);

  const fetchEntries = async () => {
    try {
      const response = await axios.get('/api/time-entries', {
        params: {
          date: selectedDate,
          employeeName: employeeName
        }
      });
      setEntries(response.data);
    } catch (error) {
      console.error('Error fetching entries:', error);
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getTotalHours = () => {
    const total = entries.reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0);
    return formatDuration(total);
  };

  return (
    <div className="time-entries">
      <div className="entries-header">
        <h2>Time History</h2>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="input date-input"
        />
      </div>

      {entries.length > 0 && (
        <div className="total-time">
          <span className="label">Total Time:</span>
          <span className="value">{getTotalHours()}</span>
        </div>
      )}

      <div className="entries-list">
        {entries.length === 0 ? (
          <div className="empty-state">
            <p>No time entries for this date.</p>
          </div>
        ) : (
          entries.map(entry => (
            <div key={entry.id} className="entry-item">
              <div className="entry-times">
                <div className="entry-time-group">
                  <span className="time-label">In</span>
                  <span className="time-value">{formatTime(entry.clock_in)}</span>
                </div>
                <div className="entry-arrow">→</div>
                <div className="entry-time-group">
                  <span className="time-label">Out</span>
                  <span className="time-value">
                    {entry.clock_out ? formatTime(entry.clock_out) : 'Active'}
                  </span>
                </div>
              </div>
              <div className="entry-duration">
                {entry.duration_minutes ? (
                  <span className="duration-badge">
                    {formatDuration(entry.duration_minutes)}
                  </span>
                ) : (
                  <span className="duration-badge active-badge">In Progress</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default TimeEntries;
