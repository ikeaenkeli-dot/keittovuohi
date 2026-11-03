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
    /admin_jasenet
    Admin only. Used in a group: sends the admin a private list of everyone
    who has joined the group with /moro. Nothing is posted to the group.
*/
'use strict';

const Commands = require('../lib/commands.js');
const groups = require('../db/groups.js');
const strings = require('../strings.js');

const str = strings.commands.admin_jasenet;

function pad(n) {
    return ('0' + n).slice(-2);
}

function formatTime(date) {
    if (!date) {
        return str.never;
    }
    // Show in Finnish time regardless of the server's timezone
    const fi = new Date(date.toLocaleString('en-US', { timeZone: 'Europe/Helsinki' }));
    return fi.getDate() + '.' + (fi.getMonth() + 1) + '. ' + pad(fi.getHours()) + ':' + pad(fi.getMinutes());
}

function adminJasenet(context, msg, words, user) {
    context.end();
    if (context.isPrivateChat()) {
        return context.privateReply(str.use_in_group);
    }
    // Keep the group clean: remove the command message if the bot is allowed to
    if (msg.deleteMessage && msg.message_id) {
        msg.deleteMessage(msg.chat.id, msg.message_id);
    }
    const title = msg.chat.title || '';
    const group = new groups.Group(msg.chat.id);
    return group.getMembers().then((members) => {
        if (members.length === 0) {
            return msg.sendMessage(msg.from.id, str.empty.format({ chat_title: title }));
        }
        const lines = members.map((m, i) => str.item.format({
            rank: i + 1,
            username: m.nick,
            drinks24h: m.drinks24h,
            last_drink: formatTime(m.lastDrink)
        }));
        // Plain text on purpose: nicknames may contain _ or *
        return msg.sendMessage(msg.from.id, str.header.format({
            chat_title: title,
            count: members.length
        }) + '\n' + lines.join('\n'));
    });
}

Commands.register(
    '/admin_jasenet',
    str.cmd_description,
    Commands.SCOPE_ALL,
    Commands.PRIVILEGE_ADMIN,
    Commands.TYPE_SINGLE,
    adminJasenet
);
