// @flow
import { List } from 'immutable';
import ArrayBufferCursor from './ArrayBufferCursor';
import { parse_qst } from './qst';
import { Quest } from '../domain';

/**
 * High level parsing function that delegates to lower level parsing functions.
 * 
 * Always delegates to parse_qst at the moment.
 */
export function parse_quest(cursor: ArrayBufferCursor): Quest {
    const {dat, bin} = parse_qst(cursor);
    return new Quest({
        name: bin.quest_name,
        short_description: bin.short_description,
        // TODO: extract full area list from .dat/.bin files if possible.
        area_ids: dat.monsters.map(m => m.area_id).sort().toOrderedSet(),
        npcs: List(dat.monsters)
    });
}
