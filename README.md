# Library Management System (React + Express, Dark UI)

Two roles:
- **librarian**: add/update/delete books; view all borrow records
- **borrower**: borrow/return books; view own records

Demo accounts are pre-seeded:
- librarian@example.com / librarian123
- borrower@example.com / borrower123

## Quick Start

### 1) Backend
```bash
cd backend
npm install
npm run dev
```
API runs on `http://localhost:5000`.

### 2) Frontend
```bash
cd frontend
npm install
cp .env.example .env   # (optional) edit API URL
npm run dev
```
App opens on `http://localhost:5173`.

## Project Structure
- backend: Express API with JWT auth and JSON-file storage (`db.json`).
- frontend: Vite + React + Tailwind (dark theme).

## Pages
- **Dashboard**: key stats
- **Books**: list books; librarian can add/edit/delete; borrower can borrow
- **Borrow Records**: list of records; mark return

## Notes
- JSON storage is for demo. For production, replace with a real DB (e.g., PostgreSQL, MongoDB).
- JWT expires in 2h; tweak in `server.js`.
