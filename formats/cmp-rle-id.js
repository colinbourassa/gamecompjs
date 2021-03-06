/*
 * id Software RLE compression algorithm.
 *
 * This algorithm is fully documented on the ModdingWiki:
 *   http://www.shikadi.net/moddingwiki/Keen_1-3_RLE_compression
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

const FORMAT_ID = 'cmp-rle-id';

import { RecordBuffer, RecordType } from '@camoto/record-io-buffer';
import Debug from '../util/debug.js';
const g_debug = Debug.extend(FORMAT_ID);

import { pad_chunked } from './index.js';

export default class Compress_RLE_id
{
	static metadata() {
		return {
			id: FORMAT_ID,
			title: 'id Software RLE compression',
			options: {
				chunkLength: 'Number of bytes in each RLE chunk (RLE codes producing '
					+ '0-15 bytes beyond this point are lost)',
				outputLength: 'Stop revealing when this number of output bytes have '
					+ 'been produced (default read all input data until EOF)',
			},
		};
	}

	static reveal(content, options = {})
	{
		const debug = g_debug.extend('reveal');
		const outputLength = parseInt(options.outputLength) || 0;
		const chunkLength = parseInt(options.chunkLength) || 0xFF00;

		let input = new RecordBuffer(content);
		let output = new RecordBuffer(content.length * 1.2);

		const getByte = input.read.bind(input, RecordType.int.u8);
		const putByte = output.write.bind(output, RecordType.int.u8);

		// This isn't really the segment but rather the number of bytes into the
		// output array where the last segment started, so we can subtract it from
		// the output length to get the offset within the segment.
		let outputSeg = 0;

		while (
			(input.distFromEnd() > 1) // At least two input bytes (RLE code + val)
			/* We can't stop as soon as we fill the output buffer, because we might
			 * be expanding an RLE code that then gets partly overwritten, so we have
			 * to keep going until the end of the input data and then truncate it.
			&& (
				(outputLength === 0) // And no output limit was given
				|| (output.length < outputLength) // Or a limit was given and we are below it
			)*/
		) {
			const v = getByte();
			if (v & 0x80) {
				let lenEscape = (v & 0x7F) + 1;
				if (lenEscape > input.distFromEnd()) {
					debug(`Tried to escape ${lenEscape} bytes, but there are only `
						+ `${input.distFromEnd()} bytes left.`);
					// Just limit to whatever's left.
					lenEscape = input.distFromEnd();
				}
				output.put(input.get(lenEscape));
			} else {
				let repeat = v + 3;
				let n = getByte();
				while (repeat--) putByte(n);
			}

			const outputMemOffset = output.length - outputSeg;
			if (outputMemOffset >= chunkLength) {
				// Move the segment forward by (offset / 16) bytes.
				outputSeg += outputMemOffset & ~0x0F;

				// Move back to last 16-byte block, so the next data overwrites what we
				// just wrote if needed.
				output.seekAbs(outputSeg); // seg outputSeg, offset 0
			}
		}

		// If we read extra data (e.g. from an RLE code that went past the chunk
		// boundary but never got fully overwritten) then crop that off.
		if ((outputLength > 0) && (output.length > outputLength)) {
			output.truncate(outputLength);
		}

		return output.getU8();
	}

	static obscure(content, options = {}) {
		const chunkLength = parseInt(options.chunkLength) || 0xFF00;

		return pad_chunked.obscure(content, {
			length: chunkLength,
			callback: chunk => this.obscureBlock(chunk),
		});
	}

	static obscureBlock(content) {
		const debug = g_debug.extend('obscureBlock');

		let input = new RecordBuffer(content);
		let output = new RecordBuffer(content.length);

		const getByte = input.read.bind(input, RecordType.int.u8);
		const putByte = output.write.bind(output, RecordType.int.u8);

		let prevByte = getByte();

		let pending = 1;
		function flushPending() {
			// This word is different to the last, write out the cached run.
			if (pending > 2) {
				if (diff.length) {
					// Write out the escaped values first.
					flushDiff();
				}
				putByte(pending - 3);
				putByte(prevByte);
			} else {
				// Too short to bother with RLE, just cache it.
				while (pending--) diff.push(prevByte);
			}
			pending = 0;
		}

		let diff = [];
		function flushDiff() {
			// Had different bytes but now have repeated ones.  Write out all the
			// different bytes ready for the repeated ones.
			while (diff.length) {
				let len = Math.min(diff.length, 128);
				putByte(0x80 + len - 1);
				for (let i = 0; i < len; i++) {
					putByte(diff[i]);
				}
				diff = diff.slice(len);
			}
		}

		while (input.distFromEnd() > 0) {
			const v = getByte();
			if (v === prevByte) {
				if (pending === 127+3) {
					flushPending();
				}
				pending++;

			} else { // not the same byte as the last one.
				if (pending) {
					flushPending();
				}
				prevByte = v;
				pending = 1;
			}
		}
		if (pending) {
			flushPending(); // may write to diff
		}
		if (diff.length) {
			flushDiff();
		}

		return output.getU8();
	}
}
