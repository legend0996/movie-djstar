const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'dj_star_movies',
  });

  try {
    console.log('Seeding database...');

    const [roles] = await connection.execute(`SELECT id, slug FROM roles`);
    const roleMap = {};
    for (const role of roles) {
      roleMap[role.slug] = role.id;
    }

    if (!roleMap['developer'] || !roleMap['movie_owner']) {
      console.log('Roles not found. Run migrate first.');
      return;
    }

    const [existingDev] = await connection.execute(
      `SELECT id FROM users WHERE role_id = ?`,
      [roleMap['developer']]
    );

    if (existingDev.length === 0) {
      const passwordHash = await bcrypt.hash('Admin@123456', 12);
      await connection.execute(
        `INSERT INTO users (role_id, username, email, password_hash, status, email_verified_at, first_name, last_name)
         VALUES (?, 'developer', 'dev@djstarmovies.com', ?, 'active', NOW(), 'Platform', 'Developer')`,
        [roleMap['developer'], passwordHash]
      );
      console.log('Developer account created: dev@djstarmovies.com / Admin@123456');
    }

    const [existingOwner] = await connection.execute(
      `SELECT id FROM users WHERE role_id = ?`,
      [roleMap['movie_owner']]
    );

    if (existingOwner.length === 0) {
      const passwordHash = await bcrypt.hash('Owner@123456', 12);
      await connection.execute(
        `INSERT INTO users (role_id, username, email, password_hash, status, email_verified_at, first_name, last_name)
         VALUES (?, 'movieowner', 'owner@djstarmovies.com', ?, 'active', NOW(), 'Movie', 'Owner')`,
        [roleMap['movie_owner'], passwordHash]
      );
      console.log('Movie Owner account created: owner@djstarmovies.com / Owner@123456');
    }

    const [existingUser] = await connection.execute(
      `SELECT id FROM users WHERE username = 'demo'`
    );

    if (existingUser.length === 0) {
      const passwordHash = await bcrypt.hash('Demo@123456', 12);
      await connection.execute(
        `INSERT INTO users (role_id, username, email, password_hash, status, email_verified_at, first_name, last_name)
         VALUES (?, 'demo', 'demo@djstarmovies.com', ?, 'active', NOW(), 'Demo', 'User')`,
        [roleMap['user'], passwordHash]
      );
      console.log('Demo user account created: demo@djstarmovies.com / Demo@123456');
    }

    console.log('Seeding completed successfully');
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seed();
