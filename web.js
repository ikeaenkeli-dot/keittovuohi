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
    web.js
    Web server for webhook mode (Render, Railway, Fly.io, Heroku, own VPS behind HTTPS).
    Also answers GET / so hosting platforms can health check the bot.
*/

'use strict';

const crypto = require('crypto');
const express = require('express');
const packageInfo = require('./package.json');
const log = require('loglevel').getLogger('system');

module.exports = function(bot, token) {
    const app = express();
    app.use(express.json());

    // Don't put the raw bot token into the URL, use a hash of it instead
    const path = '/telegram/' + crypto.createHash('sha256').update(token).digest('hex').slice(0, 32);

    app.get('/', (req, res) => {
        res.json({
            name: 'blakkisvuohi',
            version: packageInfo.version
        });
    });

    // Telegram re-sends an update if it didn't get an answer in time
    // (e.g. while the server was waking up). Remember recent update ids
    // and skip ones that were already handled.
    const seenUpdates = new Set();
    const MAX_SEEN = 2000;

    app.post(path, (req, res) => {
        res.sendStatus(200);
        const update = req.body || {};
        if (update.update_id !== undefined) {
            if (seenUpdates.has(update.update_id)) {
                log.info('Skipped duplicate update ' + update.update_id);
                return;
            }
            seenUpdates.add(update.update_id);
            if (seenUpdates.size > MAX_SEEN) {
                seenUpdates.delete(seenUpdates.values().next().value);
            }
        }
        bot.processUpdate(update);
    });

    const port = process.env.PORT || 3000;
    app.listen(port, '0.0.0.0', () => {
        log.info('Web server listening on port ' + port);
    });

    return path;
};
