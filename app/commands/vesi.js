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
    /vesi
    Log one glass of water. Doesn't affect permilles, shows up in /vedet.
*/
'use strict';

const Commands = require('../lib/commands.js');
const utils = require('../lib/utils.js');
const strings = require('../strings.js');

function vesiCommand(context, msg, words, user) {
    context.end();
    return user.drinkBooze(0, strings.commands.vesi.drink_name)
        .then(() => user.getNonAlcoholicDrinksForHours(24))
        .then((drinks) => context.privateReply(strings.commands.vesi.reply.format({
            response: utils.getRandomFromArray(strings.water_responses),
            count: drinks.length
        })));
}

Commands.register(
    '/vesi',
    strings.commands.vesi.cmd_description,
    Commands.SCOPE_PRIVATE,
    Commands.PRIVILEGE_USER,
    Commands.TYPE_SINGLE,
    vesiCommand
);
