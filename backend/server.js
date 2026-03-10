require('dotenv').config();

const express = require('express');
const cors = require('cors');

const { Pool } = require('pg');

const DB_DATABASE_URL = process.env.DB_DATABASE_URL;

const pool = new Pool({
    connectionString: DB_DATABASE_URL,
})

const app = express();
const PORT = 3002;

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;


app.use(cors());
app.use(express.json());

app.get('/api/get/:id', async (req, res) => {
    try{
        const studentId = req.params.id;

        const result = await pool.query(
            `SELECT * FROM checkIns JOIN allStudents ON checkIns.student_id = allStudents.student_id WHERE checkIns.id = $1`,
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
            `SELECT * FROM checkIns JOIN allStudents ON checkIns.student_id = allStudents.student_id WHERE allStudents.name ILIKE $1`,
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

app.post('/api/edit-status', async (req, res) => {
    try{
        const { student_id, is_handed_out, is_purchased } = req.body;

        const result = await pool.query(
            `UPDATE checkIns SET is_handed_out = $1, is_purchased = $2 WHERE student_id = $3 RETURNING *`,
            [is_handed_out, is_purchased, student_id]
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
    console.log(`Server running on http://localhost:${PORT} :))))`)
})