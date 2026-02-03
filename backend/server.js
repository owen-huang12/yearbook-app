require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3002;

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;


app.use(cors());
app.use(express.json());

app.get('/api/get', async (req, res) => {
    try{
        const url = APPS_SCRIPT_URL + '?action=getall';

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type' : 'applications/json'
            }
        })

        const text = await response.text();
        console.log("Response status:", response.status);
        console.log("Response from Google Apps Script:", text);
        const data = JSON.parse(text);

        res.json(data)
    } catch (error) {
        console.log("Error", error);
        res.status(500).json({error: 'Server Error'});
    }
})

app.post('/api/edit-status', async (req, res) => {
    try{
        const response = await fetch(APPS_SCRIPT_URL,  {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body)   
        })

        const text = await response.text();
        console.log("Response status:", response.status);
        console.log("Response from Google Apps Script:", text);

        const data = JSON.parse(text);

        res.json(data)
    } catch (error) {
        console.log("Error", error);
        res.status(500).json({error: 'Server Error'})
    }
})

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT} :))))`)
})