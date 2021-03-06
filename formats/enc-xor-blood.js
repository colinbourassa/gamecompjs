/*
 * Blood XOR encryption algorithm.
 *
 * This algorithm is fully documented on the ModdingWiki:
 *   http://www.shikadi.net/moddingwiki/RFF_Format#Encryption
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

const FORMAT_ID = 'enc-xor-blood';

// Number of bytes encrypted from start of file
const RFF_FILE_CRYPT_LEN = 256;

export default class Encrypt_XOR_Blood
{
	static metadata() {
		return {
			id: FORMAT_ID,
			title: 'Blood XOR encryption',
			options: {
				offset: 'Key offset (v3.1 = 0, v3.0 = 1)',
				seed: 'Initial seed for the first XOR byte',
				limit: 'Number of bytes to affect (0=all, default is ' + RFF_FILE_CRYPT_LEN + ')',
			},
		};
	}

	static reveal(content, options = {})
	{
		let output = new Uint8Array(content);

		const offset = parseInt(options.offset || 0);
		const seed = parseInt(options.seed || 0);
		const limit = options.limit === undefined ? RFF_FILE_CRYPT_LEN : parseInt(options.limit);
		const lenEncrypt = limit === 0 ? output.length : Math.min(limit, output.length);

		for (let i = 0; i < lenEncrypt; i++) {
			output[i] ^= seed + ((i + offset) >> 1);
		}

		return output;
	}

	static obscure(content, options = {}) {
		// Symmetric algorithm
		return this.reveal(content, options);
	}
}
