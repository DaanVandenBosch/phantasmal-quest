// @flow
import { OrderedMap } from 'immutable';
import { ArrayBufferCursor } from './ArrayBufferCursor';
import { parse_qst } from './qst';
import { Quest } from '../domain';

/**
 * High level parsing function that delegates to lower level parsing functions.
 * 
 * Always delegates to parse_qst at the moment.
 */
export function parse_quest(cursor: ArrayBufferCursor): Quest {
    const {dat, bin} = parse_qst(cursor);
    let episode = 1;
    let areas = new OrderedMap();

    if (bin.function_offsets.length) {
        const func_0_ops = get_func_operations(bin.instructions, bin.function_offsets[0]);

        if (func_0_ops) {
            episode = get_episode(func_0_ops);
            areas = get_areas(func_0_ops);
        } else {
            console.warn(`Function 0 offset ${bin.function_offsets[0]} is invalid.`);
            return null;
        }
    } else {
        console.warn('File contains no functions.');
    }

    return new Quest({
        name: bin.quest_name,
        short_description: bin.short_description,
        long_description: bin.long_description,
        episode,
        areas,
        npcs: dat.npcs
    });
}

/**
 * Defaults to episode I.
 */
function get_episode(func_0_ops): number {
    const set_episode = func_0_ops.find(op => op.mnemonic === 'set_episode');

    if (set_episode) {
        switch (set_episode.args[0]) {
            default:
            case 0: return 1;
            case 1: return 2;
            case 2: return 4;
        }
    } else {
        console.warn('Function 0 has no set_episode instruction.');
        return 1;
    }
}

function get_areas(func_0_ops): OrderedMap<number, number> {
    const areas = [];
    const bb_maps = func_0_ops.filter(op => op.mnemonic === 'BB_Map_Designate');

    for (const bb_map of bb_maps) {
        areas.push([bb_map.args[0], bb_map.args[2]]);
    }

    return new OrderedMap(areas).sortBy((_, id) => id);
}

function get_func_operations(operations: any[], func_offset: number) {
    let position = 0;
    let func_found = false;
    const func_ops = [];

    for (const operation of operations) {
        if (position === func_offset) {
            func_found = true;
        }

        if (func_found) {
            func_ops.push(operation);

            // Break when ret is encountered.
            if (operation.opcode === 1) {
                break;
            }
        }

        position += operation.size;
    }

    return func_found ? func_ops : null;
}