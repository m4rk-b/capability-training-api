import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

router.post('/bid', async (req, res) => {
    const { userid, itemid,  bidamount } = req.body;
    try {
        await db.query('BEGIN');
    
        const itemQuery = 'SELECT version, currentbid FROM items WHERE itemid = $1 FOR UPDATE';
        const itemResult = await db.query(itemQuery, [itemid]);
        const item = itemResult.rows[0];

        const userQuery = 'SELECT points FROM users WHERE userid = $1 FOR UPDATE';
        const userResult = await db.query(userQuery, [userid]);
        const user = userResult.rows[0];

        if (parseInt(bidamount) <= parseInt(item.currentbid)) {
            await db.query('ROLLBACK');
            return res.send({error: 'Bid amount must be higher than the current price!' });
        }

        if (parseInt(bidamount) > parseInt(user.points)) {
            await db.query('ROLLBACK');
            return res.send({ error: 'Insufficient points to place the bid!' });
        }

        const updateQuery = 'UPDATE items set currentbid = $1, currentbidder = $2, version = version + 1 WHERE itemid = $3 AND version = $4';
        const updateResult = await db.query(updateQuery, [bidamount, userid, itemid, item.version]);

        if (updateResult.rowCount === 0) {
            await db.query('ROLLBACK');
            return res.send({ error: 'Bid conflict, try again!' });
        }

        const insertBidQuery = 'INSERT INTO bids (itemid, userid, bidamount) VALUES ($1, $2, $3)';
        await db.query(insertBidQuery, [itemid, userid, bidamount]);

        const deductPointsQuery = 'UPDATE users SET points = points - $1 WHERE userid = $2';
        await db.query(deductPointsQuery, [bidamount, userid]);

        await db.query('COMMIT');

        res.status(200).json({ message: 'Bid placed successfully! '});
    } catch (err) {
        await db.query('ROLLBACK');
        res.status(400).json({ error: err.message });
    }
});

export default router;