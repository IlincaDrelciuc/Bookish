require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fetchOpenLibrary(title, author) {
  const url = `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}&limit=1`;
  const response = await fetch(url);
  if (!response.ok) return null;
  const data = await response.json();
  const book = data.docs?.[0];
  if (!book) return null;
  const cover = book.cover_i
    ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
    : null;
  return {
    cover_image_url: cover,
    page_count: book.number_of_pages_median || null,
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
        const data = await fetchOpenLibrary(book.title, author);

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
        console.error(`Error updating "${book.title}":`, err.message);
        errors++;
      }

      if ((updated + notFound + errors) % 100 === 0) {
        console.log(`Progress: ${updated + notFound + errors}/${books.length} — Updated: ${updated}, Not found: ${notFound}, Errors: ${errors}`);
      }

      await sleep(300);
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