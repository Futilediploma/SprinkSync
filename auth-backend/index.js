// Simple Node.js/Express authentication backend with SQLite, bcrypt, and JWT
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();

const app = express();
const PORT = 4000;
const SECRET = process.env.SECRET || 'fallback_secret'; // Use .env SECRET

// Middleware
app.use(cors());
app.use(express.json());

// Procore OAuth2 endpoints
const PROCORE_CLIENT_ID = process.env.dev_PROCORE_CLIENT_ID;
const PROCORE_CLIENT_SECRET = process.env.dev_PROCORE_CLIENT_SECRET;
const PROCORE_REDIRECT_URI = process.env.dev_redirect_uri;
const PROCORE_AUTH_URL = 'https://sandbox.procore.com/oauth/authorize';
const PROCORE_TOKEN_URL = 'https://sandbox.procore.com/oauth/token';

// Step 1: Redirect user to Procore OAuth consent
app.get('/procore/auth', (req, res) => {
  const url = `${PROCORE_AUTH_URL}?response_type=code&client_id=${encodeURIComponent(PROCORE_CLIENT_ID)}&redirect_uri=${encodeURIComponent(PROCORE_REDIRECT_URI)}`;
  res.redirect(url);
});

// Step 2: Handle Procore OAuth callback and exchange code for token
app.get('/procore/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send('Missing code');
  try {
    const response = await axios.post(
      PROCORE_TOKEN_URL,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: PROCORE_CLIENT_ID,
        client_secret: PROCORE_CLIENT_SECRET,
        redirect_uri: PROCORE_REDIRECT_URI,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    // You get access_token, refresh_token, etc.
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to exchange code', details: err.message });
  }
});

// SQLite in-memory DB (use a file for persistence)
const db = new sqlite3.Database(':memory:');
db.serialize(() => {
  db.run('CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT UNIQUE, password TEXT)');
});

// Signup route
app.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const hash = await bcrypt.hash(password, 10);
  db.run('INSERT INTO users (email, password) VALUES (?, ?)', [email, hash], function(err) {
    if (err) return res.status(400).json({ error: 'User already exists' });
    res.json({ id: this.lastID, email });
  });
});

// Login route
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, email: user.email }, SECRET, { expiresIn: '1h' });
    res.json({ token });
  });
});

// Auth middleware for protected routes
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token' });
  const token = auth.split(' ')[1];
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Example protected route
app.get('/profile', authMiddleware, (req, res) => {
  res.json({ message: 'This is a protected profile route', user: req.user });
});

app.listen(PORT, () => console.log(`Auth backend running on port ${PORT}`));
