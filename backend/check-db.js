// Check database status
const { pool } = require('./src/config/database');

async function checkDatabase() {
  const connection = await pool.getConnection();
  
  try {
    console.log('Checking database status...\n');
    
    // Check what tables exist
    const [tables] = await connection.query('SHOW TABLES');
    console.log('Existing tables:');
    tables.forEach(row => {
      console.log('  -', Object.values(row)[0]);
    });
    
    if (tables.length === 0) {
      console.log('  (no tables found)');
    }
    
    console.log('');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    connection.release();
    await pool.end();
  }
}

checkDatabase();
