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
    index.js
    Main entrypoint: check config, create database tables, start the
    Telegram bot in polling or webhook mode and load the app.
*/

'use strict';

// Silence deprecation warnings of node-telegram-bot-api 0.x
process.env.NTBA_FIX_319 = '1';
process.env.NTBA_FIX_350 = '1';

const log = require('loglevel');
const syslog = log.getLogger('system');
syslog.setLevel('info');

const TOKEN = process.env.TOKEN;
const BOT_MODE = (process.env.BOT_MODE || 'polling').toLowerCase();

function fail(text) {
    syslog.error('CONFIG ERROR: ' + text);
    process.exit(1);
}

if (!TOKEN) { fail('TOKEN is not set. Get one from @BotFather.'); }
if (!process.env.DATABASE_URL) { fail('DATABASE_URL is not set.'); }
if (!process.env.SECRET) { fail('SECRET is not set. Use a long random string and never change it.'); }
if (BOT_MODE !== 'polling' && BOT_MODE !== 'webhook') { fail('BOT_MODE must be "polling" or "webhook".'); }
if (BOT_MODE === 'webhook' && !process.env.APP_URL) { fail('APP_URL is required in webhook mode.'); }

if (process.env.NEWRELIC === 'true') {
    try {
        global.newrelic = require('newrelic');
    } catch (err) {
        syslog.warn('NEWRELIC=true but the newrelic package is not installed, skipping.');
    }
}

// Since Node 15 an unhandled rejection kills the whole process.
// One failed Telegram call (e.g. user blocked the bot) must not take the bot down.
process.on('unhandledRejection', (err) => {
    syslog.error('Unhandled promise rejection:');
    syslog.error(err);
});

const Bot = require('node-telegram-bot-api');
const settings = require('./app/settings.js');
const migrate = require('./app/db/migrate.js');
const pool = require('./app/db/pool.js');

let bot;
// Optional: point the bot to a local Bot API server (or a test double)
const apiOptions = process.env.TELEGRAM_API_URL ? { baseApiUrl: process.env.TELEGRAM_API_URL } : {};

async function main() {
    await migrate();

    if (BOT_MODE === 'polling') {
        bot = new Bot(TOKEN, Object.assign({ polling: false }, apiOptions));
        // Polling doesn't work while a webhook is set, so clear any old one
        await bot.deleteWebHook();
    } else {
        bot = new Bot(TOKEN, apiOptions);
    }

    const me = await bot.getMe();
    settings.bot_username = me.username.toLowerCase();
    syslog.info('Logged in to Telegram as @' + me.username);

    // Load app (registers message handlers and commands)
    require('./app/init.js')(bot);

    if (BOT_MODE === 'polling') {
        bot.on('polling_error', (err) => syslog.error('Polling error: ' + (err.message || err)));
        await bot.startPolling();
    } else {
        const web = require('./web.js');
        const path = web(bot, TOKEN);
        const appUrl = process.env.APP_URL.replace(/\/+$/, '');
        await bot.setWebHook(appUrl + path);
        syslog.info('Webhook set to ' + appUrl + '/<secret path>');
    }

    syslog.info('BläkkisVuohi started in ' + BOT_MODE + ' mode');
}

async function shutdown(signal) {
    syslog.info('Received ' + signal + ', shutting down');
    try {
        if (bot && bot.isPolling()) {
            await bot.stopPolling();
        }
        await pool.end();
    } finally {
        process.exit(0);
    }
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

main().catch((err) => {
    syslog.error('Startup failed:');
    syslog.error(err);
    process.exit(1);
});
