const express = require('express');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
require('dotenv').config();
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET || 'donleoncoffee_secret_key';

app.use(cors());
app.use(express.json());

// Ensure assets dir exists
const imagesDir = path.join(__dirname, 'public', 'assets', 'images');
fs.mkdirSync(imagesDir, { recursive: true });

// Auto-admin
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'donleoncoffee@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'DonLeonCoffee1990';
async function ensureAdmin() {
  await new Promise((resolve, reject) => {
    db.get('SELECT id FROM users WHERE email = ?', [ADMIN_EMAIL], async (err, row) => {
      if (err) return reject(err);
      if (row) return resolve();
      try {
        const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
        db.run('INSERT INTO users (email, password, is_admin) VALUES (?, ?, 1)',
          [ADMIN_EMAIL, hashed],
          (err2) => err2 ? reject(err2) : resolve()
        );
      } catch (e) { reject(e); }
    });
  });
}

// Auth middleware
function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'Missing token' });
  try {
    const token = auth.split(' ')[1];
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (e) { res.status(403).json({ message: 'Invalid token' }); }
}

// Multer storage & filter
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, imagesDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBase = path.basename(file.originalname, ext).replace(/[^a-z0-9_-]/gi, '_');
    cb(null, `${Date.now()}_${safeBase}${ext}`);
  }
});
function fileFilter(req, file, cb) {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowed.includes(ext)) return cb(new Error('Only .jpg, .jpeg, .png, .webp allowed'));
  cb(null, true);
}
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

// Auth routes
app.post('/register', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
  try {
    const hashed = await bcrypt.hash(password, 10);
    db.run('INSERT INTO users (email, password, is_admin) VALUES (?, ?, 0)',
      [email, hashed],
      function (err) {
        if (err) return res.status(400).json({ message: 'Error registering', error: err.message });
        res.json({ message: 'Registered', id: this.lastID });
      });
  } catch (_) { res.status(500).json({ message: 'Server error' }); }
});

app.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) return res.status(500).json({ message: 'DB error' });
    if (!user) return res.status(400).json({ message: 'User not found' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Invalid password' });
    const token = jwt.sign({ id: user.id, email: user.email, is_admin: !!user.is_admin }, SECRET, { expiresIn: '2h' });
    res.json({ message: 'Login ok', token });
  });
});

// Products CRUD
app.get('/products', (req, res) => {
  db.all('SELECT * FROM products ORDER BY id DESC', (err, rows) => {
    if (err) return res.status(500).json({ message: 'DB error' });
    res.json(rows);
  });
});

app.post('/products', authenticate, (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ message: 'Admins only' });
  let { title, short_description, image_url, price } = req.body || {};
  if (!title || !image_url) return res.status(400).json({ message: 'Title and image_url required' });
  price = parseFloat(price); if (Number.isNaN(price)) price = 0;
  db.run('INSERT INTO products (title, short_description, image_url, price) VALUES (?, ?, ?, ?)',
    [title, short_description || '', image_url, price],
    function (err) {
      if (err) return res.status(400).json({ message: 'Error adding product', error: err.message });
      res.json({ message: 'Product added', id: this.lastID });
    });
});

app.put('/products/:id', authenticate, (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ message: 'Admins only' });
  const { id } = req.params;
  let { title, short_description, image_url, price } = req.body || {};
  if (!title || !image_url) return res.status(400).json({ message: 'Title and image_url required' });
  price = parseFloat(price); if (Number.isNaN(price)) price = 0;
  db.run('UPDATE products SET title = ?, short_description = ?, image_url = ?, price = ? WHERE id = ?',
    [title, short_description || '', image_url, price, id],
    function (err) {
      if (err) return res.status(400).json({ message: 'Error updating product', error: err.message });
      if (this.changes === 0) return res.status(404).json({ message: 'Product not found' });
      res.json({ message: 'Product updated' });
    });
});

app.delete('/products/:id', authenticate, (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ message: 'Admins only' });
  const { id } = req.params;
  db.run('DELETE FROM products WHERE id = ?', [id], function (err) {
    if (err) return res.status(400).json({ message: 'Error deleting product', error: err.message });
    if (this.changes === 0) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  });
});

// Upload route (admin only)
app.post('/upload', authenticate, upload.single('image'), (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ message: 'Admins only' });
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const relPath = `/assets/images/${req.file.filename}`;
  return res.json({ message: 'Uploaded', path: relPath });
});

// Static
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req,res)=>res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/admin.html', (req,res)=>res.sendFile(path.join(__dirname, 'public', 'admin.html')));

ensureAdmin().then(() => {
  console.log(`Admin ensured: ${ADMIN_EMAIL}`);
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}).catch(err => { console.error('Failed to ensure admin:', err); process.exit(1); });
