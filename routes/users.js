import { Router } from 'express';
import bcrypt from 'bcrypt';
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
            return res.status(404).json({ message: 'User not found!' });
        }
        res.send(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/register', async (req, res) => {
    const { username, passwordhash, fullname } = req.body;
    try {
        const isUserExistQuery = 'SELECT * FROM users WHERE username = $1';
        const isUserExist = await db.query(isUserExistQuery, [username]);
        if(isUserExist.rows.length > 0) {
            return res.status(400).json({ message: 'Username already exist!'});
        }

        const hashedPassword = await bcrypt.hash(passwordhash, 10);

        const query = 'INSERT INTO users (username, passwordhash, fullname) VALUES ($1, $2, $3) RETURNING *';
        const result = await db.query(query, [username, hashedPassword, fullname]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/login', async (req, res) => {
    const { username, passwordhash } = req.body;
    try {
        const query = 'SELECT * FROM users WHERE username = $1';
        const result = await db.query(query, [username]);

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid username or password!'});
        }

        const isMatch = await bcrypt.compare(passwordhash, result.rows[0].passwordhash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid username or password!'});
        }

        res.status(200).json({ id: result.rows[0].userid, message: 'Logged in successfully!' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/update/password', async (req, res) => {
    const { username, oldpasswordhash, newpasswordhash } = req.body;
    try {
        const userQuery = 'SELECT userid, passwordhash FROM users WHERE username = $1';
        const userResult = await db.query(userQuery, [username]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'User does not exist!' });
        }

        const isMatch = await bcrypt.compare(oldpasswordhash, userResult.rows[0].passwordhash);
        
        if (!isMatch) {
            return res.status(404).json({ message: 'Incorrect password.'})
        }
        const newhashedPassword = await bcrypt.hash(newpasswordhash, 10);

        const query = 'UPDATE users SET passwordhash = $1, points = points WHERE userid = $2 RETURNING *';
        const result = await db.query(query, [newhashedPassword, userResult.rows[0].userid]);

        res.status(200).json(result.rows[0])
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.put('/points/update/:id', async(req, res) => {
    const userID = req.params.id;
    const { points } = req.body;
    try {
        const query = 'UPDATE users SET points = $1 WHERE userid = $2 RETURNING *';
        const result = await db.query(query, [points, userID]);
        if(result.rows.length === 0) {
            return res.status(404).json({ message: "User not found!" });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

export default router;