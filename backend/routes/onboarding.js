const express = require('express');
const { Pool } = require('pg');
const authenticate = require('../middleware/auth');

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL ||
    'postgresql://postgres:bookish2025@localhost:5432/bookish',
});

router.get('/genres', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name FROM genres ORDER BY name ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching genres:', error.message);
    res.status(500).json({ error: 'Failed to fetch genres' });
  }
});

router.post('/complete', authenticate, async (req, res) => {
  const userId = req.user.userId;
  const { genreIds, priorBookIds } = req.body;

  if (!genreIds || genreIds.length < 3) {
    return res.status(400).json({
      error: 'Please select at least 3 genres'
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE user_preferences
       SET favourite_genre_ids = $1, onboarding_completed = true
       WHERE user_id = $2`,
      [genreIds, userId]
    );

    if (priorBookIds && priorBookIds.length > 0) {
      for (const bookId of priorBookIds) {
        await client.query(
          `INSERT INTO reading_list (user_id, book_id, status, finish_date)
           VALUES ($1, $2, 'finished', CURRENT_DATE)
           ON CONFLICT (user_id, book_id) DO NOTHING`,
          [userId, bookId]
        );
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Onboarding complete! Your preferences have been saved.',
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Onboarding error:', error.message);
    res.status(500).json({ error: 'Failed to save preferences' });
  } finally {
    client.release();
  }
});

module.exports = router;