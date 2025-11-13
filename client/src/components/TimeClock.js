import React, { useState, useEffect } from 'react';
import axios from 'axios';

function TimeClock({ employeeName }) {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualEntry, setManualEntry] = useState({
    employeeName: 'Kyla Abbott',
    date: new Date().toISOString().split('T')[0],
    clockIn: '',
    clockOut: ''
  });

  useEffect(() => {
    checkStatus();
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [employeeName]);

  const checkStatus = async () => {
    try {
      const response = await axios.get(`/api/status/${employeeName}`);
      setIsClockedIn(response.data.isClockedIn);
      setCurrentEntry(response.data.currentEntry);
    } catch (error) {
      console.error('Error checking status:', error);
    }
  };

  const handleClockIn = async () => {
    setLoading(true);
    try {
      await axios.post('/api/clock-in', { employeeName });
      await checkStatus();
    } catch (error) {
      alert(error.response?.data?.error || 'Error clocking in');
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    setLoading(true);
    try {
      await axios.post('/api/clock-out', { employeeName });
      await checkStatus();
    } catch (error) {
      alert(error.response?.data?.error || 'Error clocking out');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getElapsedTime = () => {
    if (!currentEntry) return '00:00:00';
    const start = new Date(currentEntry.clock_in);
    const diff = Math.floor((currentTime - start) / 1000);
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const handleManualEntrySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Combine date with times to create full timestamps
      const clockInDateTime = new Date(`${manualEntry.date}T${manualEntry.clockIn}`).toISOString();
      const clockOutDateTime = new Date(`${manualEntry.date}T${manualEntry.clockOut}`).toISOString();
      
      await axios.post('/api/manual-time-entry', {
        employeeName: manualEntry.employeeName,
        clockIn: clockInDateTime,
        clockOut: clockOutDateTime,
        date: manualEntry.date
      });
      
      alert('Time entry added successfully!');
      setShowManualEntry(false);
      setManualEntry({
        employeeName: 'Kyla Abbott',
        date: new Date().toISOString().split('T')[0],
        clockIn: '',
        clockOut: ''
      });
    } catch (error) {
      alert(error.response?.data?.error || 'Error adding manual time entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="time-clock">
      <h2>Time Clock</h2>
      <div className="clock-display">
        <div className="current-time">{formatTime(currentTime)}</div>
        <div className="current-date">{formatDate(currentTime)}</div>
      </div>

      {isClockedIn && (
        <div className="clocked-in-info">
          <div className="status-badge status-active">Clocked In</div>
          <div className="elapsed-time">
            <span className="label">Time Worked:</span>
            <span className="time">{getElapsedTime()}</span>
          </div>
          <div className="clock-in-time">
            <span className="label">Clocked in at:</span>
            <span className="time">
              {new Date(currentEntry.clock_in).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>
      )}

      {!isClockedIn && (
        <div className="clocked-out-info">
          <div className="status-badge status-inactive">Not Clocked In</div>
        </div>
      )}

      <div className="clock-actions">
        {!isClockedIn ? (
          <button
            onClick={handleClockIn}
            disabled={loading}
            className="btn btn-clock-in"
          >
            {loading ? 'Processing...' : 'Clock In'}
          </button>
        ) : (
          <button
            onClick={handleClockOut}
            disabled={loading}
            className="btn btn-clock-out"
          >
            {loading ? 'Processing...' : 'Clock Out'}
          </button>
        )}
      </div>

      {employeeName === 'Brendan Abbott' && (
        <div className="manual-entry-section">
          <button
            onClick={() => setShowManualEntry(!showManualEntry)}
            className="btn btn-secondary"
            style={{ marginTop: '20px', width: '100%' }}
          >
            {showManualEntry ? 'Cancel' : 'Add Manual Time Entry'}
          </button>

          {showManualEntry && (
            <form onSubmit={handleManualEntrySubmit} className="manual-entry-form">
              <h3>Add Time Entry</h3>
              
              <div className="form-group">
                <label>Employee</label>
                <select
                  value={manualEntry.employeeName}
                  onChange={(e) => setManualEntry({...manualEntry, employeeName: e.target.value})}
                  className="input"
                  required
                >
                  <option value="Kyla Abbott">Kyla Abbott</option>
                  <option value="Brendan Abbott">Brendan Abbott</option>
                </select>
              </div>

              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={manualEntry.date}
                  onChange={(e) => setManualEntry({...manualEntry, date: e.target.value})}
                  className="input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Clock In Time</label>
                <input
                  type="time"
                  value={manualEntry.clockIn}
                  onChange={(e) => setManualEntry({...manualEntry, clockIn: e.target.value})}
                  className="input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Clock Out Time</label>
                <input
                  type="time"
                  value={manualEntry.clockOut}
                  onChange={(e) => setManualEntry({...manualEntry, clockOut: e.target.value})}
                  className="input"
                  required
                />
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? 'Adding...' : 'Add Time Entry'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default TimeClock;
