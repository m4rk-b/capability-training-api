import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import cors from 'cors';
import db from './db/database.js';
import usersRouter from './routes/users.js'
import itemsRouter from './routes/items.js';
import bidsRouter from './routes/bids.js';

dotenv.config();

const app = express();
const port = 10000;

app.use(cors());

app.use(bodyParser.urlencoded({ extended: true }));

app.use(bodyParser.json());

app.use('/items', itemsRouter);

app.use('/users', usersRouter);

app.use('/', bidsRouter);

app.listen(port, () => {
    console.log(`Running on port ${port}.`);
});