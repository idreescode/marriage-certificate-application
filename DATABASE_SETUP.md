
```
backend/migrations/
├── MigrationRunner.js          
├── migrate.js                  
├── 001_create_users_table.js
├── 002_create_applications_table.js
├── 003_create_witnesses_table.js
├── 004_create_email_logs_table.js
└── 005_seed_admin_user.js
```

## 🚀 How to Run Migrations

### First Time Setup

1. **MySQL server check karen:**
```bash
# MySQL running hai?
mysql -u root -p
```

2. **Environment variables set karen:**
`backend/.env` file mein:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=marriage_cert_db
```

3. **Migrations run karen:**
```bash
cd backend
npm run migrate
```

### Output Example

```
╔══════════════════════════════════════════════════════╗
║   Marriage Certificate - Database Migrations        ║
╚══════════════════════════════════════════════════════╝

🔄 Ensuring database marriage_cert_db exists...
✅ Database ready

📋 Found 5 pending migration(s)

🔄 Running migration: 001_create_users_table
   ✓ Users table created
✅ Migration completed: 001_create_users_table

🔄 Running migration: 002_create_applications_table
   ✓ Applications table created
✅ Migration completed: 002_create_applications_table

🔄 Running migration: 003_create_witnesses_table
   ✓ Witnesses table created
✅ Migration completed: 003_create_witnesses_table

🔄 Running migration: 004_create_email_logs_table
   ✓ Email logs table created
✅ Migration completed: 004_create_email_logs_table

🔄 Running migration: 005_seed_admin_user
   ✓ Default admin user created
   📧 Email: admin@jamiyat.org
   🔑 Password: Admin@123
✅ Migration completed: 005_seed_admin_user

🎉 All migrations completed successfully!

╔══════════════════════════════════════════════════════╗
║              ✅ MIGRATIONS SUCCESSFUL!              ║
╚══════════════════════════════════════════════════════╝

You can now start the server:
  npm run dev
```

## 🔄 How It Works

### 1. Migrations Table
System automatically ek `migrations` table banata hai jo track karta hai:
```sql
migrations
├── id
├── name              # Migration ka naam
└── executed_at       # Kab run hua
```

### 2. Smart Execution
- Pehli baar: Sab migrations run hote hain
- Dobara run karo: Sirf **new migrations** run hote hain
- Already run ho chuke migrations **skip** ho jate hain

### 3. Individual Migration Files
Har file mein `up()` aur `down()` functions hain:

```javascript
module.exports = {
  name: '001_create_users_table',
  
  async up(connection) {
    // Table create karo
    await connection.query(`CREATE TABLE users...`);
  },
  
  async down(connection) {
    // Rollback (agar zaroorat ho)
    await connection.query('DROP TABLE users');
  }
};
```

## ➕ Add New Migration

Naya migration banana hai? Follow this pattern:

### 1. Create New File
```bash
# Format: XXX_description.js (XXX = next number)
touch migrations/006_add_column_to_applications.js
```

### 2. File Content
```javascript
module.exports = {
  name: '006_add_column_to_applications',

  async up(connection) {
    await connection.query(`
      ALTER TABLE applications 
      ADD COLUMN new_field VARCHAR(255)
    `);
    console.log('   ✓ New field added');
  },

  async down(connection) {
    await connection.query(`
      ALTER TABLE applications 
      DROP COLUMN new_field
    `);
  }
};
```

### 3. Import in migrate.js
```javascript
const migrations = [
  require('./001_create_users_table'),
  require('./002_create_applications_table'),
  require('./003_create_witnesses_table'),
  require('./004_create_email_logs_table'),
  require('./005_seed_admin_user'),
  require('./006_add_column_to_applications'), // ← Add this
];
```

### 4. Run Migration
```bash
npm run migrate
```

## 🔍 Check Migration Status

Database mein dekho kaun se migrations run ho chuke hain:

```sql
USE marriage_cert_db;
SELECT * FROM migrations ORDER BY id;
```

Output:
```
+----+----------------------------------+---------------------+
| id | name                             | executed_at         |
+----+----------------------------------+---------------------+
|  1 | 001_create_users_table          | 2024-01-01 10:00:00 |
|  2 | 002_create_applications_table   | 2024-01-01 10:00:01 |
|  3 | 003_create_witnesses_table      | 2024-01-01 10:00:02 |
|  4 | 004_create_email_logs_table     | 2024-01-01 10:00:03 |
|  5 | 005_seed_admin_user             | 2024-01-01 10:00:04 |
+----+----------------------------------+---------------------+
```

## 🔧 Troubleshooting

### Migration Already Exists Error
Agar koi migration run ho gaya ho lekin table nahi bana:
```sql
-- Manual fix
DELETE FROM migrations WHERE name = '001_create_users_table';
```
Phir dobara `npm run migrate` run karo

### Fresh Start Chahiye
```sql
DROP DATABASE marriage_cert_db;
```
Phir dobara migrate karo:
```bash
npm run migrate
```

### Foreign Key Constraint Error
Tables **order mein** run hoti hain:
1. First: `users` (no dependencies)
2. Then: `applications` (depends on users)
3. Then: `witnesses`, `email_logs` (depend on applications)

Ye order change **mat** karna!

## ✅ Benefits

### 1. Version Control
- Har database change ek file mein hai
- Git mein track hota hai
- Team members ko sync karna easy hai

### 2. No Duplicate Work
- Ek migration sirf ek baar run hota hai
- Multiple developers same migration run kar sakte hain

### 3. Easy Rollback
- `down()` function se rollback possible hai
- Production mein safe changes

### 4. Team Collaboration
```bash
# Developer A adds migration
git pull
npm run migrate  # Only new migrations run

# Developer B adds migration  
git pull
npm run migrate  # Only their new migration runs
```

## 📝 Migration Naming Convention

```
XXX_description.js

XXX = Sequential number (001, 002, 003...)
description = What this migration does
```

Examples:
- ✅ `001_create_users_table.js`
- ✅ `002_add_phone_to_users.js`
- ✅ `003_create_index_on_email.js`
- ❌ `migration.js` (bad)
- ❌ `users.js` (bad)

## 🎯 Summary

**To setup database:**
```bash
npm run migrate
```

**To add new changes:**
1. Create new migration file
2. Import in `migrate.js`
3. Run `npm run migrate`

**Simple, powerful, professional!** ✨

---

Ab aap ka database **properly versioned** aur **migration-controlled** hai! 🎉
