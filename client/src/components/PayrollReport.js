import React, { useState, useEffect } from 'react';
import axios from 'axios';

function PayrollReport() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Calculate current week (Monday - Sunday)
  const getCurrentWeek = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return {
      start: monday.toISOString().split('T')[0],
      end: sunday.toISOString().split('T')[0]
    };
  };

  // Set current week on load
  useEffect(() => {
    const week = getCurrentWeek();
    setStartDate(week.start);
    setEndDate(week.end);
  }, []);

  const fetchReport = async () => {
    if (!startDate || !endDate) return;

    setLoading(true);
    try {
      const response = await axios.get('/api/payroll-report', {
        params: { startDate, endDate }
      });
      setReportData(response.data);
    } catch (error) {
      console.error('Error fetching payroll report:', error);
      alert('Error loading payroll report');
    } finally {
      setLoading(false);
    }
  };

  const setCurrentWeek = () => {
    const week = getCurrentWeek();
    setStartDate(week.start);
    setEndDate(week.end);
  };

  const setPreviousWeek = () => {
    const start = new Date(startDate);
    start.setDate(start.getDate() - 7);
    const end = new Date(endDate);
    end.setDate(end.getDate() - 7);
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const setNextWeek = () => {
    const start = new Date(startDate);
    start.setDate(start.getDate() + 7);
    const end = new Date(endDate);
    end.setDate(end.getDate() + 7);
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const downloadCSV = () => {
    if (!reportData || !reportData.employees.length) return;

    let csv = 'Employee,Date,Day,Clock In,Clock Out,Hours\n';
    
    reportData.employees.forEach(employee => {
      employee.shifts.forEach(shift => {
        const date = new Date(shift.date);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        const clockIn = new Date(shift.clock_in).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        const clockOut = new Date(shift.clock_out).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        
        csv += `"${employee.employee_name}","${shift.date}","${dayName}","${clockIn}","${clockOut}",${shift.hours}\n`;
      });
      
      // Add total row for each employee
      csv += `"${employee.employee_name} - TOTAL",,,,,"${employee.total_hours}"\n`;
      csv += '\n'; // Empty line between employees
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll_${startDate}_to_${endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDayName = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { weekday: 'long' });
  };

  return (
    <div className="payroll-report">
      <div className="payroll-header">
        <h2>Payroll Report</h2>
        <p className="payroll-subtitle">Weekly time tracking for payroll processing</p>
      </div>

      <div className="payroll-controls">
        <div className="date-range-selector">
          <button onClick={setPreviousWeek} className="btn btn-secondary">
            ← Previous Week
          </button>
          <button onClick={setCurrentWeek} className="btn btn-secondary">
            Current Week
          </button>
          <button onClick={setNextWeek} className="btn btn-secondary">
            Next Week →
          </button>
        </div>

        <div className="date-inputs">
          <div className="input-group">
            <label>Start Date (Monday)</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input"
            />
          </div>
          <div className="input-group">
            <label>End Date (Sunday)</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input"
            />
          </div>
        </div>

        <button 
          onClick={fetchReport} 
          className="btn btn-primary"
          disabled={loading || !startDate || !endDate}
        >
          {loading ? 'Loading...' : 'Generate Report'}
        </button>
      </div>

      {reportData && reportData.employees.length > 0 && (
        <div className="report-results">
          <div className="report-actions">
            <button onClick={downloadCSV} className="btn btn-success">
              📊 Download CSV
            </button>
            <div className="report-summary">
              <strong>Period:</strong> {formatDate(startDate)} - {formatDate(endDate)}
            </div>
          </div>

          {reportData.employees.map((employee, idx) => (
            <div key={idx} className="employee-report-card">
              <div className="employee-report-header">
                <h3>{employee.employee_name}</h3>
                <div className="total-hours">
                  <span className="label">Total Hours:</span>
                  <span className="value">{employee.total_hours} hrs</span>
                </div>
              </div>

              <div className="shifts-table">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Day</th>
                      <th>Clock In</th>
                      <th>Clock Out</th>
                      <th>Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employee.shifts.map((shift, shiftIdx) => (
                      <tr key={shiftIdx}>
                        <td>{formatDate(shift.date)}</td>
                        <td>{getDayName(shift.date)}</td>
                        <td>{formatTime(shift.clock_in)}</td>
                        <td>{formatTime(shift.clock_out)}</td>
                        <td><strong>{shift.hours} hrs</strong></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="4"><strong>Total</strong></td>
                      <td><strong>{employee.total_hours} hrs</strong></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {reportData && reportData.employees.length === 0 && (
        <div className="empty-state">
          <p>No time entries found for the selected date range.</p>
        </div>
      )}
    </div>
  );
}

export default PayrollReport;
