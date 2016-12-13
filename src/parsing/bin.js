// @flow
import ArrayBufferCursor from './ArrayBufferCursor';

export function parse_bin(cursor: ArrayBufferCursor) {
    cursor.seek(24);
    const quest_name = cursor.string_utf_16(64, true, true);
    const short_description = cursor.string_utf_16(256, true, true);
    return { quest_name, short_description };
}
