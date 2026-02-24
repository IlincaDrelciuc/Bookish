require("dotenv").config();
const { parse } = require("csv-parse/sync");
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function upsertAuthor(client, name) {
  const result = await client.query(
    `INSERT INTO authors (name)
     VALUES ($1)
     ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [name.trim()]
  );
  return result.rows[0].id;
}

async function upsertGenre(client, name) {
  const result = await client.query(
    `INSERT INTO genres (name)
     VALUES ($1)
     ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [name.trim()]
  );
  return result.rows[0].id;
}

async function importBooks() {
  const csvPath = path.join(__dirname, '../evaluation/books.csv');

  if (!fs.existsSync(csvPath)) {
    console.error('ERROR: books.csv not found at', csvPath);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(csvPath, 'utf8');

  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`Found ${records.length} books in CSV file.`);
  console.log('Starting import...');

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  const client = await pool.connect();

  try {
    for (const record of records) {
      if (!record.title || record.title.trim() === '') {
        skipped++;
        continue;
      }

      try {
        const bookResult = await client.query(
          `INSERT INTO books (
             title,
             cover_image_url,
             average_rating,
             ratings_count,
             publication_year,
             goodbooks_id
           )
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (goodbooks_id) DO NOTHING
           RETURNING id`,
          [
            record.title.trim(),
            record.image_url || null,
            parseFloat(record.average_rating) || null,
            parseInt(record.ratings_count) || 0,
            parseInt(record.original_publication_year) || null,
            parseInt(record.book_id) || null,
          ]
        );

        if (bookResult.rows.length === 0) {
          skipped++;
          continue;
        }

        const bookId = bookResult.rows[0].id;

        if (record.authors) {
          const authorNames = record.authors.split(',');

          for (const authorName of authorNames) {
            if (!authorName.trim()) continue;

            const authorId = await upsertAuthor(client, authorName);

            await client.query(
              `INSERT INTO book_authors (book_id, author_id)
               VALUES ($1, $2)
               ON CONFLICT DO NOTHING`,
              [bookId, authorId]
            );
          }
        }

        imported++;

        if (imported % 500 === 0) {
          console.log(`Imported ${imported} books so far...`);
        }

      } catch (recordError) {
        console.error(`Error importing book: ${record.title}`, recordError.message);
        errors++;
      }
    }

  } finally {
    client.release();
  }

  console.log('\n─── Import Complete ───');
  console.log(`Books imported successfully: ${imported}`);
  console.log(`Books skipped (duplicates/invalid): ${skipped}`);
  console.log(`Errors: ${errors}`);

  await pool.end();
}

importBooks().catch(error => {
  console.error('Fatal error during import:', error);
  process.exit(1);
});