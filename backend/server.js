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

app.get('/api/books', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
          b.id,
          b.title,
          b.cover_image_url,
          b.average_rating,
          b.ratings_count,
          b.publication_year,
          array_agg(DISTINCT a.name) AS authors
       FROM books b
       LEFT JOIN book_authors ba ON b.id = ba.book_id
       LEFT JOIN authors a ON ba.author_id = a.id
       GROUP BY b.id
       ORDER BY b.ratings_count DESC NULLS LAST
       LIMIT 20`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching books:', error.message);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

app.get('/api/books/:id', async (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid book ID' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM books WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching book:', error.message);
    res.status(500).json({ error: 'Failed to fetch book' });
  }
});

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Bookish backend running on http://localhost:${PORT}`);
});