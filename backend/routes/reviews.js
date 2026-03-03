const express = require('express');
const { Pool } = require('pg');
const authenticate = require('../middleware/auth');

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL ||
    'postgresql://postgres:bookish2025@localhost:5432/bookish',
});

// POST /api/reviews — submit or update a review
router.post('/', authenticate, async (req, res) => {
  const userId = req.user.userId;
  const { bookId, body, score } = req.body;

  if (!body || body.trim().length < 10) {
    return res.status(400).json({ error: 'Review must be at least 10 characters' });
  }

  try {
    // Insert or update review
    const reviewResult = await pool.query(
      `INSERT INTO reviews (user_id, book_id, body)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [userId, bookId, body.trim()]
    );

    // If score provided, insert or update rating
    if (score && score >= 1 && score <= 5) {
      await pool.query(
        `INSERT INTO ratings (user_id, book_id, score)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, book_id)
         DO UPDATE SET score = $3, created_at = CURRENT_TIMESTAMP`,
        [userId, bookId, score]
      );
    }

    res.status(201).json({ success: true, message: 'Review submitted!' });
  } catch (error) {
    console.error('Review error:', error.message);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

module.exports = router;
Register in server.js;
const reviewRoutes = require('./routes/reviews');
app.use('/api/reviews', reviewRoutes);
