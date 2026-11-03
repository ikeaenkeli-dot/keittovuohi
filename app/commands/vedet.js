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
    /vedet
    In a group: list how many alcohol-free drinks each member has logged in 24h
    In private: your own alcohol-free drinks in 24h
*/
'use strict';

const Commands = require('../lib/commands.js');
const groups = require('../db/groups.js');
const strings = require('../strings.js');

const str = strings.commands.vedet;

function pad(n) {
    return ('0' + n).slice(-2);
}

function vedet(context, msg, words, user) {
    context.end();
    if (msg.chat.type === 'private') {
        return user.getNonAlcoholicDrinksForHours(24).then((drinks) => {
            const list = drinks.map((d) => {
                const t = new Date(Date.parse(d.created));
                return pad(t.getHours()) + ':' + pad(t.getMinutes()) + ' ' + d.description;
            });
            return context.privateReply(str.text_private.format({
                count: drinks.length,
                list: list.length ? '\n\n' + list.join('\n') : ''
            }));
        });
    }
    const group = new groups.Group(msg.chat.id);
    return group.getNonAlcoholicCountsByUser(24).then((rows) => {
        if (rows.length === 0) {
            return context.chatReply(str.text_group_empty);
        }
        const list = rows.map((row) => str.text_group_list_item.format({
            username: row.nick,
            count: row.count
        })).join('\n');
        return context.chatReply(str.text_group.format({
            chat_title: msg.chat.title || '',
            list: list
        }));
    });
}

Commands.register(
    '/vedet',
    str.cmd_description,
    Commands.SCOPE_ALL,
    Commands.PRIVILEGE_USER,
    Commands.TYPE_SINGLE,
    vedet
);
