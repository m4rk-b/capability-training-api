import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const query = 'SELECT * FROM items';
        const result = await db.query(query);
        res.send(result.rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/:id', async (req, res) => {
    const itemID = req.params.id;
    try {
        const query = 'SELECT * FROM items WHERE itemid = $1';
        const result = await db.query(query, [itemID]);
        if(result.rows.length === 0) {
            res.status(404).json({ message: "Item does not exist!" });
        }
        res.send(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/add', async (req, res) => {
    const { title, description, startingprice, currentbid } = req.body;
    try {
        const query = 'INSERT INTO items (title, description, startingprice, currentbid) VALUES ($1, $2, $3, $4) RETURNING *';
        const result = await db.query(query, [title, description, startingprice, currentbid]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.put('/update/:id', async (req, res) => {
    const itemID = req.params.id;
    const updates = req.body;

    if(Object.keys(updates).length === 0) {
        res.status(400).json({ message: 'No updates.' });
    }

    try {
        let query = 'UPDATE items SET ';
        let values = [];
        let count = 1;

        for (const [key, value] of Object.entries(updates)) {
            query += `${key} = $${count}, `;
            values.push(value);
            count ++;
        }

        query = query.slice(0, -2) + ` WHERE itemid = $${count} RETURNING *`;
        values.push(itemID);

        const result = await db.query(query, values);

        if(result.rows.length === 0) {
            res.status(404).json({ message: 'Item does not exist!'});
        }

        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;