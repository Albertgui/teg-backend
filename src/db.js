import pg from 'pg'
import { DB_USER, DB_DATABASE, DB_PASSWORD, DB_PORT, DB_HOST } from './config.js';

export const pool = new pg.Pool({
    user: DB_USER,
    host: DB_HOST,
    password: DB_PASSWORD,
    database: DB_DATABASE,
    port: DB_PORT
});

export const poo2l = new pg.Pool({
    user: 'postgres',
    host: 'localhost',
    password: 'Albert1!',
    database: 'teg_pg',
    port: '5432'
});