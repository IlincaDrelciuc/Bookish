Book.csv

Column names:
- id
- book_id
- best_book_id
- work_id
- books_count
- isbn
- isbn13
- authors
- original_publication_year
- original_title
- title
- language_code
- average_rating
- ratings_count
- work_ratings_count
- work_text_reviews_count
- ratings_1
- ratings_2
- ratings_3
- ratings_4
- ratings_5
- image_url
- small_image_url


Q1: How many books are in the dataset?
10000

Q2: Are there any books with a blank title?
There are no books with a blank title.

Q3: What languages are the books in?
The vast majority of books are in english. However, there are also a few books written in romanian, french, spanish, arabic, german, japanese, portugese, norwegian, italian, latin, indonesian, swedish, danish, middle dutch, middle english, scotting gaelic, malay, chinese and dutch

Q4: What is the range of publication years?
The range of publication years is between 1513 and 2017.

Q5: How are multiple authors formatted?
Multiple authors are stored in a single cell separated by a comma.

Q6: Are there duplicate books?
There are duplicate books, appearing in one of the following 2 ways:
- same book, but different editions
- same book, but different languages

Q7: What does the image_url column contain?
The image_url column contains a direct URL to the book cover image hosted on Goodreads' servers.

Q8: What is the range of ratings?
The range of ratings is from 1 to 5.

Q9: What fields are frequently empty/blank?
The most frequently empty fields are isbn, isbn13, original_title, original_publication_year, and language_code.

Ratings.csv

Columns names:
- user_id
- book_id
- rating

Q1: How many total ratings are there?
Approximately 1 million ratings.

Q2: What is the range of the rating values?
The range is from 1 to 5.

Q3: How many unique users gave ratings?
Approximately 53,424 unique users.


API Information

Open Library provides two useful APIs for Bookish, both of which are completely free and require no registration or API key. The Books API returns metadata about a specific book in JSON format when queried by ISBN, including the title, author, publication date, page count and cover image IDs. The Covers API serves the actual cover image directly at a predictable URL, meaning it can be used as the src attribute of an img tag in React without any additional parsing. Both APIs follow a simple URL structure based on the book's ISBN, with the Covers API additionally accepting a size parameter of S, M or L to control the dimensions of the returned image.