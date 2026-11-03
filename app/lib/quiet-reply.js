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
    quiet-reply.js
    Answer a group command privately instead of posting to the group,
    so big groups don't fill up with bot messages. Falls back to a group
    message only if the private message can't be sent.
    If the bot is a group admin, the user's command message is removed too.
*/

'use strict';

module.exports = function quietReply(context, msg, privateText, groupText) {
    if (msg.deleteMessage && msg.message_id && msg.chat && msg.chat.type !== 'private') {
        msg.deleteMessage(msg.chat.id, msg.message_id);
    }
    return context.privateReply(privateText)
        .catch(() => context.chatReply(groupText));
};
