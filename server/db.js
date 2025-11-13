const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';
const usePostgres = isProduction && process.env.DATABASE_URL;

let db;
let isPostgresDB = false;

// Helper to convert boolean values and SQL syntax
const convertSQL = (sql, params) => {
  if (!usePostgres) return { sql, params };
  
  // Convert SQLite placeholders (?) to PostgreSQL ($1, $2, etc.)
  let pgSql = sql;
  let paramIndex = 1;
  while (pgSql.includes('?')) {
    pgSql = pgSql.replace('?', `$${paramIndex}`);
    paramIndex++;
  }
  
  // Convert boolean comparisons: "= 0" to "= FALSE" and "= 1" to "= TRUE"
  pgSql = pgSql.replace(/=\s*0(?=\s|$|\))/g, '= FALSE');
  pgSql = pgSql.replace(/=\s*1(?=\s|$|\))/g, '= TRUE');
  
  // Convert boolean values in params
  const pgParams = params.map(param => {
    if (param === 0 || param === 1) {
      return param === 1;
    }
    return param;
  });
  
  return { sql: pgSql, params: pgParams };
};

if (usePostgres) {
  // PostgreSQL for production
  console.log('Using PostgreSQL database');
  isPostgresDB = true;
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  // Wrapper to make PostgreSQL work like SQLite
  db = {
    run: (sql, params = [], callback = () => {}) => {
      const { sql: pgSql, params: pgParams } = convertSQL(sql, params);
      
      pool.query(pgSql, pgParams)
        .then(result => {
          if (callback) callback(null);
        })
        .catch(err => {
          console.error('DB Error:', err);
          if (callback) callback(err);
        });
    },
    
    get: (sql, params = [], callback) => {
      const { sql: pgSql, params: pgParams } = convertSQL(sql, params);
      
      pool.query(pgSql, pgParams)
        .then(result => callback(null, result.rows[0] || null))
        .catch(err => {
          console.error('DB Error:', err);
          callback(err);
        });
    },
    
    all: (sql, params = [], callback) => {
      const { sql: pgSql, params: pgParams } = convertSQL(sql, params);
      
      pool.query(pgSql, pgParams)
        .then(result => callback(null, result.rows))
        .catch(err => {
          console.error('DB Error:', err);
          callback(err);
        });
    },
    
    serialize: (callback) => {
      callback();
    },
    
    prepare: (sql) => {
      // For batch inserts, return an object that mimics SQLite's prepared statement
      return {
        run: (...args) => {
          const params = args.slice(0, -1);
          const callback = args[args.length - 1];
          db.run(sql, params, callback);
        },
        finalize: (callback) => {
          if (callback) callback();
        }
      };
    }
  };
} else {
  // SQLite for local development
  console.log('Using SQLite database');
  const dbPath = path.join(__dirname, 'blackpoint.db');
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database:', err);
    } else {
      console.log('Database connected successfully at:', dbPath);
    }
  });
}

module.exports = { db, isPostgresDB };
