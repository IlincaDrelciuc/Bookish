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

// ─────────────────────────────────────────────────────────
// GET /api/recommendations/sql-v2
// Variant B: Weighted hybrid — genre overlap + author bonus.
// Same as V1 but books by previously-read authors get +2 points.
// ─────────────────────────────────────────────────────────
router.get('/sql-v2', authenticate, async (req, res) => {
  const userId = req.user.userId;

  try {
    const genreIds = await getGenreIdsForUser(userId);

    if (genreIds.length === 0) {
      // Same fallback as V1
      const fallback = await pool.query(
        `SELECT b.id, b.title, b.cover_image_url, b.average_rating,
         b.ratings_count, b.publication_year,
         array_agg(DISTINCT a.name) FILTER (WHERE a.name IS NOT NULL) AS authors,
         array_agg(DISTINCT g.name) FILTER (WHERE g.name IS NOT NULL) AS genres,
         0 AS total_score, 0 AS genre_score, 0 AS author_bonus
         FROM books b
         LEFT JOIN book_authors ba ON b.id = ba.book_id
         LEFT JOIN authors a ON ba.author_id = a.id
         LEFT JOIN book_genres bg ON b.id = bg.book_id
         LEFT JOIN genres g ON bg.genre_id = g.id
         WHERE b.id NOT IN (SELECT book_id FROM reading_list WHERE user_id = $1)
         GROUP BY b.id
         ORDER BY b.average_rating DESC NULLS LAST LIMIT 10`,
        [userId]
      );
      return res.json({ recommendations: fallback.rows, algorithm: 'sql-v2-fallback' });
    }

    // ── Get author IDs of authors the user has read ──
    // We need this separately to calculate the author bonus
    const readAuthorsResult = await pool.query(
      `SELECT DISTINCT ba.author_id
       FROM reading_list rl
       JOIN book_authors ba ON rl.book_id = ba.book_id
       WHERE rl.user_id = $1 AND rl.status = 'finished'`,
      [userId]
    );
    const readAuthorIds = readAuthorsResult.rows.map(r => r.author_id);

    // ── The main Variant B query ──
    // This is the same as V1 but adds the CASE expression for author bonus
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

         -- Genre overlap score (same as V1)
         COUNT(DISTINCT CASE
           WHEN bg_match.genre_id = ANY($2::int[])
           THEN bg_match.genre_id
         END) AS genre_score,

         -- Author bonus: +2 if book is by a previously-read author
         -- CASE expression: evaluates a condition and returns a value
         -- EXISTS checks if the subquery returns any rows
         CASE
           WHEN EXISTS (
             SELECT 1
             FROM book_authors ba_check
             WHERE ba_check.book_id = b.id
               AND ba_check.author_id = ANY($3::int[])
           ) THEN 2
           ELSE 0
         END AS author_bonus,

         -- Total score = genre overlap + author bonus
         -- This is the primary sort key
         COUNT(DISTINCT CASE
           WHEN bg_match.genre_id = ANY($2::int[])
           THEN bg_match.genre_id
         END) +
         CASE
           WHEN EXISTS (
             SELECT 1
             FROM book_authors ba_check
             WHERE ba_check.book_id = b.id
               AND ba_check.author_id = ANY($3::int[])
           ) THEN 2
           ELSE 0
         END AS total_score

       FROM books b
       LEFT JOIN book_authors ba ON b.id = ba.book_id
       LEFT JOIN authors a ON ba.author_id = a.id
       LEFT JOIN book_genres bg_match ON b.id = bg_match.book_id
       LEFT JOIN book_genres bg_display ON b.id = bg_display.book_id
       LEFT JOIN genres g ON bg_display.genre_id = g.id

       WHERE b.id NOT IN (SELECT book_id FROM reading_list WHERE user_id = $1)
       AND b.id IN (
         SELECT DISTINCT book_id FROM book_genres WHERE genre_id = ANY($2::int[])
       )

       GROUP BY b.id

       -- Sort by total_score first, then by rating to break ties
       ORDER BY total_score DESC, b.average_rating DESC NULLS LAST

       LIMIT 10`,
      [userId, genreIds, readAuthorIds.length > 0 ? readAuthorIds : [0]]
      // [0] is a dummy value so the array is never empty
    );

    res.json({
      recommendations: result.rows,
      algorithm: 'sql-v2',
      genreCount: genreIds.length,
      readAuthorsCount: readAuthorIds.length,
      note: 'Weighted hybrid: genre overlap (primary) + author familiarity bonus (+2)',
    });

  } catch (error) {
    console.error('SQL V2 recommendation error:', error.message);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});


module.exports = router;