// @flow
import ArrayBufferCursor from './ArrayBufferCursor';

export function parse_bin(cursor: ArrayBufferCursor) {
    const script_offset = cursor.u32();
    const bin_ofs = cursor.u32();
    cursor.seek(16);
    const quest_name = cursor.string_utf_16(64, true, true);
    const short_description = cursor.string_utf_16(256, true, true);
    const long_description = cursor.string_utf_16(512, true, true);

    return { quest_name, short_description, long_description };
}
