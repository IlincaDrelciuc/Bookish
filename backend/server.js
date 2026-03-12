require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const authenticate = require('./middleware/auth');

const app = express();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Bookish backend is running',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/me', authenticate, async (req, res) => {
  const userId = req.user.userId;
  try {
    const result = await pool.query(
      'SELECT id, email, username, created_at FROM users WHERE id = $1',
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/stats', authenticate, async (req, res) => {
  const userId = req.user.userId;
  try {
    const total = await pool.query(
      "SELECT COUNT(*) FROM reading_list WHERE user_id=$1 AND status='finished'",
      [userId]
    );
    const monthly = await pool.query(
      `SELECT TO_CHAR(finish_date, 'Mon') as month,
       EXTRACT(MONTH FROM finish_date)::integer as month_num,
       COUNT(*) as count
       FROM reading_list
       WHERE user_id=$1 AND status='finished'
       AND EXTRACT(YEAR FROM finish_date) = EXTRACT(YEAR FROM CURRENT_DATE)
       GROUP BY month, month_num ORDER BY month_num`,
      [userId]
    );
    const topGenres = await pool.query(
      `SELECT g.name, COUNT(DISTINCT rl.book_id)::integer as count
       FROM reading_list rl
       JOIN book_genres bg ON rl.book_id = bg.book_id
       JOIN genres g ON bg.genre_id = g.id
       WHERE rl.user_id=$1 AND rl.status='finished'
       GROUP BY g.id, g.name ORDER BY count DESC LIMIT 5`,
      [userId]
    );
    const pages = await pool.query(
      `SELECT COALESCE(SUM(b.page_count),0) as total
       FROM reading_list rl JOIN books b ON rl.book_id=b.id
       WHERE rl.user_id=$1 AND rl.status='finished'`,
      [userId]
    );
    res.json({
      totalBooksRead: parseInt(total.rows[0].count),
      booksPerMonth: monthly.rows,
      topGenres: topGenres.rows,
      totalPagesRead: parseInt(pages.rows[0].total),
    });
  } catch (error) {
    console.error('Stats error:', error.message);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

app.post('/api/synopsis', authenticate, async (req, res) => {
  const { title, authors } = req.body;
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Write a short, engaging 3-sentence description of the book "${title}" by ${authors}. Write it in a literary, evocative style suited to a vintage book app. Do not use phrases like "this book" or "the author". Just describe the story and its themes directly. Return only the description, nothing else.`
            }]
          }]
        })
      }
    );
    const data = await response.json();
    console.log('Gemini response:', JSON.stringify(data, null, 2));
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    res.json({ synopsis: text });
  } catch (err) {
    console.error('Synopsis error:', err);
    res.status(500).json({ error: 'Failed to generate synopsis' });
  }
});

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const bookRoutes = require('./routes/books');
app.use('/api/books', bookRoutes);

const onboardingRoutes = require('./routes/onboarding');
app.use('/api/onboarding', onboardingRoutes);

const readingListRoutes = require('./routes/readingList');
app.use('/api/reading-list', readingListRoutes);

const recommendationRoutes = require('./routes/recommendations');
app.use('/api/recommendations', recommendationRoutes);

const reviewRoutes = require('./routes/reviews');
app.use('/api/reviews', reviewRoutes);

const PORT = process.env.PORT || 3001;

// GET /api/books/:id/similar
app.get('/api/books/:id/similar', async (req, res) => {
  const bookId = parseInt(req.params.id);
  try {
    const result = await pool.query(
      `SELECT b.id, b.title, b.cover_image_url, b.average_rating,
       array_agg(DISTINCT a.name) FILTER (WHERE a.name IS NOT NULL) AS authors,
       COUNT(DISTINCT bg_match.genre_id) AS shared_genres
       FROM books b
       JOIN book_genres bg_match ON b.id = bg_match.book_id
       LEFT JOIN book_authors ba ON b.id = ba.book_id
       LEFT JOIN authors a ON ba.author_id = a.id
       WHERE bg_match.genre_id IN (
         SELECT genre_id FROM book_genres WHERE book_id = $1
       )
       AND b.id != $1
       GROUP BY b.id
       ORDER BY shared_genres DESC, b.average_rating DESC NULLS LAST
       LIMIT 6`,
      [bookId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch similar books' });
  }
});

app.get('/api/profile/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const userResult = await pool.query(
      'SELECT id, username, created_at FROM users WHERE username = $1',
      [username]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = userResult.rows[0];

    const statsResult = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status='finished') AS finished,
         COUNT(*) FILTER (WHERE status='reading') AS reading,
         COUNT(*) FILTER (WHERE status='to-read') AS to_read
       FROM reading_list WHERE user_id = $1`,
      [user.id]
    );

    const reviewCountResult = await pool.query(
      `SELECT COUNT(*) AS review_count FROM reviews WHERE user_id = $1`,
      [user.id]
    );

    const ratingCountResult = await pool.query(
      `SELECT COUNT(*) AS rating_count FROM ratings WHERE user_id = $1`,
      [user.id]
    );

    const booksThisYearResult = await pool.query(
      `SELECT COUNT(*) AS count FROM reading_list
       WHERE user_id = $1 AND status = 'finished'
       AND EXTRACT(YEAR FROM added_at) = EXTRACT(YEAR FROM NOW())`,
      [user.id]
    );

    const currentlyReadingResult = await pool.query(
  `SELECT b.id, b.title, b.cover_image_url, b.page_count, rl.current_page AS progress
   FROM reading_list rl JOIN books b ON rl.book_id = b.id
   WHERE rl.user_id = $1 AND rl.status = 'reading'
   ORDER BY rl.added_at DESC`,
  [user.id]
);

    const recentResult = await pool.query(
      `SELECT b.id, b.title, b.cover_image_url
       FROM reading_list rl JOIN books b ON rl.book_id = b.id
       WHERE rl.user_id = $1 AND rl.status = 'finished'
       ORDER BY rl.added_at DESC NULLS LAST LIMIT 6`,
      [user.id]
    );

    const reviewsResult = await pool.query(
      `SELECT r.body, r.created_at, b.title, b.id AS book_id
       FROM reviews r JOIN books b ON r.book_id = b.id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC LIMIT 3`,
      [user.id]
    );

    const genresResult = await pool.query(
      `SELECT g.name, COUNT(*) AS count
       FROM reading_list rl
       JOIN book_genres bg ON rl.book_id = bg.book_id
       JOIN genres g ON bg.genre_id = g.id
       WHERE rl.user_id = $1 AND rl.status = 'finished'
       GROUP BY g.name
       ORDER BY count DESC
       LIMIT 5`,
      [user.id]
    );

    res.json({
      user: { username: user.username, memberSince: user.created_at },
      stats: {
        ...statsResult.rows[0],
        reviewCount: parseInt(reviewCountResult.rows[0].review_count),
        ratingCount: parseInt(ratingCountResult.rows[0].rating_count),
        booksThisYear: parseInt(booksThisYearResult.rows[0].count),
      },
      currentlyReading: currentlyReadingResult.rows,
      recentlyFinished: recentResult.rows,
      recentReviews: reviewsResult.rows,
      favouriteGenres: genresResult.rows,
    });
  } catch (error) {
    console.error('Profile error:', error.message);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

app.listen(PORT, () => {
  console.log(`Bookish backend running on http://localhost:${PORT}`);
});