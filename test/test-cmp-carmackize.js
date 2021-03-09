/*
 * Extra tests for cmp-carmackize.
 *
 * Copyright (C) 2010-2021 Adam Nielsen <malvineous@shikadi.net>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import TestUtil from './util.js';
import { cmp_carmackize as handler } from '../index.js';

const md = handler.metadata();
describe(`Extra tests for ${md.title} [${md.id}]`, function() {

	function run(rev, obs) {
		const b_rev = Uint8Array.from(rev);
		const b_obs = Uint8Array.from(obs);

		it('decodes correctly', function() {
			const contentRevealed = handler.reveal(b_obs);
			TestUtil.buffersEqual(b_rev, contentRevealed);
		});

		it('encodes correctly', function() {
			const contentObscured = handler.obscure(b_rev);
			TestUtil.buffersEqual(b_obs, contentObscured);
		});
	}

	describe('near pointer before EOF', function() {
		run([
			0x78,0x56, 0x34,0x12, 0x78,0x56, 0x34,0x12, 0x00,0x01,
		], [
			0x78,0x56, 0x34,0x12, 0x02,0xA7,0x02, 0x00,0x01,
		]);
	});

	describe('near pointer at EOF', function() {
		run([
			0x78,0x56, 0x34,0x12, 0x78,0x56, 0x34,0x12,
		], [
			0x78,0x56, 0x34,0x12, 0x02,0xA7,0x02,
		]);
	});

	let pad = [];
	for (let i = 1; i < 255; i++) {
		pad.push(i);
		pad.push(0);
	}
	describe('far pointer before EOF', function() {
		run([
			0x78,0x56, 0x34,0x12, ...pad, 0x78,0x56, 0x34,0x12, 0x00,0x01,
		], [
			0x78,0x56, 0x34,0x12, ...pad, 0x02,0xA8,0x00,0x01, 0x00,0x01,
		]);
	});

	describe('far pointer at EOF', function() {
		run([
			0x78,0x56, 0x34,0x12, ...pad, 0x78,0x56, 0x34,0x12,
		], [
			0x78,0x56, 0x34,0x12, ...pad, 0x02,0xA8,0x00,0x01,
		]);
	});

	describe('escape near pointer', function() {
		run([
			0x78,0x56, 0x34,0x12, 0x55,0xA7, 0x00,0x01,
		], [
			0x78,0x56, 0x34,0x12, 0x00,0xA7,0x55, 0x00,0x01,
		]);
	});

	describe('escape near pointer at EOF', function() {
		run([
			0x78,0x56, 0x34,0x12, 0x55,0xA7,
		], [
			0x78,0x56, 0x34,0x12, 0x00,0xA7,0x55,
		]);
	});

	describe('escape far pointer', function() {
		run([
			0x78,0x56, 0x34,0x12, 0x55,0xA8, 0x00,0x01,
		], [
			0x78,0x56, 0x34,0x12, 0x00,0xA8,0x55, 0x00,0x01,
		]);
	});

	describe('escape far pointer at EOF', function() {
		run([
			0x78,0x56, 0x34,0x12, 0x55,0xA8,
		], [
			0x78,0x56, 0x34,0x12, 0x00,0xA8,0x55,
		]);
	});

});
