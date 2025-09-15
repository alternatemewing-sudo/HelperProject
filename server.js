// Math-solver potato redirector
// All mentions of 'proxy' are replaced by 'potato'

const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const morgan = require('morgan');

const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'db.json');

const app = express();
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Simple JSON "DB" helper (for demo). It stores { tokens: { token: url, ... } }
function readDB() {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return { tokens: {} };
  }
}
function writeDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}

// create DB file if missing
if (!fs.existsSync(DB_FILE)) {
  writeDB({ tokens: {} });
}

// Helper: make an opaque token (8 hex chars)
function makeToken() {
  return crypto.randomBytes(4).toString('hex'); // e.g. "3cc39v72"-like (hex)
}

// API: create a potato token for a URL
// POST /api/potato  body: { url: "https://example.com" }
app.post('/api/potato', (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'url required' });
  }

  // Basic URL validation — require http or https
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return res.status(400).json({ error: 'only http(s) URLs allowed' });
    }
  } catch (e) {
    return res.status(400).json({ error: 'invalid url' });
  }

  const db = readDB();

  // Make unique token
  let token;
  do {
    token = makeToken();
  } while (db.tokens[token]);

  db.tokens[token] = { url, created: Date.now() };
  writeDB(db);

  // Return the public potato link
  const publicUrl = `${req.protocol}://${req.get('host')}/potato/${token}`;
  return res.json({ token, link: publicUrl });
});

// Redirect route: /potato/:token  -->  performs HTTP redirect to the stored URL
app.get('/potato/:token', (req, res) => {
  const token = req.params.token;
  const db = readDB();
  const entry = db.tokens[token];
  if (!entry) {
    return res.status(404).send('<h1>404</h1><p>Unknown potato token.</p>');
  }

  // Log and redirect (temporary redirect)
  console.log(`potato redirect: ${token} -> ${entry.url}`);
  return res.redirect(entry.url);
});

// Simple health and info
app.get('/api/info', (req, res) => {
  const db = readDB();
  res.json({ app: 'Math-solver potato redirector', tokensCount: Object.keys(db.tokens).length });
});

// All other routes: serve index.html (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Math-solver potato app listening on http://localhost:${PORT}`);
});
