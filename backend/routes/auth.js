const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { Pool } = require('pg');
const authenticate = require('../middleware/auth');
const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL ||
    'postgresql://postgres:bookish2025@localhost:5432/bookish',
});

router.post('/register', [
  body('email').isEmail().withMessage('Please enter a valid email address'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  body('username').isLength({ min: 3 }).trim().withMessage('Username must be at least 3 characters long'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { email, password, username } = req.body;
  try {
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'This email is already registered' });
    }
    const existingUsername = await pool.query('SELECT id FROM users WHERE username = $1', [username.trim()]);
    if (existingUsername.rows.length > 0) {
      return res.status(400).json({ error: 'This username is already taken' });
    }
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, username)
       VALUES ($1, $2, $3)
       RETURNING id, email, username, created_at`,
      [email.toLowerCase(), passwordHash, username.trim()]
    );
    const newUser = result.rows[0];
    const token = jwt.sign(
      { userId: newUser.id, username: newUser.username },
      process.env.JWT_SECRET || 'fallback_secret_change_this',
      { expiresIn: '7d' }
    );
    await pool.query(
      `INSERT INTO user_preferences (user_id, onboarding_completed) VALUES ($1, false)`,
      [newUser.id]
    );
    res.status(201).json({
      token,
      user: { id: newUser.id, email: newUser.email, username: newUser.username },
      needsOnboarding: true,
    });
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const prefResult = await pool.query(
      'SELECT onboarding_completed FROM user_preferences WHERE user_id = $1',
      [user.id]
    );
    const needsOnboarding = !prefResult.rows[0]?.onboarding_completed;
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET || 'fallback_secret_change_this',
      { expiresIn: '7d' }
    );
    res.json({
      token,
      user: { id: user.id, email: user.email, username: user.username },
      needsOnboarding,
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// PATCH /api/auth/username — change username
router.patch('/username', authenticate, async (req, res) => {
  const userId = req.user.userId;
  const { username } = req.body;
  if (!username || username.trim().length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters' });
  }
  try {
    const existing = await pool.query(
      'SELECT id FROM users WHERE username = $1 AND id != $2',
      [username.trim(), userId]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'This username is already taken' });
    }
    const result = await pool.query(
      'UPDATE users SET username = $1 WHERE id = $2 RETURNING id, email, username',
      [username.trim(), userId]
    );
    const updatedUser = result.rows[0];
    const token = jwt.sign(
      { userId: updatedUser.id, username: updatedUser.username },
      process.env.JWT_SECRET || 'fallback_secret_change_this',
      { expiresIn: '7d' }
    );
    res.json({ token, user: updatedUser });
  } catch (error) {
    console.error('Username change error:', error.message);
    res.status(500).json({ error: 'Failed to update username' });
  }
});

// PATCH /api/auth/password — change password
router.patch('/password', authenticate, async (req, res) => {
  const userId = req.user.userId;
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Both current and new password are required' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters' });
  }
  try {
    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];
    const match = await bcrypt.compare(currentPassword, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    const newHash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, userId]);
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password change error:', error.message);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// DELETE /api/auth/account — delete account
router.delete('/account', authenticate, async (req, res) => {
  const userId = req.user.userId;
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Password is required to delete account' });
  }
  try {
    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Incorrect password' });
    }
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    res.json({ success: true, message: 'Account deleted' });
  } catch (error) {
    console.error('Delete account error:', error.message);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

module.exports = router;