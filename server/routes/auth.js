// server/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const db = require('../db'); // Import our database connection

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    // 1. Get username, email, and password from the request body
    const { username, email, password } = req.body;

    // 2. Basic Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // 3. Hash the password
    const salt = await bcrypt.genSalt(10); // "salt rounds"
    const password_hash = await bcrypt.hash(password, salt);

    // 4. Save the new user to the database
    const query = `
      INSERT INTO users (username, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, username, email, created_at
    `;
    const values = [username, email, password_hash];

    const { rows } = await db.query(query, values);
    const newUser = rows[0];

    // 5. Send back the new user (without the password!)
    res.status(201).json(newUser);

  } catch (error) {
    // Handle specific error for duplicate username/email
    if (error.code === '23505') { // 23505 is the code for unique_violation
      return res.status(409).json({ error: 'Username or email already exists.' });
    }
    
    // Handle other errors
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    // 1. Get username/email and password from the request body
    // We'll call it 'login' to accept either username or email
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({ error: 'Username/email and password are required.' });
    }

    // 2. Find the user in the database by either username or email
    const query = `
      SELECT * FROM users
      WHERE username = $1 OR email = $1
    `;
    const { rows } = await db.query(query, [login]);

    // 3. If user doesn't exist, send an error
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const user = rows[0];

    // 4. Compare the submitted password with the stored hash
    const isMatch = await bcrypt.compare(password, user.password_hash);

    // 5. If passwords don't match, send an error
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // 6. Passwords match! Create a JWT
    const payload = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' }, // Token expires in 1 hour
      (err, token) => {
        if (err) throw err;
        // 7. Send the token back to the client
        res.json({ token });
      }
    );

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    // 1. Find the user by their email
    const query = 'SELECT * FROM users WHERE email = $1';
    const { rows } = await db.query(query, [email]);

    // 2. SECURITY: If no user is found, DO NOT send an error.
    // Send a generic success message to prevent "email enumeration,"
    // where an attacker could guess which emails are registered.
    if (rows.length === 0) {
      console.log(`Password reset attempt for non-existent email: ${email}`);
      return res.status(200).json({ message: 'If an account with that email exists, a password reset code has been sent.' });
    }

    const user = rows[0];

    // 3. Generate a secure 6-digit code
    const code = crypto.randomInt(100000, 999999).toString();

    // 4. Set an expiration time (e.g., 15 minutes from now)
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // 5. Save the code and expiration to the database
    const updateQuery = `
      UPDATE users
      SET password_reset_code = $1, password_reset_expires = $2
      WHERE id = $3
    `;
    await db.query(updateQuery, [code, expires, user.id]);

    // 6. TODO: Send the email. For now, we'll just log it.
    console.log('--- PASSWORD RESET ---');
    console.log(`User: ${user.email}`);
    console.log(`Code: ${code}`);
    console.log('----------------------');

    // 7. Send the same generic success message
    res.status(200).json({ message: 'If an account with that email exists, a password reset code has been sent.' });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/verify-code
router.post('/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required.' });
    }

    // 1. Find the user and check their code
    const query = 'SELECT * FROM users WHERE email = $1';
    const { rows } = await db.query(query, [email]);

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Invalid email or code.' });
    }

    const user = rows[0];

    // 2. Check if code matches
    if (user.password_reset_code !== code) {
      return res.status(400).json({ error: 'Invalid email or code.' });
    }

    // 3. Check if code is expired
    if (new Date() > user.password_reset_expires) {
      return res.status(400).json({ error: 'Code has expired. Please request a new one.' });
    }

    // 4. If all good, send success
    res.status(200).json({ message: 'Code is valid.' });

  } catch (error) {
    console.error('Verify code error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Email, code, and new password are required.' });
    }

    // 1. Find user and validate code (same logic as /verify-code)
    const query = 'SELECT * FROM users WHERE email = $1';
    const { rows } = await db.query(query, [email]);

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Invalid email or code.' });
    }

    const user = rows[0];

    if (user.password_reset_code !== code) {
      return res.status(400).json({ error: 'Invalid email or code.' });
    }

    if (new Date() > user.password_reset_expires) {
      return res.status(400).json({ error: 'Code has expired. Please request a new one.' });
    }

    // 2. All checks passed. Hash the new password.
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // 3. Update the user's password in the DB and clear the reset code
    const updateQuery = `
      UPDATE users
      SET password_hash = $1, 
          password_reset_code = NULL, 
          password_reset_expires = NULL
      WHERE id = $2
    `;
    await db.query(updateQuery, [newPasswordHash, user.id]);

    // 4. Send success message
    res.status(200).json({ message: 'Password has been reset successfully.' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;