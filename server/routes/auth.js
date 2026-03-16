const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../db');

// ── SIGN UP ────────────────────────────────────────
router.post('/signup', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  if (!firstName || !email || !password) {
    return res.status(400).json({ error: 'First name, email and password are required.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  try {
    // Check if email already exists
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await db.query(
      `INSERT INTO users (first_name, last_name, email, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, first_name, last_name, email, bio, avatar_emoji, avatar_bg, streak, sessions_done`,
      [firstName, lastName || '', email.toLowerCase(), passwordHash]
    );

    const user = result.rows[0];

    // Create default preferences for new user
    await db.query(
      'INSERT INTO user_preferences (user_id) VALUES ($1) ON CONFLICT DO NOTHING',
      [user.id]
    );

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id:           user.id,
        firstName:    user.first_name,
        lastName:     user.last_name,
        email:        user.email,
        bio:          user.bio,
        avatarEmoji:  user.avatar_emoji,
        avatarBg:     user.avatar_bg,
        streak:       user.streak,
        sessions:     user.sessions_done,
      }
    });

  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server error during signup. Please try again.' });
  }
});

// ── LOG IN ─────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const result = await db.query(
      `SELECT id, first_name, last_name, email, password_hash, bio,
              avatar_emoji, avatar_bg, avatar_img, streak, sessions_done
       FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'No account found with that email.' });
    }

    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id:           user.id,
        firstName:    user.first_name,
        lastName:     user.last_name,
        email:        user.email,
        bio:          user.bio,
        avatarEmoji:  user.avatar_emoji,
        avatarBg:     user.avatar_bg,
        avatarImg:    user.avatar_img,
        streak:       user.streak,
        sessions:     user.sessions_done,
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login. Please try again.' });
  }
});

// ── VERIFY TOKEN (check if still valid) ────────────
router.get('/verify', require('../middleware/auth'), async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, first_name, last_name, email, bio, avatar_emoji, avatar_bg, avatar_img, streak, sessions_done
       FROM users WHERE id = $1`,
      [req.user.userId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
    const u = result.rows[0];
    res.json({
      id: u.id, firstName: u.first_name, lastName: u.last_name,
      email: u.email, bio: u.bio, avatarEmoji: u.avatar_emoji,
      avatarBg: u.avatar_bg, avatarImg: u.avatar_img,
      streak: u.streak, sessions: u.sessions_done
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
