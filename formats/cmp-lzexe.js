/*
 * LZEXE .exe compression algorithm.
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

const FORMAT_ID = 'cmp-lzexe';

import { RecordBuffer, RecordType } from '@camoto/record-io-buffer';
import Debug from '../util/debug.js';
const g_debug = Debug.extend(FORMAT_ID);

const sig90 = [
	0x06, 0x0E, 0x1F, 0x8B, 0x0E, 0x0C, 0x00, 0x8B,
	0xF1, 0x4E, 0x89, 0xF7, 0x8C, 0xDB, 0x03, 0x1E,
	0x0A, 0x00, 0x8E, 0xC3, 0xB4, 0x00, 0x31, 0xED,
	0xFD, 0xAC, 0x01, 0xC5, 0xAA, 0xE2, 0xFA, 0x8B,
	0x16, 0x0E, 0x00, 0x8A, 0xC2, 0x29, 0xC5, 0x8A,
	0xC6, 0x29, 0xC5, 0x39, 0xD5, 0x74, 0x0C, 0xBA,
	0x91, 0x01, 0xB4, 0x09, 0xCD, 0x21, 0xB8, 0xFF,
	0x4C, 0xCD, 0x21, 0x53, 0xB8, 0x53, 0x00, 0x50,
	0xCB, 0x2E, 0x8B, 0x2E, 0x08, 0x00, 0x8C, 0xDA,
	0x89, 0xE8, 0x3D, 0x00, 0x10, 0x76, 0x03, 0xB8,
	0x00, 0x10, 0x29, 0xC5, 0x29, 0xC2, 0x29, 0xC3,
	0x8E, 0xDA, 0x8E, 0xC3, 0xB1, 0x03, 0xD3, 0xE0,
	0x89, 0xC1, 0xD1, 0xE0, 0x48, 0x48, 0x8B, 0xF0,
	0x8B, 0xF8, 0xF3, 0xA5, 0x09, 0xED, 0x75, 0xD8,
	0xFC, 0x8E, 0xC2, 0x8E, 0xDB, 0x31, 0xF6, 0x31,
	0xFF, 0xBA, 0x10, 0x00, 0xAD, 0x89, 0xC5, 0xD1,
	0xED, 0x4A, 0x75, 0x05, 0xAD, 0x89, 0xC5, 0xB2,
	0x10, 0x73, 0x03, 0xA4, 0xEB, 0xF1, 0x31, 0xC9,
	0xD1, 0xED, 0x4A, 0x75, 0x05, 0xAD, 0x89, 0xC5,
	0xB2, 0x10, 0x72, 0x22, 0xD1, 0xED, 0x4A, 0x75,
	0x05, 0xAD, 0x89, 0xC5, 0xB2, 0x10, 0xD1, 0xD1,
	0xD1, 0xED, 0x4A, 0x75, 0x05, 0xAD, 0x89, 0xC5,
	0xB2, 0x10, 0xD1, 0xD1, 0x41, 0x41, 0xAC, 0xB7,
	0xFF, 0x8A, 0xD8, 0xE9, 0x13, 0x00, 0xAD, 0x8B,
	0xD8, 0xB1, 0x03, 0xD2, 0xEF, 0x80, 0xCF, 0xE0,
	0x80, 0xE4, 0x07, 0x74, 0x0C, 0x88, 0xE1, 0x41,
	0x41, 0x26, 0x8A, 0x01, 0xAA, 0xE2, 0xFA, 0xEB,
	0xA6, 0xAC, 0x08, 0xC0, 0x74, 0x40, 0x3C, 0x01,
	0x74, 0x05, 0x88, 0xC1, 0x41, 0xEB, 0xEA, 0x89
];

const sig91 = [
	0x06, 0x0E, 0x1F, 0x8B, 0x0E, 0x0C, 0x00, 0x8B,
	0xF1, 0x4E, 0x89, 0xF7, 0x8C, 0xDB, 0x03, 0x1E,
	0x0A, 0x00, 0x8E, 0xC3, 0xFD, 0xF3, 0xA4, 0x53,
	0xB8, 0x2B, 0x00, 0x50, 0xCB, 0x2E, 0x8B, 0x2E,
	0x08, 0x00, 0x8C, 0xDA, 0x89, 0xE8, 0x3D, 0x00,
	0x10, 0x76, 0x03, 0xB8, 0x00, 0x10, 0x29, 0xC5,
	0x29, 0xC2, 0x29, 0xC3, 0x8E, 0xDA, 0x8E, 0xC3,
	0xB1, 0x03, 0xD3, 0xE0, 0x89, 0xC1, 0xD1, 0xE0,
	0x48, 0x48, 0x8B, 0xF0, 0x8B, 0xF8, 0xF3, 0xA5,
	0x09, 0xED, 0x75, 0xD8, 0xFC, 0x8E, 0xC2, 0x8E,
	0xDB, 0x31, 0xF6, 0x31, 0xFF, 0xBA, 0x10, 0x00,
	0xAD, 0x89, 0xC5, 0xD1, 0xED, 0x4A, 0x75, 0x05,
	0xAD, 0x89, 0xC5, 0xB2, 0x10, 0x73, 0x03, 0xA4,
	0xEB, 0xF1, 0x31, 0xC9, 0xD1, 0xED, 0x4A, 0x75,
	0x05, 0xAD, 0x89, 0xC5, 0xB2, 0x10, 0x72, 0x22,
	0xD1, 0xED, 0x4A, 0x75, 0x05, 0xAD, 0x89, 0xC5,
	0xB2, 0x10, 0xD1, 0xD1, 0xD1, 0xED, 0x4A, 0x75,
	0x05, 0xAD, 0x89, 0xC5, 0xB2, 0x10, 0xD1, 0xD1,
	0x41, 0x41, 0xAC, 0xB7, 0xFF, 0x8A, 0xD8, 0xE9,
	0x13, 0x00, 0xAD, 0x8B, 0xD8, 0xB1, 0x03, 0xD2,
	0xEF, 0x80, 0xCF, 0xE0, 0x80, 0xE4, 0x07, 0x74,
	0x0C, 0x88, 0xE1, 0x41, 0x41, 0x26, 0x8A, 0x01,
	0xAA, 0xE2, 0xFA, 0xEB, 0xA6, 0xAC, 0x08, 0xC0,
	0x74, 0x34, 0x3C, 0x01, 0x74, 0x05, 0x88, 0xC1,
	0x41, 0xEB, 0xEA, 0x89, 0xFB, 0x83, 0xE7, 0x0F,
	0x81, 0xC7, 0x00, 0x20, 0xB1, 0x04, 0xD3, 0xEB,
	0x8C, 0xC0, 0x01, 0xD8, 0x2D, 0x00, 0x02, 0x8E,
	0xC0, 0x89, 0xF3, 0x83, 0xE6, 0x0F, 0xD3, 0xEB,
	0x8C, 0xD8, 0x01, 0xD8, 0x8E, 0xD8, 0xE9, 0x72
];

// The LZEXE available from Fabrice Bellard's website as of 2020 is still called
// v0.91 but it produces a very slightly different decompressor, which other
// UNLZEXE utilities can't read either.
const sig91e = [
	0x50,
	0x06, 0x0E, 0x1F, 0x8B, 0x0E, 0x0C, 0x00, 0x8B,
	0xF1, 0x4E, 0x89, 0xF7, 0x8C, 0xDB, 0x03, 0x1E,
	0x0A, 0x00, 0x8E, 0xC3, 0xFD, 0xF3, 0xA4, 0x53,
	0xB8, 0x2C, 0x00, 0x50, 0xCB, 0x2E, 0x8B, 0x2E,
	0x08, 0x00, 0x8C, 0xDA, 0x89, 0xE8, 0x3D, 0x00,
	0x10, 0x76, 0x03, 0xB8, 0x00, 0x10, 0x29, 0xC5,
	0x29, 0xC2, 0x29, 0xC3, 0x8E, 0xDA, 0x8E, 0xC3,
	0xB1, 0x03, 0xD3, 0xE0, 0x89, 0xC1, 0x48,
	0xD1, 0xE0, 0x8B, 0xF0, 0x8B, 0xF8, 0xF3, 0xA5,
	0x09, 0xED, 0x75, 0xD9, 0xFC, 0x8E, 0xC2, 0x8E,
	0xDB, 0x31, 0xF6, 0x31, 0xFF, 0xBA, 0x10, 0x00,
	0xAD, 0x89, 0xC5, 0xD1, 0xED, 0x4A, 0x75, 0x05,
	0xAD, 0x89, 0xC5, 0xB2, 0x10, 0x73, 0x03, 0xA4,
	0xEB, 0xF1, 0x31, 0xC9, 0xD1, 0xED, 0x4A, 0x75,
	0x05, 0xAD, 0x89, 0xC5, 0xB2, 0x10, 0x72, 0x22,
	0xD1, 0xED, 0x4A, 0x75, 0x05, 0xAD, 0x89, 0xC5,
	0xB2, 0x10, 0xD1, 0xD1, 0xD1, 0xED, 0x4A, 0x75,
	0x05, 0xAD, 0x89, 0xC5, 0xB2, 0x10, 0xD1, 0xD1,
	0x41, 0x41, 0xAC, 0xB7, 0xFF, 0x8A, 0xD8, 0xE9,
	0x13, 0x00, 0xAD, 0x8B, 0xD8, 0xB1, 0x03, 0xD2,
	0xEF, 0x80, 0xCF, 0xE0, 0x80, 0xE4, 0x07, 0x74,
	0x0C, 0x88, 0xE1, 0x41, 0x41, 0x26, 0x8A, 0x01,
	0xAA, 0xE2, 0xFA, 0xEB, 0xA6, 0xAC, 0x08, 0xC0,
	0x74, 0x34, 0x3C, 0x01, 0x74, 0x05, 0x88, 0xC1,
	0x41, 0xEB, 0xEA, 0x89, 0xFB, 0x83, 0xE7, 0x0F,
	0x81, 0xC7, 0x00, 0x20, 0xB1, 0x04, 0xD3, 0xEB,
	0x8C, 0xC0, 0x01, 0xD8, 0x2D, 0x00, 0x02, 0x8E,
	0xC0, 0x89, 0xF3, 0x83, 0xE6, 0x0F, 0xD3, 0xEB,
	0x8C, 0xD8, 0x01, 0xD8, 0x8E, 0xD8, 0xE9, 0x72
];

/// For LZEXE ver 0.90
function reloc90(inf, outf, offCS, ohead)
{
	// 0x19D = compressed relocation table address
	inf.seekAbs(offCS + 0x19D);

	let rel_count = 0;
	let rel_seg = 0;
	do {
		let c = inf.read(RecordType.int.u16le);
		for (; c > 0; c--) {
			let rel_off = inf.read(RecordType.int.u16le);
			outf.write(RecordType.int.u16le, rel_off);
			outf.write(RecordType.int.u16le, rel_seg);
			rel_count++;
		}
		rel_seg += 0x1000;
	} while (rel_seg != 0xf000 + 0x1000);

	ohead[3] = rel_count;
}

/// For LZEXE ver 0.91
function reloc91(inf, outf, offCS, ohead)
{
	// 0x158 = compressed relocation table address
	inf.seekAbs(offCS + 0x158);

	let rel_count = 0;
	let rel_seg = 0;
	let rel_off = 0;
	for (;;) {
		let s = inf.read(RecordType.int.u8);
		let span = s;
		if (span == 0) {
			span = inf.read(RecordType.int.u16le);
			if (span == 0) {
				rel_seg += 0x0fff;
				continue;
			} else if (span == 1) {
				break;
			}
		}
		rel_off += span;
		//rel_seg += (rel_off & ~0x0f) >> 4;
		rel_seg += rel_off >> 4;
		rel_off &= 0x0f;
		outf.write(RecordType.int.u16le, rel_off);
		outf.write(RecordType.int.u16le, rel_seg);
		rel_count++;
	}

	ohead[3] = rel_count;
}

/// Restore relocation table
function mkreltbl(inf, outf, ver, ihead, ohead, info)
{
	let offCS = (ihead[0x0b] + ihead[4]) << 4; // CS:0000
	inf.seekAbs(offCS);
	for (let i = 0; i < 0x08; i++) {
		info[i] = inf.read(RecordType.int.u16le);
	}

	ohead[0x0A] = info[0]; // IP
	ohead[0x0B] = info[1]; // CS
	ohead[0x08] = info[2]; // SP
	ohead[0x07] = info[3]; // SS
	// info[4]:size of compressed load module (PARAGRAPH)
	// info[5]:increase of load module size (PARAGRAPH)
	// info[6]:size of decompressor with  compressed relocation table (uint8_t)
	// info[7]:check sum of decompresser with compressd relocation table(Ver.0.90)
	ohead[0x0C] = 0x1C; // start position of relocation table

	outf.seekAbs(0x1C);

	switch (ver) {
		case 90: reloc90(inf, outf, offCS, ohead); break;
		case 91: reloc91(inf, outf, offCS, ohead); break;
		default: throw('Unsupported LZEXE version.');
	}

	// Get the length of the relocation table truncated to a signed 16-bit int
	let lenOut = outf.length & 0x7FFF;
	if (outf.length & 0x8000) lenOut = -32768 + lenOut;

	let i = (0x200 - lenOut) & 0x1ff;
	ohead[4] = (lenOut + i) >> 4;
	outf.put(new Uint8Array(i, 0));

	return;
}

function initbits(p, ins)
{
	p.ins = ins;
	p.count = 0x10;
	p.buf = p.ins.read(RecordType.int.u16le);
}

function getbit(p)
{
	let b = p.buf & 1;
	if (--p.count == 0) {
		p.buf = p.ins.read(RecordType.int.u16le);
		p.count = 0x10;
	} else {
		p.buf >>= 1;
	}
	return b;
}

export default class Compress_LZEXE
{
	static metadata() {
		return {
			id: FORMAT_ID,
			title: 'LZEXE compression',
			options: {},
		};
	}

	static identify(content) {
		const debug = g_debug.extend('identify');

		if (content.length < 18 + sig90.length) {
			return {
				valid: false,
				reason: 'File too short.',
			};
		}

		let inf = new RecordBuffer(content);
		inf.seekAbs(0);
		const sig0 = inf.read(RecordType.int.u16le);
		inf.seekAbs(4 * 2);
		const sig4 = inf.read(RecordType.int.u16le);
		inf.seekAbs(0x0A * 2);
		const sigA = inf.read(RecordType.int.u16le);
		const sigB = inf.read(RecordType.int.u16le);
		const sigC = inf.read(RecordType.int.u16le);
		const sigD = inf.read(RecordType.int.u16le);

		if (
			(sig0 != 0x5a4d && sig0 != 0x4d5a)
			|| sigD != 0
			|| sigC != 0x1c
		) {
			return {
				valid: false,
				reason: 'Not compressed with LZEXE.',
			};
		}

		const entry = ((sig4 + sigB) << 4) + sigA;
		if (entry >= inf.length) {
			return {
				valid: false,
				reason: 'Entry point is beyond end of file.',
			};
		}

		const sigbuf = inf.getU8(entry, sig90.length);
		if (
			(sigbuf.length == sig90.length) &&
			(sigbuf.every((el, i) => el == sig90[i]))
		) {
			return {
				valid: true,
				reason: 'Compressed with LZEXE 0.90.',
			};
		} else if (
			(sigbuf.length == sig91.length) &&
			(sigbuf.every((el, i) => el == sig91[i]))
		) {
			return {
				valid: true,
				reason: 'Compressed with LZEXE 0.91.',
			};
		} else if (
			(sigbuf.length == sig91e.length) &&
			(sigbuf.every((el, i) => el == sig91e[i]))
		) {
			return {
				valid: true,
				reason: 'Compressed with LZEXE 0.91e.',
			};
		}

		return {
			valid: false,
			reason: 'Compressed with an unknown version of LZEXE.',
		};
	}

	static reveal(content, options = {})
	{
		const debug = g_debug.extend('reveal');

		let inf = new RecordBuffer(content);

		let ihead = [], ohead = [];
		inf.seekAbs(0);
		for (let i = 0; i < 0x10; i++) {
			ihead[i] = inf.read(RecordType.int.u16le);
			ohead[i] = ihead[i];
		}

		if (
			(ihead[0] != 0x5a4d && ihead[0] != 0x4d5a)
			|| ihead[0x0d] != 0
			|| ihead[0x0c] != 0x1c
		) {
			debug(
				'LZEXE header - 0x00:', ihead[0].toString(16),
				'0x0D:', ihead[0x0d].toString(16),
				'0x0C:', ihead[0x0c].toString(16)
			);
			throw new Error('Cannot decompress a non-LZEXE file.');
		}

		let info = [];

		const entry = ((ihead[4] + ihead[0x0b]) << 4) + ihead[0x0a];
		if (entry >= inf.length) {
			throw new Error('Unable to unlzexe - file has been truncated.');
		}

		const sigbuf = inf.getU8(entry, sig90.length);

		debug(`entry=0x${entry.toString(16)}, len=${sigbuf.length}`);
		let ver, vers;
		if (
			(sigbuf.length == sig90.length) &&
			(sigbuf.every((el, i) => el == sig90[i]))
		) {
			ver = 90;
			vers = '0.90';
		} else if (
			(sigbuf.length == sig91.length) &&
			(sigbuf.every((el, i) => el == sig91[i]))
		) {
			ver = 91;
			vers = '0.91';
		} else if (
			(sigbuf.length == sig91e.length) &&
			(sigbuf.every((el, i) => el == sig91e[i]))
		) {
			ver = 91;
			vers = '0.91e';
		} else {
			throw new Error('Unknown LZEXE version.');
		}
		debug(`compressed by LZEXE ${vers}`);

		let outf = new RecordBuffer(new Uint8Array(options.finalSize));
		mkreltbl(inf, outf, ver, ihead, ohead, info);

		let bits = {};
		let outbuf = [];
		let pos = 0;
		const offInStart = (ihead[0x0b] - info[4] + ihead[4]) << 4;
		const offOutStart = ohead[4] << 4;
		inf.seekAbs(offInStart);
		outf.seekAbs(offOutStart);

		let outlen = 0;

		initbits(bits, inf);
		let span = 0, len = 0;
		for (;;) {

			if (pos > 0x4000) {
				outf.put(outbuf.slice(0, 0x2000));
				outlen += 0x2000;
				pos -= 0x2000;
				outbuf = outbuf.slice(0x2000);
			}
			if (getbit(bits)) {
				outbuf[pos++] = inf.read(RecordType.int.u8);
				continue;
			}
			if (!getbit(bits)) {
				len = getbit(bits) << 1;
				len |= getbit(bits);
				len += 2;
				span = inf.read(RecordType.int.u8) | 0xFF00;
				if (span&0x8000) span = -32768 + (span&0x7fff);
			} else {
				span = inf.read(RecordType.int.u8);
				len = inf.read(RecordType.int.u8);
				span |= ((len & ~0x07) << 5) | 0xe000;
				len = (len & 0x07) + 2;
				if (span&0x8000) span = -32768 + (span&0x7fff);
				if (len == 2) {
					len = inf.read(RecordType.int.u8);

					if (len == 0) break; // end mark of compressed load module
					if (len == 1) continue; // segment change
					else len++;
				}
			}
			for (; len > 0; len--, pos++) {
				outbuf[pos] = outbuf[pos + span];
			}
		}

		if (pos > 0) {
			outf.put(outbuf, pos);
			outlen += pos;
			debug('final slice', outlen.toString(16));
		}

		// Truncate to here.
		//outf.updateLength();

		const loadSize = outlen;

		// Write EXE header
		if (ihead[6] != 0) {
			ohead[5] -= inf[5] + ((inf[6] + 16 - 1) >> 4) + 9;
			if (ihead[6] != 0xffff) {
				ohead[6] -= (ihead[5] - ohead[5]);
			}
		}

		ohead[1] = (/*(uint16_t)*/loadSize + (ohead[4] << 4)) & 0x1ff;
		ohead[2] = /*(uint16_t)*/((loadSize + (ohead[4] << 4) + 0x1ff) >> 9);
		outf.seekAbs(0);
		for (let i = 0; i < 0x0e; i++) {
			outf.write(RecordType.int.u16le, ohead[i]);
		}

		return outf.getU8();
	}

/*
	static obscure(content, options = {}) {
		const debug = g_debug.extend('obscure');

		debug('LZEXE compression not implemented, doing nothing');

		return content;
	}
*/
}
