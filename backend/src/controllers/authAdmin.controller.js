const db = require('../config/database');
const HttpError = require('../utils/httpError');
const { comparePassword } = require('../utils/password');
const { signToken } = require('../utils/jwt');
const { isValidEmail } = require('../utils/validation');

async function login(req, res) {
  const { email, password } = req.body || {};

  if (!isValidEmail(email) || typeof password !== 'string' || password.length === 0) {
    throw new HttpError(400, 'email y password son obligatorios');
  }

  const admin = db.prepare('SELECT * FROM super_admin WHERE email = ?').get(email);
  if (!admin) {
    throw new HttpError(401, 'Credenciales invalidas');
  }

  const valid = await comparePassword(password, admin.password_hash);
  if (!valid) {
    throw new HttpError(401, 'Credenciales invalidas');
  }

  const token = signToken({ role: 'super_admin', adminId: admin.id });
  res.json({ token, admin: { id: admin.id, email: admin.email } });
}

module.exports = { login };
