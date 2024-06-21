import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const db = new pg.Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: true,
});

db.connect()
    .then(() => console.log('Connected to PostgreSQL database.'))
    .catch(err => {
        console.error('Error connecting to PostgreSQL database: ', err.message);
        process.exit(1);
    });

export default db;