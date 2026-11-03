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
    admin_jasenet.js
    tests for /admin_jasenet
*/

/* globals describe, it, beforeEach */

'use strict';
require('../../app/commands/admin_jasenet.js');
require('../../app/commands/promillet.js');

const assert = require('assert');
const blakkistest = require('../blakkistest.js');
const Commands = require('../../app/lib/commands.js');
const settings = require('../../app/settings.js');
const strings = require('../../app/strings.js');

describe('admin_jasenet.js', function() {
    beforeEach(blakkistest.resetDbWithTestUsersAndGroupsAndDrinks);

    it('admin should get all group members privately', function(done) {
        const mocked = blakkistest.mockMsgAndBot();
        mocked.msg.from.id = settings.admin_id;
        mocked.msg.chat.type = 'group';
        mocked.msg.chat.id = blakkistest.groups[0].realId;
        Commands.call('/admin_jasenet', mocked.msg, ['/admin_jasenet'])
            .then(() => {
                const text = mocked.internals.sentText;
                assert.equal(mocked.internals.sentChatId, settings.admin_id); // private, not to the group
                assert.notEqual(text.indexOf('liittyneet (' + blakkistest.users.length + ')'), -1);
                blakkistest.users.forEach(u => assert.notEqual(text.indexOf(u.username + ' |'), -1));
                assert.notEqual(text.indexOf(strings.commands.admin_jasenet.never), -1); // members without drinks
                done();
            })
            .catch(done);
    });

    it('non-admin should not get the member list', function(done) {
        const mocked = blakkistest.mockMsgAndBot();
        mocked.msg.from.id = blakkistest.realIds[1];
        mocked.msg.chat.type = 'group';
        mocked.msg.chat.id = blakkistest.groups[0].realId;
        Commands.call('/admin_jasenet', mocked.msg, ['/admin_jasenet'])
            .then(() => {
                assert.equal(mocked.internals.sentText, strings.commands.blakkis.unauthorized);
                done();
            })
            .catch(done);
    });

    it('/promillet in a group should tell how many members are shown out of all', function(done) {
        const mocked = blakkistest.mockMsgAndBot();
        mocked.msg.from.id = blakkistest.realIds[0];
        mocked.msg.chat.type = 'group';
        mocked.msg.chat.id = blakkistest.groups[0].realId;
        Commands.call('/promillet', mocked.msg, ['/promillet'])
            .then(() => {
                assert.notEqual(mocked.internals.sentText.indexOf('(2/' + blakkistest.users.length + ' liittyneestä)'), -1);
                done();
            })
            .catch(done);
    });
});
