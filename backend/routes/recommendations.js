const express = require('express');
const { Pool } = require('pg');
const authenticate = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ||
    'postgresql://postgres:bookish2025@localhost:5432/bookish',
});

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
         b.id, b.title, b.cover_image_url, b.average_rating,
         b.ratings_count, b.publication_year,
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
       WHERE b.id NOT IN (SELECT book_id FROM reading_list WHERE user_id = $1)
       AND b.id IN (SELECT DISTINCT book_id FROM book_genres WHERE genre_id = ANY($2::int[]))
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

router.get('/sql-v2', authenticate, async (req, res) => {
  const userId = req.user.userId;
  try {
    const genreIds = await getGenreIdsForUser(userId);
    if (genreIds.length === 0) {
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
    const readAuthorsResult = await pool.query(
      `SELECT DISTINCT ba.author_id
       FROM reading_list rl
       JOIN book_authors ba ON rl.book_id = ba.book_id
       WHERE rl.user_id = $1 AND rl.status = 'finished'`,
      [userId]
    );
    const readAuthorIds = readAuthorsResult.rows.map(r => r.author_id);
    const result = await pool.query(
      `SELECT
         b.id, b.title, b.cover_image_url, b.average_rating,
         b.ratings_count, b.publication_year,
         array_agg(DISTINCT a.name) FILTER (WHERE a.name IS NOT NULL) AS authors,
         array_agg(DISTINCT g.name) FILTER (WHERE g.name IS NOT NULL) AS genres,
         COUNT(DISTINCT CASE
           WHEN bg_match.genre_id = ANY($2::int[])
           THEN bg_match.genre_id
         END) AS genre_score,
         CASE
           WHEN EXISTS (
             SELECT 1 FROM book_authors ba_check
             WHERE ba_check.book_id = b.id AND ba_check.author_id = ANY($3::int[])
           ) THEN 2
           ELSE 0
         END AS author_bonus,
         COUNT(DISTINCT CASE
           WHEN bg_match.genre_id = ANY($2::int[])
           THEN bg_match.genre_id
         END) +
         CASE
           WHEN EXISTS (
             SELECT 1 FROM book_authors ba_check
             WHERE ba_check.book_id = b.id AND ba_check.author_id = ANY($3::int[])
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
       AND b.id IN (SELECT DISTINCT book_id FROM book_genres WHERE genre_id = ANY($2::int[]))
       GROUP BY b.id
       ORDER BY total_score DESC, b.average_rating DESC NULLS LAST
       LIMIT 10`,
      [userId, genreIds, readAuthorIds.length > 0 ? readAuthorIds : [0]]
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

router.get('/gemini', authenticate, async (req, res) => {
  const userId = req.user.userId;
  try {
    const cacheResult = await pool.query(
      `SELECT recommendations, created_at FROM gemini_cache
       WHERE user_id = $1
       AND created_at > NOW() - INTERVAL '24 hours'`,
      [userId]
    );

    if (cacheResult.rows.length > 0) {
      console.log(`Returning cached Gemini recommendations for user ${userId}`);
      return res.json({
        recommendations: cacheResult.rows[0].recommendations,
        algorithm: 'gemini',
        cached: true,
        note: 'AI-generated recommendations with personalised explanations',
      });
    }

    const historyResult = await pool.query(
      `SELECT b.title,
       array_agg(DISTINCT g.name) FILTER (WHERE g.name IS NOT NULL) AS genres
       FROM reading_list rl
       JOIN books b ON rl.book_id = b.id
       LEFT JOIN book_genres bg ON b.id = bg.book_id
       LEFT JOIN genres g ON bg.genre_id = g.id
       WHERE rl.user_id = $1 AND rl.status = 'finished'
       GROUP BY b.title
       LIMIT 20`,
      [userId]
    );
    const prefResult = await pool.query(
      `SELECT g.name FROM user_preferences up
       JOIN genres g ON g.id = ANY(up.favourite_genre_ids)
       WHERE up.user_id = $1`,
      [userId]
    );
    const readingHistory = historyResult.rows;
    const favouriteGenres = prefResult.rows.map(r => r.name);
    const alreadyReadTitles = readingHistory.map(b => b.title);

    if (readingHistory.length === 0 && favouriteGenres.length === 0) {
      return res.json({
        recommendations: [],
        algorithm: 'gemini',
        note: 'Complete your onboarding quiz and add finished books for Gemini recommendations',
      });
    }

    const historyText = readingHistory.length > 0
      ? readingHistory.map(b =>
          `- "${b.title}"${b.genres && b.genres.length > 0 ? ` (${b.genres.join(', ')})` : ''}`
        ).join('\n')
      : 'No finished books yet';

    const genresText = favouriteGenres.length > 0
      ? favouriteGenres.join(', ')
      : 'Not specified';

    const prompt = `You are a personalised literary recommendation assistant with deep knowledge of world literature.

READER PROFILE:
Recently finished books:
${historyText}

Favourite genres: ${genresText}

TASK:
Recommend exactly 8 books this reader has NOT already read.

REQUIREMENTS:
- ONLY recommend very well-known, widely published books that would appear in any major book database
- Prioritise bestsellers, award winners, and books with over 100,000 Goodreads ratings
- Each recommendation must match at least one of the reader's favourite genres or reading history
- Do NOT recommend any of these already-read books: ${alreadyReadTitles.slice(0, 10).join(', ')}
- The reason must explain specifically why this book suits THIS reader's taste

OUTPUT FORMAT:
Return ONLY a valid JSON array. No markdown, no backticks, no preamble, no explanation.
[{"title": "Book Name", "author": "Author Name", "reason": "one sentence reason"}]`;

    console.log(`Calling Gemini for user ${userId}...`);
    const startTime = Date.now();

    const geminiResult = await geminiModel.generateContent(prompt);
    const rawText = geminiResult.response.text();
    const elapsedMs = Date.now() - startTime;

    console.log(`Gemini responded in ${elapsedMs}ms`);

    let recommendations;
    try {
      const cleanText = rawText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      recommendations = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Failed to parse Gemini JSON:', rawText);
      return res.status(500).json({
        error: 'Gemini returned unexpected format. Please try again.',
      });
    }

    await pool.query(
      `INSERT INTO gemini_cache (user_id, recommendations, created_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id) DO UPDATE
       SET recommendations = $2, created_at = NOW()`,
      [userId, JSON.stringify(recommendations)]
    );

    res.json({
      recommendations,
      algorithm: 'gemini',
      cached: false,
      responseTimeMs: elapsedMs,
      note: 'AI-generated recommendations with personalised explanations',
    });

  } catch (error) {
    console.error('Gemini recommendation error:', error.message);
    if (error.message.includes('API key')) {
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }
    if (error.message.includes('quota')) {
      return res.status(429).json({ error: 'Gemini API quota exceeded. Please try again later.' });
    }
    res.status(500).json({ error: 'Failed to generate recommendations. Please try again.' });
  }
});

module.exports = router;