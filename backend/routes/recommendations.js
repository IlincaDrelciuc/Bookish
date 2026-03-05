const express = require('express');
const { Pool } = require('pg');
const authenticate = require('../middleware/auth');

const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ||
    'postgresql://postgres:bookish2025@localhost:5432/bookish',
});

// ─────────────────────────────────────────────────────────
// getGenreIdsForUser
// Returns genre IDs from the user's finished books.
// Falls back to their onboarding preferences if they have
// no finished books yet (cold-start solution).
// ─────────────────────────────────────────────────────────
async function getGenreIdsForUser(userId) {
  const historyResult = await pool.query(
    `SELECT DISTINCT bg.genre_id
     FROM reading_list rl
     JOIN book_genres bg ON rl.book_id = bg.book_id
     WHERE rl.user_id = $1 AND rl.status = 'finished'`,
    [userId]
  );
  if (historyResult.rows.length > 0) {
    return historyResult.rows.map(r => r.genre_id);
  }
  const prefResult = await pool.query(
    `SELECT favourite_genre_ids FROM user_preferences WHERE user_id = $1`,
    [userId]
  );
  if (prefResult.rows.length > 0 && prefResult.rows[0].favourite_genre_ids) {
    return prefResult.rows[0].favourite_genre_ids;
  }
  return [];
}

// ─────────────────────────────────────────────────────────
// GET /api/recommendations/sql-v1
// Variant A: Content-based filtering using genre overlap.
// Finds books sharing genres with the user's finished books.
// Ranks by: (1) number of overlapping genres, (2) community rating.
// ─────────────────────────────────────────────────────────
router.get('/sql-v1', authenticate, async (req, res) => {
  const userId = req.user.userId;

  try {
    const genreIds = await getGenreIdsForUser(userId);

    if (genreIds.length === 0) {
      const fallback = await pool.query(
        `SELECT b.id, b.title, b.cover_image_url, b.average_rating,
         b.ratings_count, b.publication_year,
         array_agg(DISTINCT a.name) FILTER (WHERE a.name IS NOT NULL) AS authors,
         array_agg(DISTINCT g.name) FILTER (WHERE g.name IS NOT NULL) AS genres,
         0 AS genre_overlap_score
         FROM books b
         LEFT JOIN book_authors ba ON b.id = ba.book_id
         LEFT JOIN authors a ON ba.author_id = a.id
         LEFT JOIN book_genres bg ON b.id = bg.book_id
         LEFT JOIN genres g ON bg.genre_id = g.id
         WHERE b.id NOT IN (SELECT book_id FROM reading_list WHERE user_id = $1)
         GROUP BY b.id
         ORDER BY b.average_rating DESC NULLS LAST, b.ratings_count DESC
         LIMIT 10`,
        [userId]
      );
      return res.json({
        recommendations: fallback.rows,
        algorithm: 'sql-v1-fallback',
        note: 'Showing top-rated books — add more finished books for personalised recommendations',
      });
    }

    const result = await pool.query(
      `SELECT
         b.id,
         b.title,
         b.cover_image_url,
         b.average_rating,
         b.ratings_count,
         b.publication_year,
         array_agg(DISTINCT a.name) FILTER (WHERE a.name IS NOT NULL) AS authors,
         array_agg(DISTINCT g.name) FILTER (WHERE g.name IS NOT NULL) AS genres,
         COUNT(DISTINCT CASE
           WHEN bg_match.genre_id = ANY($2::int[])
           THEN bg_match.genre_id
         END) AS genre_overlap_score
       FROM books b
       LEFT JOIN book_authors ba ON b.id = ba.book_id
       LEFT JOIN authors a ON ba.author_id = a.id
       LEFT JOIN book_genres bg_match ON b.id = bg_match.book_id
       LEFT JOIN book_genres bg_display ON b.id = bg_display.book_id
       LEFT JOIN genres g ON bg_display.genre_id = g.id
       WHERE b.id NOT IN (
         SELECT book_id FROM reading_list WHERE user_id = $1
       )
       AND b.id IN (
         SELECT DISTINCT book_id FROM book_genres
         WHERE genre_id = ANY($2::int[])
       )
       GROUP BY b.id
       ORDER BY genre_overlap_score DESC, b.average_rating DESC NULLS LAST
       LIMIT 10`,
      [userId, genreIds]
    );

    res.json({
      recommendations: result.rows,
      algorithm: 'sql-v1',
      genreCount: genreIds.length,
      note: 'Content-based filtering using genre overlap scoring',
    });

  } catch (error) {
    console.error('SQL V1 recommendation error:', error.message);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

module.exports = router;