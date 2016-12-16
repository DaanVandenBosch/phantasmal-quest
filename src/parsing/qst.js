// @flow
import { ArrayBufferCursor } from './ArrayBufferCursor';
import * as prs from './prs';
import { parse_dat } from './dat';
import { parse_bin } from './bin';

/**
 * Low level parsing function for .qst files.
 */
export function parse_qst(cursor: ArrayBufferCursor) {
    // Read headers.
    // A .qst file contains two 88-byte headers that describe the embedded .dat and .bin files.
    let dat_file_name = null;
    let dat_size = 0;
    let bin_file_name = null;
    let bin_size = 0;

    for (let i = 0; i < 2; ++i) {
        cursor.seek(44);
        const file_name = cursor.string_ascii(16, true, true);
        const size = cursor.u32();
        cursor.seek(24);

        if (file_name.endsWith('.dat')) {
            dat_file_name = file_name;
            dat_size = size;
        } else if (file_name.endsWith('.bin')) {
            bin_file_name = file_name;
            bin_size = size;
        } else {
            console.warn(`File "${file_name}" has unexpected extension.`);
        }
    }

    if (dat_file_name === null) {
        console.warn('No .dat file defined in header.');
    }

    if (bin_file_name === null) {
        console.warn('No .bin file defined in header.');
    }

    const {dat_data, bin_data} = extract_file_data(cursor, dat_size, bin_size);

    return {
        dat: parse_dat(prs.decompress(dat_data)),
        bin: parse_bin(prs.decompress(bin_data))
    };
}

function extract_file_data(cursor, dat_size, bin_size) {
    // .dat and .bin files are interleaved in 1056 byte chunks.
    // Each chunk has a 24 byte header, 1024 data segment and an 8 byte trailer.
    let dat_data = new ArrayBufferCursor(dat_size, true);
    let bin_data = new ArrayBufferCursor(bin_size, true);

    while (cursor.position < cursor.size) {
        const start_position = cursor.position;
        const file_name = cursor.seek(8).string_ascii(16, true, true);
        const size = cursor.seek(1024).u32();
        cursor.seek(-1028);

        if (size <= 1024) {
            if (file_name.endsWith('.dat')) {
                const data = cursor.take(size);
                dat_data.write_cursor(data);
                cursor.seek(1028 - data.size);
            } else if (file_name.endsWith('.bin')) {
                const data = cursor.take(size);
                bin_data.write_cursor(data);
                cursor.seek(1028 - data.size);
            } else {
                console.warn(`Chunk for file "${file_name}" has unexpected extension.`);
                cursor.seek(1028);
            }
        } else {
            console.warn(`Data segment size of ${size} is larger than expected maximum size of 1024.`);
        }

        cursor.seek(4);

        if (cursor.position !== start_position + 1056) {
            console.error(`Couldn't read a full file data block.`);
        }
    }

    if (dat_data.size !== dat_size) {
        console.warn(`Read ${dat_data.size} .dat file bytes instead of expected ${dat_size}.`);
    }

    if (bin_data.size !== bin_size) {
        console.warn(`Read ${bin_data.size} .bin file bytes instead of expected ${bin_size}.`);
    }

    dat_data.seek_start(0);
    bin_data.seek_start(0);

    return { dat_data, bin_data };
}