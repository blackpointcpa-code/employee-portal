import React, { useState, useEffect } from 'react';
import './App.css';
import TimeClock from './components/TimeClock';
import TaskList from './components/TaskList';
import TimeEntries from './components/TimeEntries';
import PayrollReport from './components/PayrollReport';

function App() {
  const [employeeName, setEmployeeName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loginError, setLoginError] = useState('');

  // Authorized employees
  const authorizedEmployees = ['Brendan Abbott', 'Kyla Abbott'];

  useEffect(() => {
    // Check if employee name is stored
    const storedName = localStorage.getItem('employeeName');
    if (storedName && authorizedEmployees.includes(storedName)) {
      setEmployeeName(storedName);
      setIsLoggedIn(true);
    } else if (storedName) {
      // Clear invalid stored name
      localStorage.removeItem('employeeName');
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    const trimmedName = employeeName.trim();
    
    if (authorizedEmployees.includes(trimmedName)) {
      localStorage.setItem('employeeName', trimmedName);
      setIsLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError('Access denied. Only authorized employees can sign in.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('employeeName');
    setIsLoggedIn(false);
    setEmployeeName('');
  };

  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="logo">
            <div className="logo-icon">BP</div>
            <h1>Blackpoint Accounting</h1>
          </div>
          <h2>Employee Portal</h2>
          <form onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="Enter your name"
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              className="input"
              required
            />
            {loginError && (
              <div style={{ color: '#e74c3c', marginTop: '10px', fontSize: '14px' }}>
                {loginError}
              </div>
            )}
            <button type="submit" className="btn btn-primary">
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="header">
        <div className="header-content">
          <div className="logo-small">
            <div className="logo-icon-small">BP</div>
            <h1>Blackpoint Accounting</h1>
          </div>
          <div className="user-info">
            <span className="welcome">Welcome, {employeeName}</span>
            <button onClick={handleLogout} className="btn btn-secondary">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <nav className="nav-tabs">
        <button 
          className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          🏠 Dashboard
        </button>
        <button 
          className={`nav-tab ${activeTab === 'payroll' ? 'active' : ''}`}
          onClick={() => setActiveTab('payroll')}
        >
          💰 Payroll Report
        </button>
      </nav>

      <main className="main-content">
        {activeTab === 'dashboard' && (
          <div className="dashboard">
            <div className="section time-section">
              <TimeClock employeeName={employeeName} />
            </div>

            <div className="section task-section">
              <TaskList employeeName={employeeName} />
            </div>

            <div className="section entries-section">
              <TimeEntries employeeName={employeeName} />
            </div>
          </div>
        )}

        {activeTab === 'payroll' && (
          <div className="payroll-container">
            <PayrollReport />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
