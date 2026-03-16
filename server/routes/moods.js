const router     = require('express').Router();
const db         = require('../db');
const authMiddle = require('../middleware/auth');

// ── LOG A MOOD ─────────────────────────────────────
router.post('/', authMiddle, async (req, res) => {
  const { moodScore, energyScore, note } = req.body;

  if (!moodScore || moodScore < 1 || moodScore > 5) {
    return res.status(400).json({ error: 'moodScore must be between 1 and 5.' });
  }

  try {
    // Check if user already logged a mood today
    const todayCheck = await db.query(
      `SELECT id FROM mood_logs
       WHERE user_id = $1 AND logged_at::date = CURRENT_DATE`,
      [req.user.userId]
    );

    let result;
    if (todayCheck.rows.length > 0) {
      // Update today's existing log
      result = await db.query(
        `UPDATE mood_logs
         SET mood_score = $1, energy_score = $2, note = $3, logged_at = NOW()
         WHERE id = $4 RETURNING *`,
        [moodScore, energyScore || null, note || '', todayCheck.rows[0].id]
      );
    } else {
      // Insert new log
      result = await db.query(
        `INSERT INTO mood_logs (user_id, mood_score, energy_score, note)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [req.user.userId, moodScore, energyScore || null, note || '']
      );
      // Increment streak
      await db.query(
        'UPDATE users SET streak = streak + 1 WHERE id = $1',
        [req.user.userId]
      );
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Mood log error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET LAST 7 DAYS ────────────────────────────────
router.get('/week', authMiddle, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
         id, mood_score, energy_score, note,
         TO_CHAR(logged_at, 'Dy') AS day_label,
         logged_at::date AS date
       FROM mood_logs
       WHERE user_id = $1
         AND logged_at >= NOW() - INTERVAL '7 days'
       ORDER BY logged_at ASC`,
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET ALL HISTORY (paginated) ────────────────────
router.get('/history', authMiddle, async (req, res) => {
  const limit  = parseInt(req.query.limit)  || 20;
  const offset = parseInt(req.query.offset) || 0;
  try {
    const result = await db.query(
      `SELECT id, mood_score, energy_score, note,
              TO_CHAR(logged_at, 'Dy DD Mon') AS day_label,
              logged_at
       FROM mood_logs
       WHERE user_id = $1
       ORDER BY logged_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.userId, limit, offset]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET MOOD STATS ─────────────────────────────────
router.get('/stats', authMiddle, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
         COUNT(*)::int                              AS total_logs,
         ROUND(AVG(mood_score)::numeric, 1)        AS avg_mood,
         ROUND(AVG(energy_score)::numeric, 1)      AS avg_energy,
         MAX(mood_score)                            AS best_mood,
         MIN(mood_score)                            AS lowest_mood
       FROM mood_logs WHERE user_id = $1`,
      [req.user.userId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
