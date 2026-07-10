require('dotenv').config();

const db = require('../config/database');
const { hashPassword } = require('../utils/password');

async function seed() {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('Define SUPER_ADMIN_EMAIL y SUPER_ADMIN_PASSWORD en .env antes de correr este script.');
    process.exitCode = 1;
    return;
  }

  const passwordHash = await hashPassword(password);
  const existing = db.prepare('SELECT id FROM super_admin WHERE email = ?').get(email);

  if (existing) {
    db.prepare(`UPDATE super_admin SET password_hash = ?, updated_at = datetime('now') WHERE id = ?`)
      .run(passwordHash, existing.id);
    console.log(`Super admin actualizado: ${email}`);
  } else {
    db.prepare('INSERT INTO super_admin (email, password_hash) VALUES (?, ?)').run(email, passwordHash);
    console.log(`Super admin creado: ${email}`);
  }
}

seed();
