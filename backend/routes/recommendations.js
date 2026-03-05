// ─────────────────────────────────────────────────────────
// getGenreIdsForUser
// Returns genre IDs from the user's finished books.
// Falls back to their onboarding preferences if they have
// no finished books yet (cold-start solution).
// ─────────────────────────────────────────────────────────
async function getGenreIdsForUser(userId) {
  // First: get genres from finished books
  const historyResult = await pool.query(
    `SELECT DISTINCT bg.genre_id
     FROM reading_list rl
     JOIN book_genres bg ON rl.book_id = bg.book_id
     WHERE rl.user_id = $1 AND rl.status = 'finished'`,
    [userId]
  );

  if (historyResult.rows.length > 0) {
    // User has reading history — use it
    return historyResult.rows.map(r => r.genre_id);
  }

  // Cold-start: no finished books
  // Fall back to onboarding quiz preferences
  const prefResult = await pool.query(
    `SELECT favourite_genre_ids FROM user_preferences WHERE user_id = $1`,
    [userId]
  );

  if (prefResult.rows.length > 0 && prefResult.rows[0].favourite_genre_ids) {
    return prefResult.rows[0].favourite_genre_ids;
  }

  // No history and no preferences — return empty (will get top-rated books)
  return [];
}


const express = require('express');
const { Pool } = require('pg');
const authenticate = require('../middleware/auth');

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL ||
    'postgresql://postgres:bookish2025@localhost:5432/bookish',
});

module.exports = router;
