import pg from 'pg'

export const pool = new pg.Pool({
    user: 'postgres',
    host: 'localhost',
    password: 'Albert1!',
    database: 'teg_pg',
    port: '5432'
});