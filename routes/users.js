import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

router.get('/', async(req, res) => {
    try {
        const query = 'SELECT * FROM users';
        const result = await db.query(query);
        res.send(result.rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/:id', async(req, res) => {
    const userID = req.params.id;
    try {
        const query = 'SELECT * FROM users where userid = $1';
        const result = await db.query(query, [userID]);
        if(result.rows.length === 0) {
            res.status(404).json({ message: 'User not found!' });
        }
        res.send(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/add', async(req, res) => {
    const { username, passwordhash, fullname } = req.body;
    try {
        const query = 'INSERT INTO users (username, passwordhash, fullname) VALUES ($1, $2, $3) RETURNING *';
        const result = await db.query(query, [username, passwordhash, fullname]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.put('/update/:id', async(req, res) => {
    const userID = req.params.id;
    const { points } = req.body;
    try {
        const query = 'UPDATE users SET points = $1 WHERE userid = $2 RETURNING *';
        const result = await db.query(query, [points, userID]);
        if(result.rows.length === 0) {
            res.status(404).json({ message: "User not found!" });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

export default router;