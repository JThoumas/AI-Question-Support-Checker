// server/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const db = require('../db'); // Import our database connection
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client();
const jwksClient = require('jwks-rsa'); // <-- ADD THIS
const appleJwksClient = jwksClient({ // <-- ADD THIS
  jwksUri: 'https://appleid.apple.com/auth/keys'
});

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

    // 6. Send the email using SendGrid
    try {
      const msg = {
        to: user.email,
        from: process.env.SENDER_EMAIL, // Your verified email
        subject: 'Your Password Reset Code',
        html: `
          <div style="font-family: sans-serif; text-align: center;">
            <h2>Password Reset Request</h2>
            <p>We received a request to reset your password.</p>
            <p>Here is your 6-digit verification code:</p>
            <h1 style="font-size: 48px; letter-spacing: 10px; margin: 20px 0;">
              ${code}
            </h1>
            <p style="color: #888;">This code will expire in 15 minutes.</p>
          </div>
        `,
      };

    await sgMail.send(msg);

    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      // Even if email fails, we don't want to tell the user
    }

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

// POST /api/auth/google-login
router.post('/google-login', async (req, res) => {
  const { idToken } = req.body; // This is the token from the React Native app

  try {
    // 1. Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      // We'll need to set this Client ID in our .env file
      audience: process.env.GOOGLE_CLIENT_ID, 
    });
    const payload = ticket.getPayload();

    const email = payload.email;
    const username = payload.name; // Or payload.given_name

    if (!email) {
      return res.status(400).json({ error: 'Email not found in Google token' });
    }

    // 2. Check if this user already exists in our database
    let { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    let user = rows[0];

    if (!user) {
      // 3. If user doesn't exist, create a new one
      // We create a "dummy" password hash since they won't log in this way
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(crypto.randomBytes(20).toString('hex'), salt);

      const result = await db.query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
        [username, email, password_hash]
      );
      user = result.rows[0];
    }

    // 4. Create *our* JWT for the user
    const appTokenPayload = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    };

    jwt.sign(
      appTokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token }); // Send our token back
      }
    );
  } catch (error) {
    console.error('Google login error:', error);
    res.status(401).json({ error: 'Invalid Google token' });
  }
});

// Helper function to get Apple's public key
function getAppleSigningKey(header, callback) {
  appleJwksClient.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
      return;
    }
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

// POST /api/auth/apple-login
router.post('/apple-login', async (req, res) => {
  const { idToken, fullName } = req.body;

  try {
    // 1. Verify the Apple token
    // We use jwt.verify with our helper function to get the key
    jwt.verify(idToken, getAppleSigningKey, {
      audience: 'org.reactjs.native.example.MobileApp',
      issuer: 'https://appleid.apple.com',
      algorithms: ['RS256']
    }, async (err, decoded) => {
      if (err) {
        console.error('Apple token verification error:', err);
        return res.status(401).json({ error: 'Invalid Apple token' });
      }

      const email = decoded.email;
      // Apple only gives the name on the VERY FIRST login
      const username = fullName ? `${fullName.givenName} ${fullName.familyName}` : 'Apple User';

      if (!email) {
        return res.status(400).json({ error: 'Email not found in Apple token' });
      }

      // 2. Check if this user already exists in our database
      let { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
      let user = rows[0];

      if (!user) {
        // 3. If user doesn't exist, create a new one
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(crypto.randomBytes(20).toString('hex'), salt);

        const result = await db.query(
          'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
          [username, email, password_hash]
        );
        user = result.rows[0];
      }

      // 4. Create *our* JWT for the user
      const appTokenPayload = {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      };

      jwt.sign(
        appTokenPayload,
        process.env.JWT_SECRET,
        { expiresIn: '1h' },
        (appErr, token) => {
          if (appErr) throw appErr;
          res.json({ token }); // Send our token back
        }
      );
    });
  } catch (error) {
    console.error('Apple login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;