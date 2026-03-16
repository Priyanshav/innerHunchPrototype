const router     = require('express').Router();
const db         = require('../db');
const authMiddle = require('../middleware/auth');

// GET all bookmarks for user
router.get('/', authMiddle, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT article_id, saved_at FROM bookmarks WHERE user_id = $1 ORDER BY saved_at DESC',
      [req.user.userId]
    );
    res.json(result.rows.map(r => r.article_id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle bookmark (add if not exists, remove if exists)
router.post('/toggle', authMiddle, async (req, res) => {
  const { articleId } = req.body;
  if (!articleId) return res.status(400).json({ error: 'articleId is required.' });

  try {
    const existing = await db.query(
      'SELECT id FROM bookmarks WHERE user_id=$1 AND article_id=$2',
      [req.user.userId, articleId]
    );

    if (existing.rows.length > 0) {
      await db.query('DELETE FROM bookmarks WHERE user_id=$1 AND article_id=$2', [req.user.userId, articleId]);
      res.json({ bookmarked: false });
    } else {
      await db.query('INSERT INTO bookmarks (user_id, article_id) VALUES ($1,$2)', [req.user.userId, articleId]);
      res.json({ bookmarked: true });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
