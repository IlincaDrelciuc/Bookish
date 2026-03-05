require("dotenv").config();
const { parse } = require("csv-parse/sync");
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Map each genre to keywords that might appear in messy tags
const GENRE_KEYWORDS = {
  1:  { name: 'Fantasy',          keywords: ['fantasy', 'magic', 'wizard', 'witch', 'dragon', 'fae', 'fairy', 'mytholog'] },
  2:  { name: 'Science Fiction',  keywords: ['science-fiction', 'sci-fi', 'scifi', 'space', 'dystopia', 'cyberpunk', 'alien', 'futur'] },
  3:  { name: 'Romance',          keywords: ['romance', 'romantic', 'love-story', 'chick-lit', 'chicklit'] },
  4:  { name: 'Mystery',          keywords: ['mystery', 'mysteries', 'detective', 'whodunit', 'cozy-mystery'] },
  5:  { name: 'Thriller',         keywords: ['thriller', 'suspense', 'psychological-thriller'] },
  6:  { name: 'Historical Fiction',keywords: ['historical-fiction', 'historical', 'history-fiction', 'historical-novel'] },
  7:  { name: 'Literary Fiction', keywords: ['literary-fiction', 'literary', 'literature', 'contemporary-fiction', 'general-fiction'] },
  8:  { name: 'Horror',           keywords: ['horror', 'scary', 'gothic', 'dark', 'paranormal'] },
  9:  { name: 'Young Adult',      keywords: ['young-adult', 'ya', 'teen', 'ya-fiction', 'ya-fantasy', 'ya-romance'] },
  10: { name: 'Non-Fiction',      keywords: ['non-fiction', 'nonfiction', 'true-story', 'narrative-nonfiction'] },
  11: { name: 'Biography',        keywords: ['biography', 'memoir', 'autobiography', 'biographies', 'memoirs'] },
  12: { name: 'Self-Help',        keywords: ['self-help', 'personal-development', 'self-improvement', 'motivational', 'psychology'] },
  13: { name: 'Graphic Novel',    keywords: ['graphic-novel', 'comics', 'manga', 'graphic-novels', 'comic-books'] },
  14: { name: 'Poetry',           keywords: ['poetry', 'poems', 'verse', 'poet'] },
  15: { name: 'Adventure',        keywords: ['adventure', 'action', 'action-adventure', 'quest'] },
  16: { name: 'Dystopia',         keywords: ['dystopia', 'dystopian', 'post-apocalyptic', 'apocalyptic'] },
  17: { name: 'Classics',         keywords: ['classic', 'classics', 'classic-literature', 'required-reading', 'school'] },
  18: { name: 'Crime',            keywords: ['crime', 'noir', 'murder', 'police', 'criminal'] },
  19: { name: 'Short Stories',    keywords: ['short-stories', 'short-story', 'anthology', 'collection'] },
  20: { name: 'Humour',           keywords: ['humor', 'humour', 'funny', 'comedy', 'satire', 'comic'] },
};

function getGenreIdsForTag(tagName) {
  const tag = tagName.toLowerCase().trim();
  const matchedGenreIds = [];
  for (const [genreId, { keywords }] of Object.entries(GENRE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (tag.includes(keyword)) {
        matchedGenreIds.push(parseInt(genreId));
        break;
      }
    }
  }
  return matchedGenreIds;
}

async function importGenres() {
  const tagsPath = path.join(__dirname, '../evaluation/tags.csv');
  const bookTagsPath = path.join(__dirname, '../evaluation/book_tags.csv');

  if (!fs.existsSync(tagsPath) || !fs.existsSync(bookTagsPath)) {
    console.error('ERROR: tags.csv or book_tags.csv not found in evaluation/');
    process.exit(1);
  }

  // Parse tags.csv — build a map of tag_id -> genre_ids
  const tagsContent = fs.readFileSync(tagsPath, 'utf8');
  const tags = parse(tagsContent, { columns: true, skip_empty_lines: true, trim: true });

  console.log(`Found ${tags.length} tags in tags.csv`);

  const tagToGenres = {};
  let mappedTags = 0;
  for (const tag of tags) {
    const genreIds = getGenreIdsForTag(tag.tag_name);
    if (genreIds.length > 0) {
      tagToGenres[tag.tag_id] = genreIds;
      mappedTags++;
    }
  }
  console.log(`Mapped ${mappedTags} tags to genres`);

  // Parse book_tags.csv
  const bookTagsContent = fs.readFileSync(bookTagsPath, 'utf8');
  const bookTags = parse(bookTagsContent, { columns: true, skip_empty_lines: true, trim: true });

  console.log(`Found ${bookTags.length} book-tag entries in book_tags.csv`);

  // Build a map of goodbooks_id -> set of genre_ids
  const bookGenreMap = {};
  for (const bt of bookTags) {
    const goodbooksId = parseInt(bt.goodreads_book_id);
    const tagId = bt.tag_id;
    const genreIds = tagToGenres[tagId];
    if (!genreIds) continue;
    if (!bookGenreMap[goodbooksId]) bookGenreMap[goodbooksId] = new Set();
    for (const genreId of genreIds) {
      bookGenreMap[goodbooksId].add(genreId);
    }
  }

  console.log(`Found genre mappings for ${Object.keys(bookGenreMap).length} books`);
  console.log('Inserting into book_genres table...');

  const client = await pool.connect();
  let inserted = 0;
  let skipped = 0;

  try {
    // Get all books with their goodbooks_id
    const booksResult = await client.query('SELECT id, goodbooks_id FROM books');
    const books = booksResult.rows;

    for (const book of books) {
      const genreIds = bookGenreMap[book.goodbooks_id];
      if (!genreIds || genreIds.size === 0) {
        skipped++;
        continue;
      }
      for (const genreId of genreIds) {
        await client.query(
          `INSERT INTO book_genres (book_id, genre_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [book.id, genreId]
        );
        inserted++;
      }
    }
  } finally {
    client.release();
  }

  console.log('\n─── Genre Import Complete ───');
  console.log(`Entries inserted into book_genres: ${inserted}`);
  console.log(`Books skipped (no matching genres): ${skipped}`);

  await pool.end();
}

importGenres().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});