// @flow
import * as fs from 'fs';
import { ArrayBufferCursor } from '../ArrayBufferCursor';
import * as prs from '../compression/prs';
import { parse_qst, write_qst } from './qst';

/**
 * Parse a file, convert the resulting structure to QST again and check whether the end result is equal to the original.
 */
test('parse_bin and write_bin', () => {
    const orig_buffer = fs.readFileSync('test/resources/quest118_e.qst').buffer;
    const orig_qst = new ArrayBufferCursor(orig_buffer, true);
    const test_qst = write_qst(parse_qst(orig_qst));
    orig_qst.seek_start(0);

    expect(test_qst.size).toBe(orig_qst.size);

    let match = true;

    while (orig_qst.bytes_left) {
        if (test_qst.u8() !== orig_qst.u8()) {
            match = false;
            break;
        }
    }

    expect(match).toBe(true);
});
