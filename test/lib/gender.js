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
    gender.js
    Tests for the "En halua kertoa" gender option
*/

'use strict';

const assert = require('assert');
const utils = require('../../app/lib/utils.js');
const alcomath = require('../../app/lib/alcomath.js');

describe('gender', function() {
    describe('utils.parseGender()', function() {
        it('should recognise buttons and typed answers in any case', function() {
            assert.equal(utils.parseGender('Mies'), 'mies');
            assert.equal(utils.parseGender(' nainen '), 'nainen');
            assert.equal(utils.parseGender('En halua kertoa'), 'ei kerrottu');
            assert.equal(utils.parseGender('EN HALUA KERTOA'), 'ei kerrottu');
            assert.equal(utils.parseGender('ei kerrottu'), 'ei kerrottu');
        });
        it('should return null for unknown answers', function() {
            assert.equal(utils.parseGender('75'), null);
            assert.equal(utils.parseGender(''), null);
            assert.equal(utils.parseGender(undefined), null);
        });
    });

    describe('alcomath.getWidmarkFactorForUser()', function() {
        const base = { weight: 80, height: 1.8 };
        const male = alcomath.getWidmarkFactorForUser(Object.assign({ gender: 'mies' }, base));
        const female = alcomath.getWidmarkFactorForUser(Object.assign({ gender: 'nainen' }, base));
        it('should treat capitalised "Mies" as male', function() {
            assert.equal(alcomath.getWidmarkFactorForUser(Object.assign({ gender: 'Mies' }, base)), male);
        });
        it('should use the average when gender was not given', function() {
            const other = alcomath.getWidmarkFactorForUser(Object.assign({ gender: 'ei kerrottu' }, base));
            assert(Math.abs(other - (male + female) / 2) < 1e-9);
            assert(other !== male && other !== female);
        });
    });
});
