const mariadb = require('mariadb');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'node',
  password: process.env.DB_PASSWORD || 'devpassword',
  database: process.env.DB_NAME || 'encheres_project',
  port: process.env.DB_PORT || 3306,
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000
};

// Create connection pool
const pool = mariadb.createPool(dbConfig);

// Test connection
const testConnection = async () => {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log('✅ MariaDB connected successfully');
  } catch (error) {
    console.error('❌ MariaDB connection failed:', error.message);
    process.exit(1);
  } finally {
    if (conn) conn.release();
  }
};

// Generic query function
const query = async (sql, params = []) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const results = await conn.query(sql, params);
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    if (conn) conn.release();
  }
};

// GET request function (for SELECT queries)
const get_request = async (sql, params = []) => {
  return await query(sql, params);
};

// POST request function (for INSERT queries)
const post_request = async (sql, params = []) => {
  const result = await query(sql, params);
  return {
    insertId: result.insertId ? Number(result.insertId) : null,
    affectedRows: result.affectedRows || 0
  };
};

// PUT request function (for UPDATE queries)
const put_request = async (sql, params = []) => {
  const result = await query(sql, params);
  return {
    affectedRows: result.affectedRows || 0
  };
};

// DELETE request function
const delete_request = async (sql, params = []) => {
  const result = await query(sql, params);
  return {
    affectedRows: result.affectedRows || 0
  };
};

// Transaction helper
const transaction = async (queries) => {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();
    
    const results = [];
    for (const { sql, params } of queries) {
      const result = await conn.query(sql, params);
      results.push(result);
    }
    
    await conn.commit();
    return results;
  } catch (error) {
    if (conn) await conn.rollback();
    throw error;
  } finally {
    if (conn) conn.release();
  }
};

// Initialize database with tables
const initializeDatabase = async () => {
  const createTables = [
    `CREATE TABLE IF NOT EXISTS client (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      surname VARCHAR(255) DEFAULT '',
      email VARCHAR(255) UNIQUE,
      phone VARCHAR(50) DEFAULT '',
      address TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS encheres (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      date DATE,
      address TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS lots (
      id INT PRIMARY KEY AUTO_INCREMENT,
      enchere_id INT NOT NULL,
      name VARCHAR(255) DEFAULT '',
      description TEXT DEFAULT '',
      category VARCHAR(100) DEFAULT '',
      starting_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      sold_price DECIMAL(10,2) NULL,
      sold_to INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (enchere_id) REFERENCES encheres(id) ON DELETE CASCADE,
      FOREIGN KEY (sold_to) REFERENCES client(id) ON DELETE SET NULL
    )`,
    
    `CREATE TABLE IF NOT EXISTS images (
      id INT PRIMARY KEY AUTO_INCREMENT,
      lot_id INT NOT NULL,
      name VARCHAR(255) DEFAULT '',
      description TEXT DEFAULT '',
      file_path VARCHAR(500),
      file_size INT DEFAULT 0,
      mime_type VARCHAR(100) DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lot_id) REFERENCES lots(id) ON DELETE CASCADE
    )`,
    
    `CREATE TABLE IF NOT EXISTS participation (
      id INT PRIMARY KEY AUTO_INCREMENT,
      enchere_id INT NOT NULL,
      client_id INT NOT NULL,
      local_number VARCHAR(10) DEFAULT '',
      registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (enchere_id) REFERENCES encheres(id) ON DELETE CASCADE,
      FOREIGN KEY (client_id) REFERENCES client(id) ON DELETE CASCADE,
      UNIQUE KEY unique_participation (enchere_id, client_id)
    )`
  ];

  try {
    for (const sql of createTables) {
      await query(sql);
    }
    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize database tables:', error);
    throw error;
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Closing database connections...');
  await pool.end();
  console.log('✅ Database connections closed');
  process.exit(0);
});

module.exports = {
  pool,
  query,
  get_request,
  post_request,
  put_request,
  delete_request,
  transaction,
  testConnection,
  initializeDatabase
};