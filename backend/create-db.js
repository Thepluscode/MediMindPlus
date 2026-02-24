const { Client } = require('pg');

// Connect to postgres database (which always exists)
const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'theophilusogieva',
  database: 'postgres', // Connect to default postgres database
});

async function createDatabase() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL');

    // Check if medimind database exists
    const checkDB = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'medimind'"
    );

    if (checkDB.rows.length === 0) {
      // Create the database
      await client.query('CREATE DATABASE medimind');
      console.log('✅ Database "medimind" created successfully');
    } else {
      console.log('✅ Database "medimind" already exists');
    }

    await client.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createDatabase();
