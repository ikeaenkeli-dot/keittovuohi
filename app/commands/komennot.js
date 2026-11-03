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
    /komennot
    Print commands
*/
'use strict';

const Commands = require('../lib/commands.js');
const strings = require('../strings.js');
const utils = require('../lib/utils.js');
const commandMenu = require('../lib/command-menu.js');

// Same command lists and descriptions as Telegram's "/" menu
function commandList() {
    const menus = commandMenu.buildMenus();
    const lines = (list) => list.map((c) => '/' + c.command + ' - ' + c.description).join('\n');
    return strings.commands.blakkis.cmd_list.format({
        cmd_list: utils.escapeMarkdown(lines(menus.private)),
        group_cmd_list: utils.escapeMarkdown(lines(menus.groups))
    });
}


function cmdListCommand(context, msg, words) {
    const cmdStr = commandList();
    return context.privateReply(cmdStr);
}

Commands.register(
    '/komennot',
    strings.commands.komennot.cmd_description,
    Commands.SCOPE_PRIVATE,
    Commands.PRIVILEGE_ALL,
    Commands.TYPE_SINGLE,
    cmdListCommand
);