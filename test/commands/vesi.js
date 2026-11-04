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
    vesi.js
    tests for /vesi, /vedet and alcohol-free drinks
*/

/* globals describe, it, beforeEach */

'use strict';
require('../../app/commands/vesi.js');
require('../../app/commands/vedet.js');
require('../../app/commands/kalja05.js');
require('../../app/commands/kalja033.js');
require('../../app/commands/start.js');

const assert = require('assert');
const blakkistest = require('../blakkistest.js');
const Commands = require('../../app/lib/commands.js');
const alcomath = require('../../app/lib/alcomath.js');
const strings = require('../../app/strings.js');

describe('vesi.js & vedet.js', function() {
    beforeEach(blakkistest.resetDbWithTestUsersAndGroupsAndDrinks);

    it('/vesi should log an alcohol-free drink and not change permilles', function(done) {
        const mocked = blakkistest.mockMsgAndBot();
        const user = blakkistest.users[0];
        mocked.msg.from.id = blakkistest.realIds[0];
        let before;

        user.getBooze()
            .then((rows) => {
                before = alcomath.calculateEBACFromDrinks(user, rows);
                return Commands.call('/vesi', mocked.msg, ['/vesi']);
            })
            .then(() => user.getBooze())
            .then((rows) => {
                const water = rows.filter(x => x.description === strings.commands.vesi.drink_name);
                assert.equal(water.length, 1);
                assert.equal(water[0].alcohol, 0);
                const after = alcomath.calculateEBACFromDrinks(user, rows);
                assert(Math.abs(after.permilles - before.permilles) < 0.01);
                assert.notEqual(mocked.internals.sentText.indexOf('1 kpl'), -1);
                done();
            })
            .catch((err) => done(err));
    });

    it('/vedet in a group should list alcohol-free drinks per user', function(done) {
        const mocked = blakkistest.mockMsgAndBot();
        mocked.msg.from.id = blakkistest.realIds[0];

        Commands.call('/vesi', mocked.msg, ['/vesi'])
            .then(() => blakkistest.users[0].drinkBooze(0, '🥤 Limsa'))
            .then(() => Commands.call('/kalja05', mocked.msg, ['/kalja05']))
            .then(() => {
                mocked.msg.chat.id = blakkistest.groups[0].realId;
                mocked.msg.chat.type = 'group';
                return Commands.call('/vedet', mocked.msg, ['/vedet']);
            })
            .then(() => {
                assert.notEqual(mocked.internals.sentText.indexOf(blakkistest.users[0].username + '... 2 kpl'), -1);
                done();
            })
            .catch((err) => done(err));
    });

    it('/vedet in a group with no alcohol-free drinks should say so', function(done) {
        const mocked = blakkistest.mockMsgAndBot();
        mocked.msg.from.id = blakkistest.realIds[0];
        mocked.msg.chat.id = blakkistest.groups[0].realId;
        mocked.msg.chat.type = 'group';
        Commands.call('/vedet', mocked.msg, ['/vedet'])
            .then(() => {
                assert.equal(mocked.internals.sentText, strings.commands.vedet.text_group_empty);
                done();
            })
            .catch((err) => done(err));
    });

    it('/start -> Juo -> Alkoholittomat -> Vesi should log water from the menu', function(done) {
        const mocked = blakkistest.mockMsgAndBot();
        const user = blakkistest.users[0];
        mocked.msg.from.id = blakkistest.realIds[0];
        const press = (button) => {
            mocked.msg.data = '/start ' + button;
            mocked.msg.addMessageObj();
            return Commands.call('', mocked.msg, ['']);
        };
        Commands.call('/start', mocked.msg, ['/start'])
            .then(() => press(strings.commands.start.juo.button_text))
            .then(() => press(strings.commands.start.juo.alkoholittomat.button_text))
            .then(() => {
                assert.notEqual(mocked.internals.editText.indexOf(strings.commands.start.juo.alkoholittomat.on_select), -1);
                return press('💧 Vesi 33cl');
            })
            .then(() => user.getBooze())
            .then((rows) => {
                const water = rows.find(x => x.description === '💧 Vesi 33cl');
                assert(water);
                assert.equal(water.alcohol, 0);
                assert.notEqual(mocked.internals.editText.indexOf('1 kpl'), -1);
                done();
            })
            .catch((err) => done(err));
    });

    it('the same drink tapped many times in a row should be saved only once', function(done) {
        const mocked = blakkistest.mockMsgAndBot();
        const user = blakkistest.users[0];
        mocked.msg.from.id = blakkistest.realIds[0];
        let before;
        user.getBooze()
            .then((rows) => {
                before = rows.length;
                // 4 taps arriving at once, like after the bot wakes up
                return Promise.all([1, 2, 3, 4].map(() => Commands.call('/kalja05', mocked.msg, ['/kalja05'])));
            })
            .then(() => user.getBooze())
            .then((rows) => {
                assert.equal(rows.length, before + 1);
                done();
            })
            .catch((err) => done(err));
    });

    it('different drinks right after each other should both be saved', function(done) {
        const mocked = blakkistest.mockMsgAndBot();
        const user = blakkistest.users[0];
        mocked.msg.from.id = blakkistest.realIds[0];
        let before;
        user.getBooze()
            .then((rows) => {
                before = rows.length;
                return Commands.call('/kalja05', mocked.msg, ['/kalja05']);
            })
            .then(() => Commands.call('/kalja033', mocked.msg, ['/kalja033']))
            .then(() => user.getBooze())
            .then((rows) => {
                assert.equal(rows.length, before + 2);
                done();
            })
            .catch((err) => done(err));
    });

    it('Oma juoma should accept a decimal comma, e.g. 15cl 13,5%', function(done) {
        const mocked = blakkistest.mockMsgAndBot();
        const user = blakkistest.users[0];
        mocked.msg.from.id = blakkistest.realIds[0];
        const press = (button) => {
            mocked.msg.data = '/start ' + button;
            mocked.msg.addMessageObj();
            return Commands.call('', mocked.msg, ['']);
        };
        Commands.call('/start', mocked.msg, ['/start'])
            .then(() => press(strings.commands.start.juo.button_text))
            .then(() => press(strings.commands.start.juo.oma.button_text))
            .then(() => {
                mocked.msg.data = undefined;
                mocked.msg.message = undefined;
                mocked.msg.text = '15cl 13,5%';
                return Commands.call('15cl', mocked.msg, ['15cl', '13,5%']);
            })
            .then(() => user.getBooze())
            .then((rows) => {
                const drink = rows.find(x => x.description === 'Oma juoma 15 cl 13,5 %');
                assert(drink, 'drink saved');
                // 15 cl * 13,5 % * 0,789 g/ml ~ 16 g
                assert(drink.alcohol > 15000 && drink.alcohol < 17000);
                done();
            })
            .catch((err) => done(err));
    });

    it('utils.parseDrinkInput should understand common ways to write a drink', function() {
        const utils = require('../../app/lib/utils.js');
        assert.deepEqual(utils.parseDrinkInput('15cl 13,5%'), { cl: 15, vol: 13.5 });
        assert.deepEqual(utils.parseDrinkInput('15 cl 13.5 %'), { cl: 15, vol: 13.5 });
        assert.deepEqual(utils.parseDrinkInput('0,5l 4,7%'), { cl: 50, vol: 4.7 });
        assert.deepEqual(utils.parseDrinkInput('33 5,1'), { cl: 33, vol: 5.1 });
        assert.equal(utils.parseDrinkInput('33cl'), null);
        assert.equal(utils.parseDrinkInput('kalja'), null);
        assert.equal(utils.parseDrinkInput('33cl 150%'), null);
    });
});
