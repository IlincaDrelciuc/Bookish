Table: users
Purpose: Stores one row for every registered user.

Columns:
id: SERIAL PRIMARY KEY
Auto-incrementing integer. The database assigns this automatically. First user gets 1, second gets 2, etc. Used as a reference point from all other tables.
email: VARCHAR(255) UNIQUE NOT NULL
The user's email address. UNIQUE prevents two accounts with the same email. NOT NULL means it must have a value.
password_hash: VARCHAR(255) NOT NULL
The hashed version of the password, never the real password. Hashed with bcrypt before storage.
username: VARCHAR(100) UNIQUE NOT NULL
The publicly visible display name. UNIQUE because no two users can have the same username.
avatar_url: VARCHAR(500)
Optional link to profile picture. No NOT NULL constraint because users may not set an avatar.
created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
Automatically set to the current date and time when the row is inserted.

Relationships:
Referenced by: ratings.user_id, reviews.user_id, reading_list.user_id, user_preferences.user_id

Design decision:
Passwords are stored as hashes using bcrypt with 12 salt rounds rather than plain text to protect users in the event of a database breach. The bcrypt algorithm is irreversible, meaning the original password cannot be recovered from the hash.

Table: books
Purpose: Stores one row for every book in the catalogue.

Columns:
id: SERIAL PRIMARY KEY
Auto-incrementing integer uniquely identifying each book.
title: TEXT NOT NULL
The book's title. NOT NULL because a book cannot exist in the system without one.
synopsis: TEXT
A description of the book. Nullable because not all books in the dataset have a synopsis available.
cover_image_url: VARCHAR(500)
URL of the book's cover image. Nullable because some books have no image. Falls back to Open Library when the primary URL fails.
publication_year: INTEGER
The year the book was first published. Nullable because some entries in the dataset are missing this information.
average_rating: DECIMAL(3,2)
The book's average community rating, stored as a decimal between 1.00 and 5.00. Nullable because newly added books may have no ratings yet.
ratings_count: INTEGER DEFAULT 0
The total number of ratings the book has received.
page_count: INTEGER
The number of pages in the book. Nullable because this data is not always available in the dataset.
goodbooks_id: INTEGER UNIQUE
The original ID from the Goodbooks-10k dataset. UNIQUE prevents the same book from being imported twice.

Relationships:
Referenced by: book_authors.book_id, book_genres.book_id, reading_list.book_id, ratings.book_id, reviews.book_id

Design decision:
The goodbooks_id column acts as a deduplication guard during import. By enforcing a UNIQUE constraint on this column, any attempt to insert the same book twice will fail at the database level, making the import script safe to run multiple times without creating duplicates.

Table: authors
Purpose: Stores one row per unique author.

Columns:
id: SERIAL PRIMARY KEY
Auto-incrementing integer uniquely identifying each author.
name: VARCHAR(255) UNIQUE NOT NULL
The author's full name. UNIQUE because each author appears only once. NOT NULL because an author entry cannot exist without a name.

Relationships:
Referenced by: book_authors.author_id

Design decision:
Authors are stored in a separate table rather than as a text column in books because one book can have multiple authors and one author can write multiple books. This many-to-many relationship requires a junction table and cannot be handled cleanly with a single text field.

Table: book_authors
Purpose: Junction table connecting books to their authors. Stores one row per book-author pair.

Columns:
book_id: INTEGER REFERENCES books(id) ON DELETE CASCADE
Foreign key pointing to the book. ON DELETE CASCADE means if a book is deleted, its author links are deleted too.
author_id: INTEGER REFERENCES authors(id) ON DELETE CASCADE
Foreign key pointing to the author.

Constraints:
PRIMARY KEY (book_id, author_id): The combination of both columns must be unique, preventing the same author from being linked to the same book twice.

Relationships:
book_id references books.id
author_id references authors.id

Design decision:
This table has no extra columns because the relationship itself is all that needs to be stored. The composite primary key enforces data integrity without needing a separate id column.

Table: genres
Purpose: Stores one row per unique genre.

Columns:
id: SERIAL PRIMARY KEY
Auto-incrementing integer uniquely identifying each genre.
name: VARCHAR(100) UNIQUE NOT NULL
The genre name, for example Fantasy or Classic. UNIQUE because each genre appears only once. NOT NULL because a genre entry cannot exist without a name.

Relationships:
Referenced by: book_genres.genre_id, user_preferences.favourite_genre_ids

Design decision:
Genres are stored in a separate table for the same reason as authors: the many-to-many relationship between books and genres cannot be represented cleanly as a text column. Storing genres as structured rows also allows the recommendation algorithm to match genre IDs efficiently using integer comparisons rather than text matching.

Table: book_genres
Purpose: Junction table connecting books to their genres. Stores one row per book-genre pair.

Columns:
book_id: INTEGER REFERENCES books(id) ON DELETE CASCADE
Foreign key pointing to the book.
genre_id: INTEGER REFERENCES genres(id) ON DELETE CASCADE
Foreign key pointing to the genre.

Constraints:
PRIMARY KEY (book_id, genre_id): The combination must be unique, preventing the same genre from being linked to the same book twice.

