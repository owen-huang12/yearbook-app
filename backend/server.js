require("dotenv").config();

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const { Pool } = require("pg");

const DB_DATABASE_URL = process.env.DB_DATABASE_URL;
const pool = new Pool({
    connectionString: DB_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

const app = express();
const PORT = 3002;
const SESSION_TTL_MS = Number(process.env.SESSION_TTL_MS || 1000 * 60 * 60 * 8);
const sessions = new Map();
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const AUDIT_LOG = path.join(__dirname, "audit.log");
const sseClients = new Set();

// Parse USERS env var: "alice:pass1,bob:pass2" -> { alice: "pass1", bob: "pass2" }
function parseUsers(usersEnv) {
    const map = {};
    if (!usersEnv) return map;
    for (const entry of usersEnv.split(",")) {
        const colonIdx = entry.indexOf(":");
        if (colonIdx === -1) continue;
        const username = entry.slice(0, colonIdx).trim();
        const password = entry.slice(colonIdx + 1).trim();
        if (username && password) map[username] = password;
    }
    return map;
}

const USERS = parseUsers(process.env.USERS);

function writeAuditLog(entry) {
    const line = `[${new Date().toISOString()}] ${entry}\n`;
    fs.appendFileSync(AUDIT_LOG, line);
}

app.use(cors());
app.use(express.json());

function createSession(username) {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = Date.now() + SESSION_TTL_MS;
    sessions.set(token, { username, expiresAt });
    return { token, expiresAt };
}

function getBearerToken(authHeader = "") {
    if (!authHeader.startsWith("Bearer ")) {
        return null;
    }

    return authHeader.slice(7).trim();
}

function requireAuth(req, res, next) {
    const token = getBearerToken(req.headers.authorization) || req.query.token;

    if (!token || !sessions.has(token)) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const session = sessions.get(token);

    if (session.expiresAt < Date.now()) {
        sessions.delete(token);
        return res.status(401).json({ error: "Session expired" });
    }

    req.user = { username: session.username, token };
    next();
}

function broadcastStudentUpdate(student) {
    const payload = JSON.stringify(student);
    for (const client of setClients) {
        client.write(`data: ${payload}\n\n`);
    }
}

app.post("/api/login", (req, res) => {
    const { username, password } = req.body || {};

    if (!username || !password) {
        return res
            .status(400)
            .json({ error: "Username and password are required" });
    }

    if (!USERS[username] || USERS[username] !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    const session = createSession(username);
    res.json(session);
});

app.post("/api/logout", requireAuth, (req, res) => {
    sessions.delete(req.user.token);
    res.json({ success: true });
});

app.get("/api/get", requireAuth, async (req, res) => {
    try {
        const parsedLimit = Number.parseInt(req.query.limit, 10);
        const parsedOffset = Number.parseInt(req.query.offset, 10);
        const limit = Number.isFinite(parsedLimit)
            ? Math.min(Math.max(parsedLimit, 1), MAX_PAGE_SIZE)
            : DEFAULT_PAGE_SIZE;
        const offset = Number.isFinite(parsedOffset)
            ? Math.max(parsedOffset, 0)
            : 0;

        const [studentsResult, countResult] = await Promise.all([
            pool.query(
                `
                    SELECT student_id, name, is_handed_out, is_purchased
                    FROM allStudents
                    ORDER BY name ASC, student_id ASC
                    LIMIT $1 OFFSET $2
                    `,
                [limit, offset],
            ),
            pool.query(`SELECT COUNT(*)::int AS total FROM allStudents`),
        ]);

        const data = studentsResult.rows.map((row) => ({
            studentID: row.student_id,
            name: row.name,
            status: row.is_handed_out
                ? "claimed"
                : row.is_purchased
                  ? "purchased"
                  : "not purchased",
        }));
        const total = countResult.rows[0]?.total ?? 0;

        res.json({
            data,
            pagination: {
                limit,
                offset,
                total,
                hasMore: offset + data.length < total,
            },
        });
    } catch (error) {
        console.log("Error", error);
        res.status(500).json({ error: "Server Error" });
    }
});

app.get("/api/get/namesearch", requireAuth, async (req, res) => {
    try {
        const search = String(req.query.q || "").trim();

        if (!search) {
            return res.json({ data: [] });
        }

        const result = await pool.query(
            `
                    SELECT student_id, name, is_handed_out, is_purchased
                    FROM allStudents
                    WHERE name ILIKE $1
                    ORDER BY name ASC, student_id ASC
                    `,
            [`%${search}%`],
        );
        const data = result.rows.map((row) => ({
            studentID: row.student_id,
            name: row.name,
            status: row.is_handed_out
                ? "claimed"
                : row.is_purchased
                  ? "purchased"
                  : "not purchased",
        }));

        res.json({ data });
    } catch (error) {
        console.log("Error", error);
        res.status(500).json({ error: "Server Error" });
    }
});

app.get("/api/get/:id", requireAuth, async (req, res) => {
    try {
        const studentId = req.params.id;

        const result = await pool.query(
            `SELECT * FROM allStudents WHERE student_id = $1`,
            [studentId],
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Student not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.log("Error", error);
        res.status(500).json({ error: "Server Error" });
    }
});

app.get("/api/events", requireAuth, (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");

    sseClients.add(res);

    // to keep the sse connection alive so that the platform that we are using does not kill it for the 30 second interval
    const heartbeat = setInterval(() => {
        res.write(": ping\n\n");
    }, 20000);

    req.on("close", () => {
        clearInterval(heartbeat);
        sseClients.delete(res);
    });
});

app.post("/api/edit-status", requireAuth, async (req, res) => {
    try {
        const { studentID, status } = req.body;
        const is_handed_out = status === "claimed";
        const result = await pool.query(
            `UPDATE allStudents SET is_handed_out = $1 WHERE student_id = $2 RETURNING *`,
            [is_handed_out, studentID],
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Student not found" });
        }

        writeAuditLog(
            `${req.user.username} set student ${studentID} (${result.rows[0].name}) to "${status}"`,
        );

        broadcastStudentUpdate({
            studentID: result.rows[0].student_id,
            name: result.rows[0].name,
            status: is_handed_out ? "claimed" : "purchased",
        });

        res.json(result.rows[0]);
    } catch (error) {
        console.log("Error", error);
        res.status(500).json({ error: "Server Error" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
