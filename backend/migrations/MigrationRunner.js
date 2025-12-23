const mysql = require('mysql2/promise');
require('dotenv').config();

class MigrationRunner {
  constructor() {
    this.config = {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    };
    this.dbName = process.env.DB_NAME;
    this.connection = null;
  }

  async connect() {
    this.connection = await mysql.createConnection(this.config);
  }

  async ensureDatabase() {
    console.log(`🔄 Ensuring database ${this.dbName} exists...`);
    await this.connection.query(`CREATE DATABASE IF NOT EXISTS ${this.dbName} CHARACTER SET utf8 COLLATE utf8_unicode_ci`);
    await this.connection.query(`USE ${this.dbName}`);
    console.log('✅ Database ready');
  }

  async ensureMigrationsTable() {
    await this.connection.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  async getExecutedMigrations() {
    const [rows] = await this.connection.query('SELECT name FROM migrations ORDER BY id');
    return rows.map(row => row.name);
  }

  async markMigrationAsExecuted(name) {
    await this.connection.query('INSERT INTO migrations (name) VALUES (?)', [name]);
  }

  async runMigration(migration) {
    console.log(`🔄 Running migration: ${migration.name}`);
    
    try {
      await migration.up(this.connection);
      await this.markMigrationAsExecuted(migration.name);
      console.log(`✅ Migration completed: ${migration.name}`);
    } catch (error) {
      console.error(`❌ Migration failed: ${migration.name}`);
      throw error;
    }
  }

  async run(migrations) {
    try {
      await this.connect();
      await this.ensureDatabase();
      await this.ensureMigrationsTable();

      const executed = await this.getExecutedMigrations();
      const pending = migrations.filter(m => !executed.includes(m.name));

      if (pending.length === 0) {
        console.log('✅ All migrations are up to date!');
        return;
      }

      console.log(`\n📋 Found ${pending.length} pending migration(s)\n`);

      for (const migration of pending) {
        await this.runMigration(migration);
      }

      console.log('\n🎉 All migrations completed successfully!\n');

    } catch (error) {
      console.error('\n❌ Migration error:', error.message);
      throw error;
    } finally {
      if (this.connection) {
        await this.connection.end();
      }
    }
  }
}

module.exports = MigrationRunner;
