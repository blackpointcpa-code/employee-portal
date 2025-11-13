const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Initialize Database
const db = new sqlite3.Database(path.join(__dirname, 'blackpoint.db'), (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Database connected');
  }
});

// Create tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS time_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_name TEXT NOT NULL,
      clock_in DATETIME NOT NULL,
      clock_out DATETIME,
      duration_minutes INTEGER,
      date TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_name TEXT NOT NULL,
      description TEXT,
      completed BOOLEAN DEFAULT 0,
      date TEXT NOT NULL,
      completed_at DATETIME,
      is_default BOOLEAN DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS default_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_name TEXT NOT NULL,
      description TEXT,
      sort_order INTEGER DEFAULT 0
    )
  `);

  // Insert default daily tasks if they don't exist
  db.get('SELECT COUNT(*) as count FROM default_tasks', [], (err, row) => {
    if (err) {
      console.error('Error checking default_tasks:', err);
      return;
    }
    
    console.log('Default tasks count:', row.count);
    
    if (row.count === 0) {
      console.log('Inserting default tasks...');
      const defaultTasks = [
        { name: 'Check and respond to emails', description: 'Review inbox and reply to priority messages', order: 1 },
        { name: 'Review pending invoices', description: 'Check for any outstanding client invoices and load into melio', order: 2 },
        { name: 'Follow up on Collection Invoices', description: 'Ensure all client customers are emailed and collected on', order: 3 },
        { name: 'Daily reconciliation check', description: 'Review daily transactions and balances in QBO', order: 4 },
        { name: 'Post incoming payments for FCCLA and Utah TSA', description: 'Ensure all incoming payments have been properly posted and bank transactions cleared', order: 5 }
      ];

      const stmt = db.prepare('INSERT INTO default_tasks (task_name, description, sort_order) VALUES (?, ?, ?)');
      defaultTasks.forEach(task => {
        stmt.run(task.name, task.description, task.order);
      });
      stmt.finalize(() => {
        console.log('Default tasks inserted successfully');
      });
    } else {
      console.log('Default tasks already exist');
    }
  });
});

// Helper function to format date
const getToday = () => {
  return new Date().toISOString().split('T')[0];
};

// Helper function to calculate duration
const calculateDuration = (clockIn, clockOut) => {
  const start = new Date(clockIn);
  const end = new Date(clockOut);
  return Math.round((end - start) / 1000 / 60); // minutes
};

// Root route for health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Blackpoint Employee Portal API',
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint to check database status
app.get('/api/debug/database', (req, res) => {
  const info = {};
  
  db.get('SELECT COUNT(*) as count FROM default_tasks', [], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    info.default_tasks_count = row.count;
    
    db.get('SELECT COUNT(*) as count FROM tasks WHERE date = ?', [getToday()], (err2, row2) => {
      if (err2) {
        return res.status(500).json({ error: err2.message });
      }
      info.tasks_today_count = row2.count;
      
      db.all('SELECT * FROM default_tasks ORDER BY sort_order', [], (err3, tasks) => {
        if (err3) {
          return res.status(500).json({ error: err3.message });
        }
        info.default_tasks = tasks;
        info.today_date = getToday();
        
        res.json(info);
      });
    });
  });
});

// ============ TIME ENTRY ENDPOINTS ============

// Clock In
app.post('/api/clock-in', (req, res) => {
  const { employeeName } = req.body;
  const now = new Date().toISOString();
  const today = getToday();

  // Check if already clocked in
  db.get(
    'SELECT * FROM time_entries WHERE employee_name = ? AND date = ? AND clock_out IS NULL',
    [employeeName, today],
    (err, existing) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (existing) {
        return res.status(400).json({ error: 'Already clocked in' });
      }

      // Insert new clock in
      db.run(
        'INSERT INTO time_entries (employee_name, clock_in, date) VALUES (?, ?, ?)',
        [employeeName, now, today],
        function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          res.json({
            id: this.lastID,
            employeeName,
            clockIn: now,
            date: today
          });
        }
      );
    }
  );
});

// Clock Out
app.post('/api/clock-out', (req, res) => {
  const { employeeName } = req.body;
  const now = new Date().toISOString();
  const today = getToday();

  // Find the open time entry
  db.get(
    'SELECT * FROM time_entries WHERE employee_name = ? AND date = ? AND clock_out IS NULL',
    [employeeName, today],
    (err, entry) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!entry) {
        return res.status(400).json({ error: 'Not currently clocked in' });
      }

      const duration = calculateDuration(entry.clock_in, now);

      db.run(
        'UPDATE time_entries SET clock_out = ?, duration_minutes = ? WHERE id = ?',
        [now, duration, entry.id],
        function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          res.json({
            id: entry.id,
            employeeName,
            clockIn: entry.clock_in,
            clockOut: now,
            duration: duration
          });
        }
      );
    }
  );
});

// Get current status
app.get('/api/status/:employeeName', (req, res) => {
  const { employeeName } = req.params;
  const today = getToday();

  db.get(
    'SELECT * FROM time_entries WHERE employee_name = ? AND date = ? AND clock_out IS NULL',
    [employeeName, today],
    (err, entry) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({
        isClockedIn: !!entry,
        currentEntry: entry || null
      });
    }
  );
});

// Get time entries
app.get('/api/time-entries', (req, res) => {
  const { date, employeeName } = req.query;
  
  let query = 'SELECT * FROM time_entries WHERE 1=1';
  const params = [];

  if (date) {
    query += ' AND date = ?';
    params.push(date);
  }

  if (employeeName) {
    query += ' AND employee_name = ?';
    params.push(employeeName);
  }

  query += ' ORDER BY clock_in DESC';

  db.all(query, params, (err, entries) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(entries);
  });
});

// Get payroll report (weekly summary)
app.get('/api/payroll-report', (req, res) => {
  const { startDate, endDate, employeeName } = req.query;
  
  let query = `
    SELECT 
      employee_name,
      date,
      clock_in,
      clock_out,
      duration_minutes,
      ROUND(duration_minutes / 60.0, 2) as hours
    FROM time_entries 
    WHERE clock_out IS NOT NULL
  `;
  const params = [];

  if (startDate && endDate) {
    query += ' AND date BETWEEN ? AND ?';
    params.push(startDate, endDate);
  }

  if (employeeName) {
    query += ' AND employee_name = ?';
    params.push(employeeName);
  }

  query += ' ORDER BY employee_name, date, clock_in';

  db.all(query, params, (err, entries) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Calculate summary by employee
    const summary = {};
    entries.forEach(entry => {
      if (!summary[entry.employee_name]) {
        summary[entry.employee_name] = {
          employee_name: entry.employee_name,
          total_minutes: 0,
          total_hours: 0,
          shifts: []
        };
      }
      summary[entry.employee_name].total_minutes += entry.duration_minutes || 0;
      summary[entry.employee_name].shifts.push({
        date: entry.date,
        clock_in: entry.clock_in,
        clock_out: entry.clock_out,
        hours: entry.hours
      });
    });

    // Convert to array and calculate total hours
    const summaryArray = Object.values(summary).map(emp => ({
      ...emp,
      total_hours: Math.round((emp.total_minutes / 60) * 100) / 100
    }));

    res.json({
      startDate: startDate || 'All',
      endDate: endDate || 'All',
      employees: summaryArray,
      entries: entries
    });
  });
});

// ============ TASK ENDPOINTS ============

// Helper function to auto-populate daily tasks
const ensureDailyTasks = (date, callback) => {
  console.log('ensureDailyTasks called for date:', date);
  
  // Check if default tasks already exist for this date
  db.get(
    'SELECT COUNT(*) as count FROM tasks WHERE date = ? AND is_default = 1',
    [date],
    (err, row) => {
      if (err) {
        console.error('Error checking tasks for date:', err);
        return callback(err);
      }

      console.log('Existing tasks for date', date, ':', row.count);

      // If default tasks don't exist for this date, create them
      if (row.count === 0) {
        db.all('SELECT * FROM default_tasks ORDER BY sort_order', [], (err, defaultTasks) => {
          if (err) {
            console.error('Error fetching default_tasks:', err);
            return callback(err);
          }

          console.log('Found default tasks:', defaultTasks.length);

          if (defaultTasks.length > 0) {
            const stmt = db.prepare(
              'INSERT INTO tasks (task_name, description, date, is_default) VALUES (?, ?, ?, 1)'
            );

            defaultTasks.forEach(task => {
              stmt.run(task.task_name, task.description, date);
            });

            stmt.finalize(() => {
              console.log('Daily tasks created for', date);
              callback();
            });
          } else {
            callback(null);
          }
        });
      } else {
        callback(null);
      }
    }
  );
};

// Get tasks
app.get('/api/tasks', (req, res) => {
  const { date } = req.query;
  const today = date || getToday();

  // Ensure default tasks exist for this date
  ensureDailyTasks(today, (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    db.all(
      'SELECT * FROM tasks WHERE date = ? ORDER BY completed ASC, is_default DESC, id ASC',
      [today],
      (err, tasks) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json(tasks);
      }
    );
  });
});

// Create task
app.post('/api/tasks', (req, res) => {
  const { taskName, description, date } = req.body;
  const today = date || getToday();

  db.run(
    'INSERT INTO tasks (task_name, description, date) VALUES (?, ?, ?)',
    [taskName, description, today],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({
        id: this.lastID,
        taskName,
        description,
        completed: false,
        date: today
      });
    }
  );
});

// Update task (toggle completion)
app.patch('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const { completed } = req.body;
  const completedAt = completed ? new Date().toISOString() : null;

  db.run(
    'UPDATE tasks SET completed = ?, completed_at = ? WHERE id = ?',
    [completed ? 1 : 0, completedAt, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, task) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json(task);
      });
    }
  );
});

// Delete task
app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM tasks WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Task deleted successfully' });
  });
});

// Get default tasks
app.get('/api/default-tasks', (req, res) => {
  db.all(
    'SELECT * FROM default_tasks ORDER BY sort_order',
    [],
    (err, tasks) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(tasks);
    }
  );
});

// Add a new default task
app.post('/api/default-tasks', (req, res) => {
  const { taskName, description } = req.body;

  db.get('SELECT MAX(sort_order) as max_order FROM default_tasks', [], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const sortOrder = (row.max_order || 0) + 1;

    db.run(
      'INSERT INTO default_tasks (task_name, description, sort_order) VALUES (?, ?, ?)',
      [taskName, description, sortOrder],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        res.json({
          id: this.lastID,
          taskName,
          description,
          sortOrder
        });
      }
    );
  });
});

// Delete a default task
app.delete('/api/default-tasks/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM default_tasks WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Default task deleted successfully' });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
