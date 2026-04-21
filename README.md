# Bookish

A personalised book recommendation and reading companion web application.
Built as a B.Sc. Computer Science bachelor's thesis at the Academy of Economic Studies, Bucharest.

---

## What it does

- Onboarding quiz for cold-start personalisation (genre selection + prior books)
- Book catalogue of 10,000+ books from the Goodbooks-10k dataset
- Google Books API integration for searching and importing recent books
- Quick Picks — SQL-based recommendations using genre overlap and author familiarity scoring
- Handpicked by AI — Gemini LLM recommendations with natural language explanations
- Reading tracker (Want to Read / Currently Reading / Finished) with progress tracking
- Reading statistics dashboard with monthly charts and genre breakdown
- Community reviews and star ratings
- User profiles with reading history and favourite genres
- Account settings (username, password, delete account)
- Similar books suggestions on every book detail page

---

## Tech Stack

- Frontend: React 18, React Router v6
- Backend: Node.js 20, Express
- Database: PostgreSQL 18
- AI: Google Gemini API (gemini-2.5-flash)
- Book data: Goodbooks-10k dataset + Google Books API
- Charts: Recharts

---

## Prerequisites

- Node.js v20 or higher
- PostgreSQL 18
- A Google Gemini API key (free tier at aistudio.google.com)
- A Google Books API key (free at console.cloud.google.com)

---

## Setup

### 1. Clone the repository

git clone https://github.com/YOURUSERNAME/bookish.git
cd bookish

### 2. Set up the database

Open pgAdmin, create a database called bookish, then run:

psql -U postgres -d bookish -f database/schema.sql

### 3. Set up the backend

cd backend
npm install

Create a .env file inside the backend folder:

DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/bookish
JWT_SECRET=your_secret_key_here
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_BOOKS_API_KEY=your_google_books_api_key_here

Import the book data (run once):

node importData.js

Start the server:

node server.js

Backend runs on http://localhost:3001

### 4. Set up the frontend

cd ../frontend
npm install
npm start

Frontend runs on http://localhost:3000

---

## Project Structure

bookish/
├── backend/
│   ├── server.js
│   ├── middleware/auth.js
│   └── routes/
│       ├── auth.js
│       ├── books.js
│       ├── onboarding.js
│       ├── readingList.js
│       ├── recommendations.js
│       └── reviews.js
├── frontend/
│   └── src/
│       ├── components/
│       ├── contexts/
│       ├── pages/
│       └── utils/
├── database/
│   └── schema.sql
├── evaluation/
│   └── evaluate.js
└── docs/
    ├── ai-usage.md
    └── evaluation-summary.md

---

## Offline Evaluation

To compute Hit@10 scores for both recommendation variants:

cd evaluation
node evaluate.js

---

## User Study Results

Mean SUS score: 94.75 (SD = 5.71, range = 85-100)
Classification: Best Imaginable (Bangor et al., 2008)
6/10 participants found Handpicked by AI more personalised than Quick Picks
9/10 participants found AI explanations at least somewhat helpful

---

## Author

Drelciuc Ilinca
Academy of Economic Studies, Bucharest
Bachelor's Thesis, 2026