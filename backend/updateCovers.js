require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fetchGoogleBooks(title, author) {
  const query = `${title} ${author}`.trim();
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&key=${process.env.GOOGLE_BOOKS_API_KEY}&maxResults=1`;
  const response = await fetch(url);
  if (!response.ok) return null;
  const data = await response.json();
  const item = data.items?.[0];
  if (!item) return null;
  const info = item.volumeInfo;
  const cover = info.imageLinks?.extraLarge
    || info.imageLinks?.large
    || info.imageLinks?.medium
    || info.imageLinks?.thumbnail
    || null;
  return {
    cover_image_url: cover ? cover.replace('http://', 'https://') : null,
    page_count: info.pageCount || null,
  };
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function updateCovers() {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT b.id, b.title, array_agg(a.name) as authors
       FROM books b
       LEFT JOIN book_authors ba ON b.id = ba.book_id
       LEFT JOIN authors a ON ba.author_id = a.id
       WHERE (
         b.cover_image_url IS NULL
         OR (
           b.cover_image_url NOT LIKE '%books.google%'
           AND b.cover_image_url NOT LIKE '%openlibrary%'
         )
       )
       GROUP BY b.id
       ORDER BY b.ratings_count DESC NULLS LAST`
    );
    const books = result.rows;
    console.log(`Found ${books.length} books to update.`);
    console.log('Starting update...\n');

    let updated = 0;
    let notFound = 0;
    let errors = 0;

    for (const book of books) {
      const author = book.authors?.[0] || '';
      try {
        const data = await fetchGoogleBooks(book.title, author);
        if (!data || !data.cover_image_url) {
          notFound++;
        } else {
          await client.query(
            `UPDATE books SET
               cover_image_url = $1,
               page_count = COALESCE($2, page_count)
             WHERE id = $3`,
            [data.cover_image_url, data.page_count, book.id]
          );
          updated++;
        }
      } catch (err) {
        if (err.message.includes('quota') || err.message.includes('429')) {
          console.log('\nQuota reached! Stopping for today.');
          break;
        }
        console.error(`Error updating "${book.title}":`, err.message);
        errors++;
      }

      if ((updated + notFound + errors) % 50 === 0) {
        console.log(`Progress: ${updated + notFound + errors}/${books.length} — Updated: ${updated}, Not found: ${notFound}, Errors: ${errors}`);
      }

      await sleep(100);
    }

    console.log('\n─── Update Complete ───');
    console.log(`Updated:   ${updated}`);
    console.log(`Not found: ${notFound}`);
    console.log(`Errors:    ${errors}`);
  } finally {
    client.release();
    await pool.end();
  }
}

updateCovers().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});