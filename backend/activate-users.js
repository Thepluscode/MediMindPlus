/**
 * Script to activate test user accounts in development
 * Run with: node activate-users.js
 */

require('dotenv').config();

const knex = require('knex')({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5434,
    database: process.env.DB_NAME || 'medimind',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  },
});

async function activateTestUser() {
  try {
    console.log('🔍 Checking for users in database...\n');

    // Get all users (using camelCase column names)
    const users = await knex('users')
      .select('id', 'email', 'firstName', 'lastName', 'isActive', 'role', 'createdAt')
      .orderBy('createdAt', 'desc')
      .limit(10);

    if (users.length === 0) {
      console.log('❌ No users found in database');
      console.log('💡 Register a user first through the API or web interface\n');
      process.exit(0);
    }

    console.log(`Found ${users.length} user(s):\n`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Status: ${user.isActive ? '✅ Active' : '❌ Inactive'}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Created: ${new Date(user.createdAt).toLocaleString()}\n`);
    });

    // Activate all inactive users in development
    const inactiveUsers = users.filter(u => !u.isActive);

    if (inactiveUsers.length === 0) {
      console.log('✅ All users are already active!\n');
      process.exit(0);
    }

    console.log(`🔧 Activating ${inactiveUsers.length} inactive user(s)...\n`);

    // Activate all inactive users
    const updated = await knex('users')
      .whereIn('id', inactiveUsers.map(u => u.id))
      .update({
        isActive: true,
        updatedAt: knex.fn.now()
      });

    console.log(`✅ Successfully activated ${updated} user(s)!\n`);

    // Display updated users
    const updatedUsers = await knex('users')
      .select('id', 'email', 'firstName', 'lastName', 'isActive')
      .whereIn('id', inactiveUsers.map(u => u.id));

    console.log('Updated users:');
    updatedUsers.forEach(user => {
      console.log(`  ✅ ${user.email} - Status: ${user.isActive ? 'Active' : 'Inactive'}`);
    });

    console.log('\n✅ Test users are now ready for API testing!\n');

  } catch (error) {
    console.error('❌ Error activating users:', error);
    process.exit(1);
  } finally {
    await knex.destroy();
    process.exit(0);
  }
}

// Run the script
activateTestUser();
