// Manual migration script to add extended fields
const { pool } = require('./src/config/database');

async function addColumn(connection, tableName, columnDef) {
  try {
    await connection.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnDef}`);
    return true;
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      return false; // Column already exists
    }
    throw error;
  }
}

async function runMigrations() {
  const connection = await pool.getConnection();
  
  try {
    console.log('Starting manual migrations...\n');
    
    // Migration 010: Add extended application fields
    console.log('Adding extended application fields to applications table...');
    
    const appColumns = [
      'groom_father_name VARCHAR(255) AFTER groom_full_name',
      'groom_place_of_birth VARCHAR(255) AFTER groom_date_of_birth',
      'groom_confirm BOOLEAN DEFAULT FALSE AFTER groom_id_number',
      'groom_personally BOOLEAN DEFAULT FALSE AFTER groom_confirm',
      'groom_representative BOOLEAN DEFAULT FALSE AFTER groom_personally',
      'groom_rep_name VARCHAR(255) AFTER groom_representative',
      'groom_rep_father_name VARCHAR(255) AFTER groom_rep_name',
      'groom_rep_date_of_birth DATE AFTER groom_rep_father_name',
      'groom_rep_place_of_birth VARCHAR(255) AFTER groom_rep_date_of_birth',
      'groom_rep_address TEXT AFTER groom_rep_place_of_birth',
      'bride_father_name VARCHAR(255) AFTER bride_full_name',
      'bride_place_of_birth VARCHAR(255) AFTER bride_date_of_birth',
      'bride_confirm BOOLEAN DEFAULT FALSE AFTER bride_id_number',
      'bride_personally BOOLEAN DEFAULT FALSE AFTER bride_confirm',
      'bride_representative BOOLEAN DEFAULT FALSE AFTER bride_personally',
      'bride_rep_name VARCHAR(255) AFTER bride_representative',
      'bride_rep_father_name VARCHAR(255) AFTER bride_rep_name',
      'bride_rep_date_of_birth DATE AFTER bride_rep_father_name',
      'bride_rep_place_of_birth VARCHAR(255) AFTER bride_rep_date_of_birth',
      'bride_rep_address TEXT AFTER bride_rep_place_of_birth',
      'mahr_amount VARCHAR(100) AFTER special_requests',
      'mahr_type ENUM(\'deferred\', \'prompt\') AFTER mahr_amount',
      'solemnised_date DATE AFTER mahr_type',
      'solemnised_place VARCHAR(255) AFTER solemnised_date',
      'solemnised_address TEXT AFTER solemnised_place'
    ];
    
    let addedCount = 0;
    for (const col of appColumns) {
      const added = await addColumn(connection, 'applications', col);
      if (added) addedCount++;
    }
    console.log(`✓ Added ${addedCount} new columns to applications table\n`);
    
    // Migration 011: Add extended witness fields
    console.log('Adding extended witness fields to witnesses table...');
    
    const witnessColumns = [
      'witness_father_name VARCHAR(255) AFTER witness_name',
      'witness_date_of_birth DATE AFTER witness_father_name',
      'witness_place_of_birth VARCHAR(255) AFTER witness_date_of_birth',
      'witness_address TEXT AFTER witness_place_of_birth'
    ];
    
    addedCount = 0;
    for (const col of witnessColumns) {
      const added = await addColumn(connection, 'witnesses', col);
      if (added) addedCount++;
    }
    console.log(`✓ Added ${addedCount} new columns to witnesses table\n`);
    
    console.log('✅ All migrations completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
  } finally {
    connection.release();
    await pool.end();
  }
}

runMigrations();
