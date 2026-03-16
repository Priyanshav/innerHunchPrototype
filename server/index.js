require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();

// ── MIDDLEWARE ─────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));   // 10mb allows base64 avatar images
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files from /public
app.use(express.static(path.join(__dirname, '../public')));

// ── API ROUTES ─────────────────────────────────────
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/moods',        require('./routes/moods'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/profile',      require('./routes/profile'));
app.use('/api/bookmarks',    require('./routes/bookmarks'));

// ── HEALTH CHECK ───────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── SERVE FRONTEND (catch-all) ─────────────────────
// Any route not starting with /api serves the frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ── GLOBAL ERROR HANDLER ───────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── START SERVER ───────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('');
  console.log('  ✦ Inner Hunch is running!');
  console.log(`  → Local:   http://localhost:${PORT}`);
  console.log(`  → Health:  http://localhost:${PORT}/api/health`);
  console.log('');
});
