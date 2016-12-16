// @flow
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
    let episode = null;

    if (bin.function_offsets.length) {
        episode = get_episode(bin);
    } else {
        console.warn('File contains no functions.');
    }

    return new Quest({
        name: bin.quest_name,
        short_description: bin.short_description,
        long_description: bin.long_description,
        episode: episode || 1,
        // TODO: extract full area list from .dat/.bin files if possible.
        area_ids: dat.npcs.map(m => m.area_id).sort().toOrderedSet(),
        npcs: dat.npcs
    });
}

function get_episode(bin) {
    const func_0_ops = get_func_operations(bin.instructions, bin.function_offsets[0]);

    if (func_0_ops) {
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
            return null;
        }
    } else {
        console.warn(`Function 0 offset ${bin.function_offsets[0]} is invalid.`);
        return null;
    }
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