require('dotenv').config({ path: '../backend/.env' });
const { Pool } = require('pg');
const { parse } = require('csv-parse/sync');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ||
    'postgresql://postgres:bookish2025@localhost:5432/bookish',
});

async function getVariantA(pool, excludeIds, genreIds) {
  if (genreIds.length === 0) return [];
  const result = await pool.query(
    `SELECT b.id,
     (COUNT(DISTINCT CASE WHEN bg.genre_id = ANY($2::int[]) THEN bg.genre_id END) * 10
      + LOG(GREATEST(b.ratings_count, 1)) * 2
      + b.average_rating * 3
     ) AS score
     FROM books b
     JOIN book_genres bg ON b.id = bg.book_id
     WHERE b.id != ALL($1::int[])
       AND b.id IN (SELECT DISTINCT book_id FROM book_genres WHERE genre_id = ANY($2::int[]))
     GROUP BY b.id
     ORDER BY score DESC
     LIMIT 50`,
    [excludeIds, genreIds]
  );
  return result.rows.map(r => r.id);
}

async function getVariantB(pool, excludeIds, genreIds, authorIds) {
  if (genreIds.length === 0) return [];
  const safeAuthorIds = authorIds.length > 0 ? authorIds : [0];
  const result = await pool.query(
    `SELECT b.id,
     (COUNT(DISTINCT CASE WHEN bg.genre_id = ANY($2::int[]) THEN bg.genre_id END) * 10
      + CASE WHEN EXISTS(
          SELECT 1 FROM book_authors ba
          WHERE ba.book_id = b.id AND ba.author_id = ANY($3::int[])
        ) THEN 20 ELSE 0 END
      + LOG(GREATEST(b.ratings_count, 1)) * 2
      + b.average_rating * 3
     ) AS score
     FROM books b
     JOIN book_genres bg ON b.id = bg.book_id
     WHERE b.id != ALL($1::int[])
       AND b.id IN (SELECT DISTINCT book_id FROM book_genres WHERE genre_id = ANY($2::int[]))
     GROUP BY b.id
     ORDER BY score DESC
     LIMIT 50`,
    [excludeIds, genreIds, safeAuthorIds]
  );
  return result.rows.map(r => r.id);
}

async function runEvaluation() {
  console.log('Loading ratings.csv...');
  const csvPath = path.join(__dirname, 'ratings.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('ERROR: ratings.csv not found');
    process.exit(1);
  }
  const records = parse(fs.readFileSync(csvPath, 'utf8'), {
    columns: true, skip_empty_lines: true, trim: true,
  });
  console.log(`Loaded ${records.length} ratings.`);

  // Check how many books exist with IDs in the ratings range
  const maxBookId = await pool.query('SELECT MAX(id) FROM books');
  console.log(`Max internal book ID in database: ${maxBookId.rows[0].max}`);

  // Build user ratings using internal book ID directly
  // ratings.csv book_id should be 1-10000 matching internal IDs
  const userRatings = {};
  let matched = 0;
  let unmatched = 0;

  for (const r of records) {
    const bookId = parseInt(r.book_id);
    // Only use book IDs that exist in our range
    if (bookId < 1 || bookId > 10000) { unmatched++; continue; }
    matched++;
    const uid = r.user_id;
    if (!userRatings[uid]) userRatings[uid] = [];
    userRatings[uid].push({
      internalId: bookId,
      rating: parseInt(r.rating),
    });
  }

  console.log(`Matched: ${matched} ratings, Unmatched: ${unmatched}`);

  const eligibleUsers = Object.entries(userRatings)
    .filter(([uid, ratings]) => ratings.length >= 5)
    .map(([uid, ratings]) => ({ uid, ratings }));
  console.log(`Found ${eligibleUsers.length} users with 5+ ratings.`);

  const shuffled = eligibleUsers.sort(() => Math.random() - 0.5);
  const testUsers = shuffled.slice(0, 200);
  console.log(`Testing on ${testUsers.length} users...`);
  console.log('This may take 2-5 minutes. Please wait.\n');

  let hitsV1 = 0;
  let hitsV2 = 0;
  let tested = 0;

  for (const { uid, ratings } of testUsers) {
    const highlyRated = ratings.filter(r => r.rating >= 4);
    if (highlyRated.length === 0) continue;

    const hiddenBook = highlyRated[Math.floor(Math.random() * highlyRated.length)];
    const knownBooks = ratings
      .filter(r => r.internalId !== hiddenBook.internalId)
      .map(r => r.internalId);
    if (knownBooks.length === 0) continue;

    const genreResult = await pool.query(
      `SELECT DISTINCT genre_id FROM book_genres WHERE book_id = ANY($1::int[])`,
      [knownBooks]
    );
    const genreIds = genreResult.rows.map(r => r.genre_id);
    if (genreIds.length === 0) continue;

    const authorResult = await pool.query(
      `SELECT DISTINCT author_id FROM book_authors WHERE book_id = ANY($1::int[])`,
      [knownBooks]
    );
    const authorIds = authorResult.rows.map(r => r.author_id);
    const excludeIds = [...knownBooks];

    const v1Results = await getVariantA(pool, excludeIds, genreIds);
    const v2Results = await getVariantB(pool, excludeIds, genreIds, authorIds);

    if (v1Results.includes(hiddenBook.internalId)) hitsV1++;
    if (v2Results.includes(hiddenBook.internalId)) hitsV2++;
    tested++;

    if (tested % 25 === 0) {
      console.log(`Progress: ${tested}/${testUsers.length} users tested`);
      console.log(`  V1 hits so far: ${hitsV1} (${((hitsV1/tested)*100).toFixed(1)}%)`);
      console.log(`  V2 hits so far: ${hitsV2} (${((hitsV2/tested)*100).toFixed(1)}%)\n`);
    }
  }

  console.log('\n════════════════════════════════════════');
  console.log('EVALUATION COMPLETE');
  console.log('════════════════════════════════════════');
  console.log(`Users tested:      ${tested}`);
  console.log(`─────────────────────────────────────`);
  console.log(`Variant A (genre + popularity):`);
  console.log(`  Hits:     ${hitsV1}`);
  console.log(`  Hit@50:   ${tested > 0 ? ((hitsV1/tested)*100).toFixed(2) : '0.00'}%`);
  console.log(`─────────────────────────────────────`);
  console.log(`Variant B (genre + popularity + author bonus):`);
  console.log(`  Hits:     ${hitsV2}`);
  console.log(`  Hit@50:   ${tested > 0 ? ((hitsV2/tested)*100).toFixed(2) : '0.00'}%`);
  console.log(`─────────────────────────────────────`);
  const improvement = hitsV1 > 0 ? (((hitsV2-hitsV1)/hitsV1)*100).toFixed(1) : 'N/A';
  console.log(`Improvement V2 over V1: ${improvement}%`);
  console.log('════════════════════════════════════════');

  await pool.end();
}

runEvaluation().catch(err => {
  console.error('Evaluation failed:', err);
  process.exit(1);
});