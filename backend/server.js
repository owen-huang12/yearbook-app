require('dotenv').config();

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const { Pool } = require('pg');

const DB_DATABASE_URL = process.env.DB_DATABASE_URL;
const pool = new Pool({
    connectionString: DB_DATABASE_URL,
})

const app = express();
const PORT = 3002;

const AUTH_USERNAME = process.env.AUTH_USERNAME;
const AUTH_PASSWORD = process.env.AUTH_PASSWORD;
const SESSION_TTL_MS = Number(process.env.SESSION_TTL_MS || 1000 * 60 * 60 * 8);
const sessions = new Map();

app.use(cors());
app.use(express.json());

function createSession(username) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + SESSION_TTL_MS;
  sessions.set(token, { username, expiresAt });
  return { token, expiresAt };
}

function getBearerToken(authHeader = '') {
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.slice(7).trim();
}

function requireAuth(req, res, next) {
  const token = getBearerToken(req.headers.authorization);

  if (!token || !sessions.has(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const session = sessions.get(token);

  if (session.expiresAt < Date.now()) {
    sessions.delete(token);
    return res.status(401).json({ error: 'Session expired' });
  }

  req.user = { username: session.username, token };
  next();
}

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};

  if (!AUTH_USERNAME || !AUTH_PASSWORD) {
    return res.status(500).json({ error: 'Auth is not configured on server' });
  }

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  if (username !== AUTH_USERNAME || password !== AUTH_PASSWORD) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const session = createSession(username);
  res.json(session);
});

app.post('/api/logout', requireAuth, (req, res) => {
  sessions.delete(req.user.token);
  res.json({ success: true });
});

app.get('/api/get', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT student_id, name, is_handed_out, is_purchased FROM allStudents`
        );

        const data = result.rows.map(row => ({
            studentID: row.student_id,
            name: row.name,
            status: row.is_handed_out ? 'claimed' : row.is_purchased ? 'purchased' : 'not purchased',
        }));

        res.json({ data });
    } catch (error) {
        console.log("Error", error);
        res.status(500).json({ error: 'Server Error' });
    }
});

app.get('/api/get/:id', requireAuth, async (req, res) => {
    try{
        const studentId = req.params.id;

        const result = await pool.query(
            `SELECT * FROM allStudents WHERE student_id = $1`,
            [studentId]
        )

        if (result.rows.length === 0){
            return res.status(404).json({error: 'Student not found'})
        }

        res.json(result.rows[0])
    } catch (error) {
        console.log("Error", error);
        res.status(500).json({error: 'Server Error'});
    }
})

app.get('/api/get/namesearch/:name', async (req, res) => {
    try{
        const name = req.params.name;

        const result = await pool.query(
            `SELECT * FROM allStudents WHERE name ILIKE $1`,
            [`%${name}%`]
        )

        if (result.rows.length === 0){
            return res.status(404).json({error: 'No students found'})
        }

        res.json(result.rows)
    } catch (error) {
        console.log("Error", error);
        res.status(500).json({error: 'Server Error'});
    }
})

app.post('/api/edit-status', requireAuth, async (req, res) => {
    try{
        const { studentID, status } = req.body;
        const is_handed_out = status === 'claimed';

        const result = await pool.query(
            `UPDATE allStudents SET is_handed_out = $1 WHERE student_id = $2 RETURNING *`,
            [is_handed_out, studentID]
        )

        if (result.rows.length === 0){
            return res.status(404).json({error: 'Student not found'})
        }

        res.json(result.rows[0])
    } catch (error) {
        console.log("Error", error);
        res.status(500).json({error: 'Server Error'})
    }
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
