const { pool } = require('./src/config/database');

async function convertEngine() {
  try {
    console.log('Converting tables to InnoDB...');
    
    const tables = ['users', 'applications', 'witnesses', 'room_bookings', 'notifications'];
    
    for (const table of tables) {
      try {
        await pool.query(`ALTER TABLE ${table} ENGINE = InnoDB`);
        console.log(`✅ Converted ${table} to InnoDB`);
      } catch (e) {
        console.log(`⚠️  Could not convert ${table} (might not exist): ${e.message}`);
      }
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

convertEngine();
