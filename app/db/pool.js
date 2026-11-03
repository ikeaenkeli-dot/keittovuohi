/*
    Bläkkisvuohi, a Telegram bot to help track estimated blood alcohol concentration.
    Copyright (C) 2017  Joonas Ulmanen

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/*
    pool.js
    Shared PostgreSQL connection pool.
    Set DATABASE_SSL=true for hosted databases that require SSL
    (Heroku, Render, Railway, Supabase, Neon...).

    Serverless databases like Neon shut down when idle and close all
    connections. To survive that:
    - idle connections are closed quickly, so stale ones are rarely reused
    - an error on an idle connection is logged instead of crashing the bot
    - a query that fails because the connection was cut is retried once
      on a fresh connection (waking the database up if needed)
*/

'use strict';

const pg = require('pg');
const log = require('loglevel').getLogger('db');

const useSsl = String(process.env.DATABASE_SSL || '').trim().toLowerCase() === 'true';

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
    max: 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 20000, // Neon can take a few seconds to wake up
    keepAlive: true
});

// Without this listener an error on an idle connection kills the process
pool.on('error', (err) => {
    log.warn('Idle database connection closed: ' + err.message);
});

const RETRYABLE_CODES = ['57P01', '57P02', '57P03', '08000', '08003', '08006', 'ECONNRESET', 'EPIPE', 'ETIMEDOUT', 'ECONNREFUSED'];

function isConnectionError(err) {
    if (!err) {
        return false;
    }
    if (RETRYABLE_CODES.indexOf(err.code) !== -1) {
        return true;
    }
    return /Connection terminated|connection timeout|terminating connection|Client has encountered a connection error|server closed the connection/i.test(err.message || '');
}

function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function query(text, params) {
    return pool.query(text, params).catch((err) => {
        if (!isConnectionError(err)) {
            throw err;
        }
        log.warn('Database connection lost (' + (err.code || err.message) + '), retrying query');
        return wait(1000).then(() => pool.query(text, params));
    });
}

module.exports = {
    query: query,
    end: () => pool.end(),
    on: (event, cb) => pool.on(event, cb),
    _pool: pool,
    _isConnectionError: isConnectionError
};
