const express = require('express');
const { Pool } = require('pg');
const authenticate = require('../middleware/auth');

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL ||
    'postgresql://postgres:bookish2025@localhost:5432/bookish',
});

// POST /api/reading-list — add or update a book in the list
router.post('/', authenticate, async (req, res) => {
  const userId = req.user.userId;
  const { bookId, status } = req.body;

  const validStatuses = ['to-read', 'reading', 'finished'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Status must be to-read, reading, or finished' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO reading_list (user_id, book_id, status, start_date, finish_date)
       VALUES ($1, $2, $3,
         CASE WHEN $3 = 'reading' THEN CURRENT_DATE ELSE NULL END,
         CASE WHEN $3 = 'finished' THEN CURRENT_DATE ELSE NULL END
       )
       ON CONFLICT (user_id, book_id)
       DO UPDATE SET
         status = $3,
         start_date = CASE
           WHEN $3 = 'reading' AND reading_list.start_date IS NULL
           THEN CURRENT_DATE
           ELSE reading_list.start_date END,
         finish_date = CASE
           WHEN $3 = 'finished' THEN CURRENT_DATE
           ELSE reading_list.finish_date END
       RETURNING *`,
      [userId, bookId, status]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Reading list error:', error.message);
    res.status(500).json({ error: 'Failed to update reading list' });
  }
});

// GET /api/reading-list — get all books in the user's list
router.get('/', authenticate, async (req, res) => {
  const userId = req.user.userId;
  try {
    const result = await pool.query(
      `SELECT rl.*, 
       b.title, b.cover_image_url, b.page_count, b.average_rating, b.publication_year,
       array_agg(DISTINCT a.name) FILTER (WHERE a.name IS NOT NULL) AS authors,
       rat.score AS user_rating
       FROM reading_list rl
       JOIN books b ON rl.book_id = b.id
       LEFT JOIN book_authors ba ON b.id = ba.book_id
       LEFT JOIN authors a ON ba.author_id = a.id
       LEFT JOIN ratings rat ON rat.book_id = b.id AND rat.user_id = $1
       WHERE rl.user_id = $1
       GROUP BY rl.id, b.title, b.cover_image_url, b.page_count, b.average_rating, b.publication_year, rat.score
       ORDER BY rl.added_at DESC`,
      [userId]
    );
    const grouped = {
      'to-read': result.rows.filter(r => r.status === 'to-read'),
      'reading': result.rows.filter(r => r.status === 'reading'),
      'finished': result.rows.filter(r => r.status === 'finished'),
    };
    res.json(grouped);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reading list' });
  }
});

// PATCH /api/reading-list/:bookId — update status or progress
router.patch('/:bookId', authenticate, async (req, res) => {
  const userId = req.user.userId;
  const bookId = parseInt(req.params.bookId);
  const { status, currentPage } = req.body;

  try {
    const result = await pool.query(
      `UPDATE reading_list SET
         status = COALESCE($1, status),
         current_page = COALESCE($2, current_page),
         start_date = CASE WHEN $1 = 'reading' AND start_date IS NULL THEN CURRENT_DATE ELSE start_date END,
         finish_date = CASE WHEN $1 = 'finished' THEN CURRENT_DATE ELSE finish_date END
       WHERE user_id = $3 AND book_id = $4
       RETURNING *`,
      [status || null, currentPage || null, userId, bookId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Book not in your list' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update' });
  }
});

module.exports = router;
