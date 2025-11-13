const { isPostgresDB } = require('./db');

// SQL that works for both SQLite and PostgreSQL
const getSQL = () => {
  if (isPostgresDB) {
    return {
      createTimeEntries: `
        CREATE TABLE IF NOT EXISTS time_entries (
          id SERIAL PRIMARY KEY,
          employee_name VARCHAR(255) NOT NULL,
          clock_in TIMESTAMP NOT NULL,
          clock_out TIMESTAMP,
          duration_minutes INTEGER,
          date VARCHAR(20) NOT NULL
        )
      `,
      createTasks: `
        CREATE TABLE IF NOT EXISTS tasks (
          id SERIAL PRIMARY KEY,
          task_name TEXT NOT NULL,
          description TEXT,
          completed BOOLEAN DEFAULT FALSE,
          date VARCHAR(20) NOT NULL,
          completed_at TIMESTAMP,
          is_default BOOLEAN DEFAULT FALSE,
          created_by VARCHAR(255),
          sort_order INTEGER DEFAULT 0
        )
      `,
      createDefaultTasks: `
        CREATE TABLE IF NOT EXISTS default_tasks (
          id SERIAL PRIMARY KEY,
          task_name TEXT NOT NULL,
          description TEXT,
          sort_order INTEGER DEFAULT 0
        )
      `,
      createClients: `
        CREATE TABLE IF NOT EXISTS clients (
          id SERIAL PRIMARY KEY,
          client_name VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `,
      createProjects: `
        CREATE TABLE IF NOT EXISTS projects (
          id SERIAL PRIMARY KEY,
          client_id INTEGER NOT NULL,
          project_name TEXT NOT NULL,
          description TEXT,
          due_date VARCHAR(20) NOT NULL,
          completed BOOLEAN DEFAULT FALSE,
          completed_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (client_id) REFERENCES clients(id)
        )
      `
    };
  } else {
    return {
      createTimeEntries: `
        CREATE TABLE IF NOT EXISTS time_entries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          employee_name TEXT NOT NULL,
          clock_in DATETIME NOT NULL,
          clock_out DATETIME,
          duration_minutes INTEGER,
          date TEXT NOT NULL
        )
      `,
      createTasks: `
        CREATE TABLE IF NOT EXISTS tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          task_name TEXT NOT NULL,
          description TEXT,
          completed BOOLEAN DEFAULT 0,
          date TEXT NOT NULL,
          completed_at DATETIME,
          is_default BOOLEAN DEFAULT 0,
          created_by TEXT,
          sort_order INTEGER DEFAULT 0
        )
      `,
      createDefaultTasks: `
        CREATE TABLE IF NOT EXISTS default_tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          task_name TEXT NOT NULL,
          description TEXT,
          sort_order INTEGER DEFAULT 0
        )
      `,
      createClients: `
        CREATE TABLE IF NOT EXISTS clients (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          client_name TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `,
      createProjects: `
        CREATE TABLE IF NOT EXISTS projects (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          client_id INTEGER NOT NULL,
          project_name TEXT NOT NULL,
          description TEXT,
          due_date TEXT NOT NULL,
          completed BOOLEAN DEFAULT 0,
          completed_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (client_id) REFERENCES clients(id)
        )
      `
    };
  }
};

module.exports = getSQL();
