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
  require('./016_add_document_path_columns'),
  require('./017_add_documents_verified'),
  require('./018_add_is_deleted_to_applications'),
  require('./019_make_witness_phone_nullable'),
  require('./020_remove_phone_columns'),
  require('./021_remove_email_columns'),
  require('./022_add_approval_fields'),
  require('./023_remove_super_admin_role'),
  require('./024_create_settings_table'),
  require('./025_change_solemnised_date_to_datetime'),
  require('./026_add_payment_choice_column'),
  require('./027_add_contact_number_to_applications'),
  require('./028_add_total_fee_setting'),
  require('./029_add_four_witness_id_paths'),
  require('./030_add_witness_columns_to_applications'),
  require('./031_remove_unused_columns'),
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
