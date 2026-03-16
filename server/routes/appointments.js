const router     = require('express').Router();
const db         = require('../db');
const authMiddle = require('../middleware/auth');

// ── GET ALL APPOINTMENTS ───────────────────────────
router.get('/', authMiddle, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
         id, doctor_name, doctor_specialty, doctor_emoji,
         TO_CHAR(appointment_date, 'DD') AS date_num,
         TO_CHAR(appointment_date, 'Mon') AS date_month,
         TO_CHAR(appointment_date, 'Dy DD Mon YYYY') AS date_label,
         appointment_time, session_type, note, status, price, created_at
       FROM appointments
       WHERE user_id = $1
       ORDER BY appointment_date DESC, appointment_time ASC`,
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── BOOK APPOINTMENT ───────────────────────────────
router.post('/', authMiddle, async (req, res) => {
  const {
    doctorName, doctorSpecialty, doctorEmoji,
    date, time, sessionType, note, price
  } = req.body;

  if (!doctorName || !date || !time) {
    return res.status(400).json({ error: 'Doctor name, date and time are required.' });
  }

  try {
    const result = await db.query(
      `INSERT INTO appointments
         (user_id, doctor_name, doctor_specialty, doctor_emoji,
          appointment_date, appointment_time, session_type, note, price)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        req.user.userId, doctorName, doctorSpecialty || '',
        doctorEmoji || '👨‍⚕️', date, time,
        sessionType || 'Video', note || '', price || ''
      ]
    );

    // Increment sessions count
    await db.query(
      'UPDATE users SET sessions_done = sessions_done + 1 WHERE id = $1',
      [req.user.userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Booking error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── UPDATE STATUS (cancel / complete) ─────────────
router.patch('/:id/status', authMiddle, async (req, res) => {
  const { status } = req.body;
  const allowed = ['upcoming', 'completed', 'cancelled'];

  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${allowed.join(', ')}` });
  }

  try {
    const result = await db.query(
      `UPDATE appointments SET status = $1
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [status, req.params.id, req.user.userId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE APPOINTMENT ─────────────────────────────
router.delete('/:id', authMiddle, async (req, res) => {
  try {
    await db.query(
      'DELETE FROM appointments WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.userId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
