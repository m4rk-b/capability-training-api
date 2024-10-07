import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

router.get('/auction/:id', async (req, res) => {
    const itemID = req.params.id;
    try {
        const itemAuctionQuery = 'SELECT itemid, starttime, endtime FROM auctions WHERE itemid = $1';
        const itemAuctionResult = await db.query(itemAuctionQuery, [itemID]);
        res.send(itemAuctionResult.rows[0]);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.get('/winningbid/:id', async (req, res) => {
    const itemID = req.params.id;
    try {
        const winningBidderQuery = 'SELECT u.userid, u.username, auc.winningbidid, auc.starttime, auc.endtime FROM auctions auc INNER JOIN bids b ON auc.winningbidid = b.bidid INNER JOIN users u ON b.userid = u.userid WHERE auc.itemid = $1';
        const winningBidderResult = await db.query(winningBidderQuery, [itemID]);
        if (winningBidderResult.rows.length=== 0) {
            return res.status(404).json({ username: "None" }); 
        }
        res.send(winningBidderResult.rows[0]);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

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

        // const auctionsQuery = 'SELECT itemid FROM auctions WHERE itemid = $1 FOR UPDATE';
        // const auctionsResult = await db.query(auctionsQuery, [itemid]);
        // const auctions = auctionsResult.rows[0];

        if (parseInt(bidamount) <= parseInt(item.currentbid)) {
            await db.query('ROLLBACK');
            return res.send({error: 'Bid amount must be higher than the current price!' });
        }

        if (parseInt(bidamount) > parseInt(user.points)) {
            await db.query('ROLLBACK');
            return res.send({error: 'Insufficient points to place the bid!' });
        }

        const currentBidderQuery = 'SELECT userid, bidamount FROM bids WHERE itemid = $1 ORDER BY bidtime DESC';
        const currentBidderResult = await db.query(currentBidderQuery, [itemid]);
        const bidder = currentBidderResult.rows[0];

        if (currentBidderResult.rowCount > 0) {
            const returnPointsQuery = 'UPDATE users set points = points + $1 WHERE userid = $2';
            await db.query(returnPointsQuery, [parseInt(bidder.bidamount), bidder.userid]);
        }

        const updateQuery = 'UPDATE items set currentbid = $1, currentbidder = $2, version = version + 1 WHERE itemid = $3 AND version = $4';
        const updateResult = await db.query(updateQuery, [bidamount, userid, itemid, item.version]);

        if (updateResult.rowCount === 0) {
            await db.query('ROLLBACK');
            return res.send({error: 'Bid conflict, try again!' });
        }

        const insertBidQuery = 'INSERT INTO bids (itemid, userid, bidamount) VALUES ($1, $2, $3)';
        await db.query(insertBidQuery, [itemid, userid, bidamount]);

        const deductPointsQuery = 'UPDATE users SET points = points - $1 WHERE userid = $2';
        await db.query(deductPointsQuery, [bidamount, userid]);

        await db.query('COMMIT');

        const bidsQuery = 'SELECT bidid, itemid, bidtime FROM bids WHERE itemid = $1 ORDER BY bidtime DESC';
        const bidsResult = await db.query(bidsQuery, [itemid]);
        const bids = bidsResult.rows[0];

        const updateWinningBidQuery = 'UPDATE auctions SET winningbidid = $1 WHERE itemid = $2';
        await db.query(updateWinningBidQuery, [bids.bidid, itemid])

        res.status(200).json({ message: 'Bid placed successfully! '});
    } catch (err) {
        await db.query('ROLLBACK');
        res.status(400).json({ error: err.message });
    }
});

export default router;