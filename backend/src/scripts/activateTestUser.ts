/**
 * Script to activate test user accounts in development
 * Run with: npx ts-node src/scripts/activateTestUser.ts
 */

import { getKnex } from '../config/knex';
import logger from '../utils/logger';

async function activateTestUser() {
  const knex = getKnex();

  try {
    logger.info('Checking for users in database...', {
      service: 'scripts'
    });

    // Get all users
    const users = await knex('users')
      .select('id', 'email', 'first_name', 'last_name', 'is_active', 'role', 'created_at')
      .orderBy('created_at', 'desc')
      .limit(10);

    if (users.length === 0) {
      logger.info('No users found in database. Register a user first through the API or web interface', {
        service: 'scripts'
      });
      process.exit(0);
    }

    logger.info(`Found ${users.length} user(s)`, {
      service: 'scripts',
      userCount: users.length
    });
    users.forEach((user, index) => {
      logger.info('User details', {
        service: 'scripts',
        index: index + 1,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        isActive: user.is_active,
        role: user.role,
        createdAt: new Date(user.created_at).toLocaleString()
      });
    });

    // Activate all inactive users in development
    const inactiveUsers = users.filter(u => !u.is_active);

    if (inactiveUsers.length === 0) {
      logger.info('All users are already active', {
        service: 'scripts',
        totalUsers: users.length
      });
      process.exit(0);
    }

    logger.info('Activating inactive users', {
      service: 'scripts',
      inactiveCount: inactiveUsers.length
    });

    // Activate all inactive users
    const updated = await knex('users')
      .whereIn('id', inactiveUsers.map(u => u.id))
      .update({
        is_active: true,
        updated_at: knex.fn.now()
      });

    logger.info('Successfully activated users', {
      service: 'scripts',
      activatedCount: updated
    });

    // Display updated users
    const updatedUsers = await knex('users')
      .select('id', 'email', 'first_name', 'last_name', 'is_active')
      .whereIn('id', inactiveUsers.map(u => u.id));

    logger.info('Updated users', {
      service: 'scripts',
      updatedCount: updatedUsers.length
    });
    updatedUsers.forEach(user => {
      logger.info('User activated', {
        service: 'scripts',
        email: user.email,
        isActive: user.is_active
      });
    });

    logger.info('Test users are now ready for API testing', {
      service: 'scripts'
    });

  } catch (error) {
    logger.error('Error activating users', {
      service: 'scripts',
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  } finally {
    await knex.destroy();
    process.exit(0);
  }
}

// Run the script
activateTestUser();
