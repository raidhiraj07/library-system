import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));


// Fix __dirname for Windows (removes leading slash if present)
let __dirname = path.dirname(new URL(import.meta.url).pathname);
if (process.platform === 'win32' && __dirname.startsWith('/')) {
  __dirname = __dirname.slice(1);
}
const DATA_FILE = path.join(__dirname, 'db.json');

// --- Simple JSON "DB" helpers ---
function readDB() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')); }
  catch (e) { return { users: [], books: [], borrows: [] }; }
}
function writeDB(db) { fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2)); }

// Initialize with a default librarian and borrower if empty
(function initDB() {
  const db = readDB();
  if (!db.users || db.users.length === 0) {
    const librarianPass = bcrypt.hashSync('librarian123', 10);
    const borrowerPass = bcrypt.hashSync('borrower123', 10);
    db.users = [
      { id: uuidv4(), name: 'Libby Librarian', email: 'librarian@example.com', role: 'librarian', password: librarianPass },
      { id: uuidv4(), name: 'Bora Borrower', email: 'borrower@example.com', role: 'borrower', password: borrowerPass },
    ];
  }
  if (!db.books) db.books = [];
  if (!db.borrows) db.borrows = [];
  writeDB(db);
})();

// --- Auth helpers ---
function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
function requireRole(role) {
  return (req, res, next) => {
    if (req.user?.role !== role) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

// --- Routes ---

// Auth
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const db = readDB();
  const user = db.users.find(u => u.email === email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = bcrypt.compareSync(password, user.password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, name: user.name, role: user.role, email: user.email }, process.env.JWT_SECRET, { expiresIn: '2h' });
  res.json({ token, user: { id: user.id, name: user.name, role: user.role, email: user.email } });
});

// Stats
app.get('/api/stats', authRequired, (req, res) => {
  const db = readDB();
  const totalBooks = db.books.length;
  const availableCount = db.books.reduce((sum,b)=> sum + (b.copiesAvailable || 0), 0);
  const borrowedCount = db.borrows.filter(b => !b.returnedAt).length;
  const myBorrowed = db.borrows.filter(b => b.userId === req.user.id && !b.returnedAt).length;
  res.json({ totalBooks, availableCount, borrowedCount, myBorrowed });
});

// Books (public read, write restricted to librarian)
app.get('/api/books', authRequired, (req, res) => {
  const db = readDB();
  res.json(db.books);
});
app.post('/api/books', authRequired, requireRole('librarian'), (req, res) => {
  const { title, author, isbn, description, copies } = req.body;
  if (!title || !author) return res.status(400).json({ error: 'title and author required' });
  const db = readDB();
  const book = {
    id: uuidv4(),
    title, author, isbn: isbn || '', description: description || '',
    copiesTotal: Number(copies || 1),
    copiesAvailable: Number(copies || 1),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  db.books.push(book);
  writeDB(db);
  res.status(201).json(book);
});
app.put('/api/books/:id', authRequired, requireRole('librarian'), (req, res) => {
  const db = readDB();
  const idx = db.books.findIndex(b => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const before = db.books[idx];
  const updates = req.body;
  // Adjust available counts if copiesTotal changed
  if (typeof updates.copiesTotal !== 'undefined') {
    const delta = Number(updates.copiesTotal) - Number(before.copiesTotal);
    db.books[idx].copiesTotal = Number(updates.copiesTotal);
    db.books[idx].copiesAvailable = Math.max(0, Number(before.copiesAvailable) + delta);
  }
  ['title','author','isbn','description'].forEach(k => {
    if (typeof updates[k] !== 'undefined') db.books[idx][k] = updates[k];
  });
  db.books[idx].updatedAt = new Date().toISOString();
  writeDB(db);
  res.json(db.books[idx]);
});
app.delete('/api/books/:id', authRequired, requireRole('librarian'), (req, res) => {
  const db = readDB();
  const idx = db.books.findIndex(b => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const inActiveBorrows = readDB().borrows.some(r => r.bookId === req.params.id && !r.returnedAt);
  if (inActiveBorrows) return res.status(400).json({ error: 'Book has active borrow records' });
  const removed = db.books.splice(idx,1)[0];
  writeDB(db);
  res.json(removed);
});

// Borrow actions
app.get('/api/borrows', authRequired, (req, res) => {
  const db = readDB();
  const isLibrarian = req.user.role === 'librarian';
  const records = isLibrarian ? db.borrows : db.borrows.filter(b => b.userId === req.user.id);
  // enrich with book title & user email
  const enrich = records.map(r => ({
    ...r,
    book: db.books.find(b => b.id === r.bookId) || null,
    user: db.users.find(u => u.id === r.userId)?.email || null,
  }));
  res.json(enrich);
});
app.post('/api/borrow/:bookId', authRequired, (req, res) => {
  const db = readDB();
  const book = db.books.find(b => b.id === req.params.bookId);
  if (!book) return res.status(404).json({ error: 'Book not found' });
  if (book.copiesAvailable <= 0) return res.status(400).json({ error: 'No copies available' });
  const record = {
    id: uuidv4(),
    bookId: book.id,
    userId: req.user.id,
    borrowedAt: new Date().toISOString(),
    dueAt: new Date(Date.now() + 14*24*60*60*1000).toISOString(),
    returnedAt: null
  };
  book.copiesAvailable -= 1;
  db.borrows.push(record);
  writeDB(db);
  res.status(201).json(record);
});
app.post('/api/return/:recordId', authRequired, (req, res) => {
  const db = readDB();
  const rec = db.borrows.find(b => b.id === req.params.recordId);
  if (!rec) return res.status(404).json({ error: 'Record not found' });
  const isOwner = rec.userId === req.user.id;
  const isLibrarian = req.user.role === 'librarian';
  if (!isOwner && !isLibrarian) return res.status(403).json({ error: 'Forbidden' });
  if (rec.returnedAt) return res.status(400).json({ error: 'Already returned' });
  rec.returnedAt = new Date().toISOString();
  const book = db.books.find(b => b.id === rec.bookId);
  if (book) book.copiesAvailable += 1;
  writeDB(db);
  res.json(rec);
});

app.get('/', (req, res) => res.send('Library API is running'));
const port = process.env.PORT || 5000;
app.listen(port, () => console.log('API listening on port ' + port));
