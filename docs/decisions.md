Frontend: React
React is a tool for building the visual side of a website — the buttons, pages, and layouts that users actually see and click on. I chose React because it lets you build a page out of small reusable pieces, which made sense for Bookish since the same book card design appears in the catalogue, the recommendations, and the reading tracker. It is also the most popular frontend tool in the industry right now, which meant I could find answers to almost any problem I ran into.

Backend: Node.js with Express
Node.js lets you run JavaScript not just in the browser but on a server, handling requests and talking to the database. Express is a lightweight layer on top of it that makes setting up API endpoints straightforward. I chose this combination mainly because it meant I could write JavaScript on both the frontend and the backend, so I only had to think in one language throughout the whole project.

Database: PostgreSQL
PostgreSQL is a free, open-source database that has been around for decades and is trusted by large companies worldwide. I chose it because my recommendation algorithm needs to run complex queries that connect books, genres, authors, and user history all at once, and PostgreSQL handles that kind of multi-table query reliably and efficiently.

AI Recommendations: Gemini API
Gemini is Google's large language model, the same kind of technology behind AI chat assistants. I chose it because unlike a mathematical algorithm, it can write a sentence explaining why it thinks you would enjoy a specific book. That ability to explain itself in natural language is what makes it academically interesting to compare against my SQL algorithm, which is faster but gives no explanation at all.

Dataset: Goodbooks-10k
Goodbooks-10k is a publicly available collection of 10,000 books with real community ratings, freely downloadable from Kaggle. I chose it because it is large enough to make the recommendations feel real and varied, it already includes genre and author information which my algorithm depends on, and using a well-known public dataset makes my offline evaluation reproducible by anyone who wants to verify my results.