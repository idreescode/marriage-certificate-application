#!/usr/bin/env node

const MigrationRunner = require('./MigrationRunner');

// Import all migrations in order
const migrations = [
  require('./001_create_users_table'),
  require('./002_create_applications_table'),
  require('./003_create_witnesses_table'),
  require('./004_create_email_logs_table'),
  require('./005_seed_admin_user'),
  require('./006_add_reset_token_columns'),
  require('./007_create_notifications_table'),
  require('./008_unify_users_table'),
  require('./010_add_extended_application_fields'),
  require('./011_add_extended_witness_fields'),
  require('./012_make_date_fields_nullable'),
  require('./015_drop_documents_table'),
];

// Run migrations
const runner = new MigrationRunner();

console.log('');
console.log('╔══════════════════════════════════════════════════════╗');
console.log('║   Marriage Certificate - Database Migrations        ║');
console.log('╚══════════════════════════════════════════════════════╝');
console.log('');

runner.run(migrations)
  .then(() => {
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║              ✅ MIGRATIONS SUCCESSFUL!              ║');
    console.log('╚══════════════════════════════════════════════════════╝');
    console.log('');
    console.log('You can now start the server:');
    console.log('  npm run dev');
    console.log('');
    process.exit(0);
  })
  .catch((error) => {
    console.error('');
    console.error('╔══════════════════════════════════════════════════════╗');
    console.error('║              ❌ MIGRATION FAILED!                   ║');
    console.error('╚══════════════════════════════════════════════════════╝');
    console.error('');
    console.error('Error:', error.message);
    console.error('');
    process.exit(1);
  });
