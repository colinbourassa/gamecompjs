/*
 * Extra tests for cmp-lzexe.
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

import assert from 'assert';
import TestUtil from './util.js';
import { cmp_lzexe as handler } from '../index.js';

const md = handler.metadata();
let testutil = new TestUtil(md.id);
describe(`Extra tests for ${md.title} [${md.id}]`, function() {
	let content = {};

	before('load test data from local filesystem', function() {

		content = testutil.loadContent(handler, [
			'clear',
			'lzexe90',
			'lzexe91',
			'lzexe91e',
		]);
	});

	describe('reveal()', function() {

		it('works with LZEXE 0.90', function() {
			const contentRevealed = handler.reveal(content['lzexe90'].main);
			TestUtil.buffersEqual(content['clear'].main, contentRevealed);
		});

		it('works with LZEXE 0.91', function() {
			const contentRevealed = handler.reveal(content['lzexe91'].main);
			TestUtil.buffersEqual(content['clear'].main, contentRevealed);
		});

		it('works with LZEXE 0.91e', function() {
			const contentRevealed = handler.reveal(content['lzexe91e'].main);
			TestUtil.buffersEqual(content['clear'].main, contentRevealed);
		});

	}); // reveal()

	describe('identify()', function() {

		it('recognises LZEXE 0.90', function() {
			const result = handler.identify(content['lzexe90'].main);

			assert.equal(result.reason, 'Compressed with LZEXE 0.90.');
			assert.equal(result.valid, true);
		});

		it('recognises LZEXE 0.91', function() {
			const result = handler.identify(content['lzexe91'].main);

			assert.equal(result.reason, 'Compressed with LZEXE 0.91.');
			assert.equal(result.valid, true);
		});

		it('recognises LZEXE 0.91e', function() {
			const result = handler.identify(content['lzexe91e'].main);

			assert.equal(result.reason, 'Compressed with LZEXE 0.91e.');
			assert.equal(result.valid, true);
		});

		it('ignores short files', function() {
			const result = handler.identify(TestUtil.u8FromString('12345678'));

			assert.equal(result.reason, 'File too short.');
			assert.equal(result.valid, false);
		});

	}); // identify()

});
