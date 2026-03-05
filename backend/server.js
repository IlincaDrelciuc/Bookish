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
      `SELECT g.name, COUNT(*) as count
       FROM reading_list rl
       JOIN book_genres bg ON rl.book_id = bg.book_id
       JOIN genres g ON bg.genre_id = g.id
       WHERE rl.user_id=$1 AND rl.status='finished'
       GROUP BY g.name ORDER BY count DESC LIMIT 5`,
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

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Bookish backend running on http://localhost:${PORT}`);
});