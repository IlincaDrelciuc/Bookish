require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const authenticate = require('./middleware/auth');

const app = express();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Bookish backend is running',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/me', authenticate, async (req, res) => {
  const userId = req.user.userId;
  try {
    const result = await pool.query(
      'SELECT id, email, username, created_at FROM users WHERE id = $1',
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const bookRoutes = require('./routes/books');
app.use('/api/books', bookRoutes);

const onboardingRoutes = require('./routes/onboarding');
app.use('/api/onboarding', onboardingRoutes);

const readingListRoutes = require('./routes/readingList');
app.use('/api/reading-list', readingListRoutes);


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Bookish backend running on http://localhost:${PORT}`);
});