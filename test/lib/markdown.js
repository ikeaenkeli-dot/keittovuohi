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
    markdown.js
    Nicknames with Markdown characters (e.g. Ville_Pitkanen) must not break messages
*/

/* globals describe, it */

'use strict';

const assert = require('assert');
const utils = require('../../app/lib/utils.js');

function mockBot(failFirstWith) {
    const calls = [];
    const respond = (args) => {
        calls.push(args);
        if (failFirstWith && calls.length === 1) {
            return Promise.reject(new Error(failFirstWith));
        }
        return Promise.resolve();
    };
    return {
        calls: calls,
        sendMessage: (chatId, text, options) => respond({ chatId, text, options }),
        editMessageText: (text, options) => respond({ text, options })
    };
}

describe('markdown safety', function() {
    it('escapeMarkdown should escape _ * ` [', function() {
        assert.equal(utils.escapeMarkdown('Ville_Pitkanen'), 'Ville\\_Pitkanen');
        assert.equal(utils.escapeMarkdown('*a* `b` [c]'), '\\*a\\* \\`b\\` \\[c]');
        assert.equal(utils.escapeMarkdown('Lassi'), 'Lassi');
        assert.equal(utils.escapeMarkdown(undefined), '');
    });

    it('sendMessage should resend as plain text when Telegram cannot parse Markdown', function(done) {
        const bot = mockBot('ETELEGRAM: 400 Bad Request: can\'t parse entities: Can\'t find end of the entity starting at byte offset 46');
        const msg = { from: { id: 1 }, chat: { id: 1 } };
        utils.attachMethods(msg, bot);
        msg.sendMessage(1, 'Moikka Ville_Pitkanen!', { parse_mode: 'Markdown' })
            .then(() => {
                assert.equal(bot.calls.length, 2);
                assert.equal(bot.calls[1].options.parse_mode, undefined);
                assert.equal(bot.calls[1].text, 'Moikka Ville_Pitkanen!');
                done();
            })
            .catch(done);
    });

    it('sendMessage should not retry on other errors', function(done) {
        const bot = mockBot('ETELEGRAM: 403 Forbidden: bot was blocked by the user');
        const msg = { from: { id: 1 }, chat: { id: 1 } };
        utils.attachMethods(msg, bot);
        msg.sendMessage(1, 'hei', { parse_mode: 'Markdown' })
            .then(() => done(new Error('should have failed')))
            .catch(() => {
                assert.equal(bot.calls.length, 1);
                done();
            });
    });

    it('editMessageText should re-edit as plain text when Markdown fails', function(done) {
        const bot = mockBot('ETELEGRAM: 400 Bad Request: can\'t parse entities');
        const msg = { from: { id: 1 }, chat: { id: 1 } };
        utils.attachMethods(msg, bot);
        msg.editMessageText('Nimimerkki: a_b', { parse_mode: 'Markdown', chat_id: 1, message_id: 2 })
            .then(() => {
                assert.equal(bot.calls.length, 2);
                assert.equal(bot.calls[1].options.parse_mode, undefined);
                assert.equal(bot.calls[1].options.message_id, 2);
                done();
            })
            .catch(done);
    });

    it('long messages should be split into several messages at line breaks', function(done) {
        const bot = mockBot();
        const msg = { from: { id: 1 }, chat: { id: 1 } };
        utils.attachMethods(msg, bot);
        const lines = [];
        for (let i = 1; i <= 200; i++) {
            lines.push(i + '. kayttaja_numero_' + i + ': 0,52 ‰ | 12h 3,1 | 24h 4,0');
        }
        const text = lines.join('\n');
        assert(text.length > 4096);
        msg.sendMessage(1, text, { parse_mode: 'Markdown', reply_markup: { remove_keyboard: true } })
            .then(() => {
                assert(bot.calls.length >= 2);
                bot.calls.forEach((c) => assert(c.text.length <= 4096));
                assert.equal(bot.calls.map(c => c.text).join('\n'), text); // nothing lost, rows intact
                assert.equal(bot.calls[0].options.reply_markup, undefined);
                assert(bot.calls[bot.calls.length - 1].options.reply_markup);
                done();
            })
            .catch(done);
    });

    it('splitLongText should keep short texts as one piece and hard-cut huge lines', function() {
        assert.deepEqual(utils.splitLongText('hei'), ['hei']);
        const parts = utils.splitLongText('x'.repeat(9000));
        assert.equal(parts.join(''), 'x'.repeat(9000));
        parts.forEach(p => assert(p.length <= 4000));
    });
});
