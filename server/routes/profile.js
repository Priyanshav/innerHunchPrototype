const router     = require('express').Router();
const db         = require('../db');
const bcrypt     = require('bcryptjs');
const authMiddle = require('../middleware/auth');

// ── GET PROFILE ────────────────────────────────────
router.get('/', authMiddle, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
         u.id, u.first_name, u.last_name, u.email, u.bio,
         u.avatar_emoji, u.avatar_bg, u.avatar_img,
         u.wellness_goal, u.reminder_time,
         u.streak, u.sessions_done, u.created_at,
         p.daily_reminder, p.weekly_insights,
         p.new_articles_notify, p.appointment_reminders,
         p.theme, p.language,
         p.anonymize_data, p.allow_analytics, p.share_with_therapist
       FROM users u
       LEFT JOIN user_preferences p ON p.user_id = u.id
       WHERE u.id = $1`,
      [req.user.userId]
    );

    if (!result.rows.length) return res.status(404).json({ error: 'User not found.' });

    const u = result.rows[0];
    res.json({
      id:            u.id,
      firstName:     u.first_name,
      lastName:      u.last_name,
      email:         u.email,
      bio:           u.bio,
      avatarEmoji:   u.avatar_emoji,
      avatarBg:      u.avatar_bg,
      avatarImg:     u.avatar_img,
      wellnessGoal:  u.wellness_goal,
      reminderTime:  u.reminder_time,
      streak:        u.streak,
      sessions:      u.sessions_done,
      joinedAt:      u.created_at,
      preferences: {
        dailyReminder:        u.daily_reminder,
        weeklyInsights:       u.weekly_insights,
        newArticlesNotify:    u.new_articles_notify,
        appointmentReminders: u.appointment_reminders,
        theme:                u.theme,
        language:             u.language,
        anonymizeData:        u.anonymize_data,
        allowAnalytics:       u.allow_analytics,
        shareWithTherapist:   u.share_with_therapist,
      }
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── UPDATE PROFILE ─────────────────────────────────
router.put('/', authMiddle, async (req, res) => {
  const {
    firstName, lastName, bio,
    avatarEmoji, avatarBg, avatarImg,
    wellnessGoal, reminderTime
  } = req.body;

  try {
    const result = await db.query(
      `UPDATE users SET
         first_name    = COALESCE($1, first_name),
         last_name     = COALESCE($2, last_name),
         bio           = COALESCE($3, bio),
         avatar_emoji  = COALESCE($4, avatar_emoji),
         avatar_bg     = COALESCE($5, avatar_bg),
         avatar_img    = $6,
         wellness_goal = COALESCE($7, wellness_goal),
         reminder_time = COALESCE($8, reminder_time)
       WHERE id = $9
       RETURNING id, first_name, last_name, email, bio,
                 avatar_emoji, avatar_bg, avatar_img, streak, sessions_done`,
      [
        firstName || null, lastName || null, bio || null,
        avatarEmoji || null, avatarBg || null,
        avatarImg || null,  // explicit null clears the image if empty string passed
        wellnessGoal || null, reminderTime || null,
        req.user.userId
      ]
    );

    if (!result.rows.length) return res.status(404).json({ error: 'User not found.' });

    const u = result.rows[0];
    res.json({
      id: u.id, firstName: u.first_name, lastName: u.last_name,
      email: u.email, bio: u.bio, avatarEmoji: u.avatar_emoji,
      avatarBg: u.avatar_bg, avatarImg: u.avatar_img,
      streak: u.streak, sessions: u.sessions_done
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── UPDATE PREFERENCES ─────────────────────────────
router.put('/preferences', authMiddle, async (req, res) => {
  const {
    dailyReminder, weeklyInsights, newArticlesNotify,
    appointmentReminders, theme, language,
    anonymizeData, allowAnalytics, shareWithTherapist
  } = req.body;

  try {
    await db.query(
      `INSERT INTO user_preferences (user_id) VALUES ($1)
       ON CONFLICT (user_id) DO NOTHING`,
      [req.user.userId]
    );

    const result = await db.query(
      `UPDATE user_preferences SET
         daily_reminder        = COALESCE($1, daily_reminder),
         weekly_insights       = COALESCE($2, weekly_insights),
         new_articles_notify   = COALESCE($3, new_articles_notify),
         appointment_reminders = COALESCE($4, appointment_reminders),
         theme                 = COALESCE($5, theme),
         language              = COALESCE($6, language),
         anonymize_data        = COALESCE($7, anonymize_data),
         allow_analytics       = COALESCE($8, allow_analytics),
         share_with_therapist  = COALESCE($9, share_with_therapist),
         updated_at            = NOW()
       WHERE user_id = $10
       RETURNING *`,
      [
        dailyReminder ?? null, weeklyInsights ?? null,
        newArticlesNotify ?? null, appointmentReminders ?? null,
        theme || null, language || null,
        anonymizeData ?? null, allowAnalytics ?? null,
        shareWithTherapist ?? null,
        req.user.userId
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── CHANGE PASSWORD ────────────────────────────────
router.put('/password', authMiddle, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Both current and new password are required.' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters.' });
  }

  try {
    const result = await db.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.userId]
    );

    const valid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect.' });

    const newHash = await bcrypt.hash(newPassword, 12);
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.user.userId]);

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE ACCOUNT ─────────────────────────────────
router.delete('/', authMiddle, async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password required to delete account.' });

  try {
    const result = await db.query('SELECT password_hash FROM users WHERE id=$1', [req.user.userId]);
    const valid = await bcrypt.compare(password, result.rows[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'Incorrect password.' });

    await db.query('DELETE FROM users WHERE id = $1', [req.user.userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
