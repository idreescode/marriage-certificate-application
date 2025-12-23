// Migration: 003_create_witnesses_table
// Creates the witnesses table for storing witness information

module.exports = {
  name: '003_create_witnesses_table',

  async up(connection) {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS witnesses (
        id INT PRIMARY KEY AUTO_INCREMENT,
        application_id INT NOT NULL,
        witness_name VARCHAR(255) NOT NULL,
        witness_phone VARCHAR(20) NOT NULL,
        witness_email VARCHAR(191),
        witness_order TINYINT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
      )
    `);
    console.log('   ✓ Witnesses table created');
  },

  async down(connection) {
    await connection.query('DROP TABLE IF EXISTS witnesses');
  }
};
