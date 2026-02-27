const express = require('express');
const { Pool } = require('pg');

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL ||
    'postgresql://postgres:bookish2025@localhost:5432/bookish',
});

router.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  try {
    const booksResult = await pool.query(
      `SELECT
        b.id, b.title, b.cover_image_url, b.average_rating,
        b.ratings_count, b.publication_year, b.page_count,
        array_agg(DISTINCT a.name) FILTER (WHERE a.name IS NOT NULL) AS authors,
        array_agg(DISTINCT g.name) FILTER (WHERE g.name IS NOT NULL) AS genres
      FROM books b
      LEFT JOIN book_authors ba ON b.id = ba.book_id
      LEFT JOIN authors a ON ba.author_id = a.id
      LEFT JOIN book_genres bg ON b.id = bg.book_id
      LEFT JOIN genres g ON bg.genre_id = g.id
      GROUP BY b.id
      ORDER BY b.ratings_count DESC NULLS LAST
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await pool.query('SELECT COUNT(*) FROM books');
    const total = parseInt(countResult.rows[0].count);

    res.json({
      books: booksResult.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      }
    });

  } catch (error) {
    console.error('Error fetching books:', error.message);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

router.get('/search', async (req, res) => {
  const { query, genre, minRating, yearFrom, yearTo } = req.query;
  const limit = parseInt(req.query.limit) || 40;

  let whereClauses = ['1=1'];
  let params = [];

  if (query && query.trim()) {
    params.push(`%${query.trim()}%`);
    whereClauses.push(
      `(b.title ILIKE $${params.length} OR a.name ILIKE $${params.length})`
    );
  }

  if (genre) {
    params.push(genre);
    whereClauses.push(`g.name = $${params.length}`);
  }

  if (minRating) {
    params.push(parseFloat(minRating));
    whereClauses.push(`b.average_rating >= $${params.length}`);
  }

  if (yearFrom) {
    params.push(parseInt(yearFrom));
    whereClauses.push(`b.publication_year >= $${params.length}`);
  }

  if (yearTo) {
    params.push(parseInt(yearTo));
    whereClauses.push(`b.publication_year <= $${params.length}`);
  }

  params.push(limit);
  const limitParam = params.length;

  try {
    const result = await pool.query(
      `SELECT DISTINCT
        b.id, b.title, b.cover_image_url, b.average_rating,
        b.ratings_count, b.publication_year,
        array_agg(DISTINCT a.name) FILTER (WHERE a.name IS NOT NULL) AS authors,
        array_agg(DISTINCT g2.name) FILTER (WHERE g2.name IS NOT NULL) AS genres
      FROM books b
      LEFT JOIN book_authors ba ON b.id = ba.book_id
      LEFT JOIN authors a ON ba.author_id = a.id
      LEFT JOIN book_genres bg ON b.id = bg.book_id
      LEFT JOIN genres g ON bg.genre_id = g.id
      LEFT JOIN book_genres bg2 ON b.id = bg2.book_id
      LEFT JOIN genres g2 ON bg2.genre_id = g2.id
      WHERE ${whereClauses.join(' AND ')}
      GROUP BY b.id
      ORDER BY b.ratings_count DESC NULLS LAST
      LIMIT $${limitParam}`,
      params
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({ error: 'Search failed' });
  }
});

router.get('/:id', async (req, res) => {
  const bookId = parseInt(req.params.id);
  if (isNaN(bookId)) return res.status(400).json({ error: 'Invalid book ID' });

  try {
    const bookResult = await pool.query(
      'SELECT * FROM books WHERE id = $1', [bookId]
    );
    if (bookResult.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }
    const book = bookResult.rows[0];

    const authorsResult = await pool.query(
      `SELECT a.id, a.name FROM authors a
      JOIN book_authors ba ON a.id = ba.author_id
      WHERE ba.book_id = $1`, [bookId]
    );

    const genresResult = await pool.query(
      `SELECT g.id, g.name FROM genres g
      JOIN book_genres bg ON g.id = bg.genre_id
      WHERE bg.book_id = $1`, [bookId]
    );

    const reviewsResult = await pool.query(
      `SELECT r.id, r.body, r.created_at, u.username,
      rt.score as user_rating
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN ratings rt ON rt.book_id = r.book_id AND rt.user_id = r.user_id
      WHERE r.book_id = $1
      ORDER BY r.created_at DESC LIMIT 20`, [bookId]
    );

    const ratingResult = await pool.query(
      `SELECT AVG(score)::DECIMAL(3,2) as average, COUNT(*) as count
      FROM ratings WHERE book_id = $1`, [bookId]
    );

    res.json({
      ...book,
      authors: authorsResult.rows,
      genres: genresResult.rows,
      reviews: reviewsResult.rows,
      communityRating: {
        average: parseFloat(ratingResult.rows[0].average) || 0,
        count: parseInt(ratingResult.rows[0].count) || 0,
      }
    });

  } catch (error) {
    console.error('Error fetching book:', error.message);
    res.status(500).json({ error: 'Failed to fetch book details' });
  }
});

module.exports = router;