Relationships:
book_id references books.id
genre_id references genres.id

Design decision:
This table is central to the recommendation algorithm. When calculating genre overlap scores, the algorithm queries this table to find which genres a candidate book belongs to and compares them against the genres of the user's finished books.

Table: reading_list
Purpose: Tracks every book a user has added to their list and its current reading status.

Columns:
id: SERIAL PRIMARY KEY
Auto-incrementing integer uniquely identifying each reading list entry.
user_id: INTEGER REFERENCES users(id) ON DELETE CASCADE
Foreign key pointing to the user who added the book.
book_id: INTEGER REFERENCES books(id) ON DELETE CASCADE
Foreign key pointing to the book that was added.
status: TEXT CHECK (status IN ('to-read', 'reading', 'finished'))
The current reading status. The CHECK constraint ensures only these three values are accepted.
start_date: DATE
The date the user started reading. Set automatically by the backend when status changes to reading. Nullable because it only applies once reading has begun.
finish_date: DATE
The date the user finished reading. Set automatically when status changes to finished. Nullable for the same reason.
current_page: INTEGER
The page the user is currently on. Updated manually by the user. Nullable because it only applies to books being actively read.
added_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
The date and time the book was first added to the list.

Constraints:
UNIQUE (user_id, book_id): Each user can only have one entry per book. Status changes update the existing row rather than creating a new one.

Relationships:
user_id references users.id
book_id references books.id

Design decision:
The UNIQUE constraint on user_id and book_id is important for data integrity. Without it, a user could accidentally have three rows for the same book with three different statuses, making it unclear which one is current. With this constraint, status changes are always handled as updates to a single row using the SQL ON CONFLICT clause.

Table: ratings
Purpose: Stores star ratings given by users to books.

Columns:
id: SERIAL PRIMARY KEY
Auto-incrementing integer uniquely identifying each rating.
user_id: INTEGER REFERENCES users(id) ON DELETE CASCADE
Foreign key pointing to the user who gave the rating.
book_id: INTEGER REFERENCES books(id) ON DELETE CASCADE
Foreign key pointing to the book that was rated.
score: INTEGER CHECK (score >= 1 AND score <= 5)
The rating value. The CHECK constraint enforces the 1 to 5 scale.
created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
The date and time the rating was submitted.

Constraints:
UNIQUE (user_id, book_id): Each user can only rate each book once, though they can update their existing rating.

Relationships:
user_id references users.id
book_id references books.id

Design decision:
Ratings are stored in a separate table from reviews because a user may want to give a star rating without writing a review, or write a review without giving a star rating. Keeping them separate allows both to be optional and independent.

Table: reviews
Purpose: Stores written reviews left by users on books.

Columns:
id: SERIAL PRIMARY KEY
Auto-incrementing integer uniquely identifying each review.
user_id: INTEGER REFERENCES users(id) ON DELETE CASCADE
Foreign key pointing to the user who wrote the review.
book_id: INTEGER REFERENCES books(id) ON DELETE CASCADE
Foreign key pointing to the book being reviewed.
body: TEXT NOT NULL
The full text of the review. NOT NULL because a review cannot exist without content.
created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
The date and time the review was first written.
updated_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
The date and time the review was last edited. Updated by the backend whenever the review content changes.

Relationships:
user_id references users.id
book_id references books.id

Design decision:
The updated_at column allows the application to display whether a review has been edited since it was first posted, which adds transparency for other users reading the review.

Table: user_preferences
Purpose: Stores the results of the onboarding quiz completed by each user when they first sign up.

Columns:
id: SERIAL PRIMARY KEY
Auto-incrementing integer uniquely identifying each preferences row.
user_id: INTEGER REFERENCES users(id) ON DELETE CASCADE
Foreign key pointing to the user these preferences belong to.
favourite_genre_ids: INTEGER[]
An array of integers storing the genre IDs selected by the user during onboarding. Used by the recommendation algorithm as a cold-start fallback when the user has no reading history yet.
onboarding_completed: BOOLEAN DEFAULT FALSE
Records whether the user has finished the onboarding quiz. The backend checks this on login to decide whether to redirect the user to the onboarding page or directly to the home feed.
created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
The date and time the preferences row was first created.

Relationships:
user_id references users.id

Design decision:
Storing favourite_genre_ids as a PostgreSQL integer array rather than a separate junction table keeps the onboarding data simple and fast to query. Since this data is only used as a fallback and is replaced by real reading history as soon as the user finishes books, the simplicity of an array column outweighs the normalisation benefits of a separate table.


books.title — when a user types in the search bar, PostgreSQL searches the title column. Without an index it scans all 10,000 book titles every time someone types a letter.
books.average_rating — when sorting books by rating (highest first), PostgreSQL needs to compare ratings across all 10,000 books. An index makes this instant.
ratings.user_id and ratings.book_id — your Hit@10 evaluation script queries the ratings table millions of times. Without indexes on these columns it would take hours instead of minutes.
reading_list.user_id — every time a user opens their My Books page, the app fetches all their books by user_id. An index makes this lookup instant regardless of how many total entries the table has.