const express = require('express');
const { Pool } = require('pg');

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL ||
    'postgresql://postgres:bookish2025@localhost:5432/bookish',
});

const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY;

// ── Helper: fetch from Google Books API ──
async function searchGoogleBooks(query) {
  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10&printType=books&key=${GOOGLE_BOOKS_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    if (!data.items) return [];

    return data.items.map(item => {
      const info = item.volumeInfo;
      const cover = info.imageLinks?.thumbnail?.replace('http://', 'https://') || null;
      return {
        google_books_id: item.id,
        title: info.title || 'Unknown Title',
        authors: info.authors || [],
        genres: info.categories || [],
        cover_image_url: cover,
        average_rating: info.averageRating || null,
        ratings_count: info.ratingsCount || 0,
        publication_year: info.publishedDate
          ? parseInt(info.publishedDate.substring(0, 4))
          : null,
        page_count: info.pageCount || null,
        synopsis: info.description || null,
        source: 'google', // flag so frontend knows it's not in DB yet
      };
    });
  } catch (err) {
    console.error('Google Books API error:', err.message);
    return [];
  }
}

// ── GET /api/books ── (unchanged)
router.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 24;
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
        total, page, limit,
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

// ── GET /api/books/search ── (local only, unchanged)
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

// ── GET /api/books/search/combined ── (local + Google Books)
router.get('/search/combined', async (req, res) => {
  const { query } = req.query;
  if (!query || !query.trim()) return res.json({ local: [], google: [] });

  try {
    // Run both searches in parallel
    const [localResult, googleResults] = await Promise.all([
      pool.query(
        `SELECT DISTINCT
          b.id, b.title, b.cover_image_url, b.average_rating,
          b.ratings_count, b.publication_year,
          array_agg(DISTINCT a.name) FILTER (WHERE a.name IS NOT NULL) AS authors,
          array_agg(DISTINCT g.name) FILTER (WHERE g.name IS NOT NULL) AS genres
        FROM books b
        LEFT JOIN book_authors ba ON b.id = ba.book_id
        LEFT JOIN authors a ON ba.author_id = a.id
        LEFT JOIN book_genres bg ON b.id = bg.book_id
        LEFT JOIN genres g ON bg.genre_id = g.id
        WHERE b.title ILIKE $1 OR a.name ILIKE $1
        GROUP BY b.id
        ORDER BY b.ratings_count DESC NULLS LAST
        LIMIT 10`,
        [`%${query.trim()}%`]
      ),
      searchGoogleBooks(query),
    ]);

    // Filter out Google results that are already in local DB by title match
    const localTitles = new Set(
      localResult.rows.map(b => b.title.toLowerCase().trim())
    );
    const filteredGoogle = googleResults.filter(
      b => !localTitles.has(b.title.toLowerCase().trim())
    );

    res.json({
      local: localResult.rows,
      google: filteredGoogle,
    });
  } catch (error) {
    console.error('Combined search error:', error.message);
    res.status(500).json({ error: 'Search failed' });
  }
});

// ── POST /api/books/import ── (save a Google Books result into DB)
router.post('/import', async (req, res) => {
  const { google_books_id, title, authors, genres, cover_image_url,
          average_rating, ratings_count, publication_year,
          page_count, synopsis } = req.body;

  try {
    // Check if already imported by google_books_id or title
    const existing = await pool.query(
      'SELECT id FROM books WHERE google_books_id = $1 OR title = $2',
      [google_books_id, title]
    );
    if (existing.rows.length > 0) {
      return res.json({ id: existing.rows[0].id, alreadyExisted: true });
    }

    // Insert the book
    const bookResult = await pool.query(
      `INSERT INTO books
        (title, cover_image_url, average_rating, ratings_count,
         publication_year, page_count, synopsis, google_books_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [title, cover_image_url, average_rating, ratings_count,
       publication_year, page_count, synopsis, google_books_id]
    );
    const bookId = bookResult.rows[0].id;

    // Insert authors
    for (const authorName of (authors || [])) {
      let authorResult = await pool.query(
        'SELECT id FROM authors WHERE name = $1', [authorName]
      );
      if (authorResult.rows.length === 0) {
        authorResult = await pool.query(
          'INSERT INTO authors (name) VALUES ($1) RETURNING id', [authorName]
        );
      }
      const authorId = authorResult.rows[0].id;
      await pool.query(
        'INSERT INTO book_authors (book_id, author_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [bookId, authorId]
      );
    }

    // Insert genres
    for (const genreName of (genres || [])) {
      const cleanGenre = genreName.split('/')[0].trim(); // Google uses "Fiction / Fantasy" etc
      if (!cleanGenre) continue;
      let genreResult = await pool.query(
        'SELECT id FROM genres WHERE name = $1', [cleanGenre]
      );
      if (genreResult.rows.length === 0) {
        genreResult = await pool.query(
          'INSERT INTO genres (name) VALUES ($1) RETURNING id', [cleanGenre]
        );
      }
      const genreId = genreResult.rows[0].id;
      await pool.query(
        'INSERT INTO book_genres (book_id, genre_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [bookId, genreId]
      );
    }

    res.json({ id: bookId, alreadyExisted: false });
  } catch (error) {
    console.error('Import error:', error.message);
    res.status(500).json({ error: 'Failed to import book' });
  }
});

// ── GET /api/books/cover-lookup ── (unchanged)
router.get('/cover-lookup', async (req, res) => {
  const { title, author } = req.query;
  try {
    let url = `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}&limit=1`;
    let response = await fetch(url);
    let data = await response.json();
    let book = data.docs?.[0];

    if (!book?.cover_i) {
      url = `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=1`;
      response = await fetch(url);
      data = await response.json();
      book = data.docs?.[0];
    }

    if (!book?.cover_i) {
      url = `https://openlibrary.org/search.json?q=${encodeURIComponent(title + ' ' + author)}&limit=1`;
      response = await fetch(url);
      data = await response.json();
      book = data.docs?.[0];
    }

    if (!book?.cover_i) return res.json({ cover_image_url: null });

    const cover = `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`;
    res.json({ cover_image_url: cover });
  } catch (err) {
    console.error('Cover lookup error:', err.message);
    res.json({ cover_image_url: null });
  }
});

// ── GET /api/books/:id ── (unchanged)
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