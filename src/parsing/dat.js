// @flow
import { List } from 'immutable';
import { ArrayBufferCursor } from './ArrayBufferCursor';

export function parse_dat(cursor: ArrayBufferCursor) {
    const npcs = [];
    let offset = 0;

    while (offset < cursor.size) {
        cursor.seek_start(offset);
        const entity_type = cursor.u32();
        const next_header = cursor.u32();
        const area_id = cursor.u32();
        const size = cursor.u32();

        if (entity_type === 2) {
            const npc_count = Math.floor(size / 72);
            const start_position = cursor.position;

            for (let i = 0; i < npc_count; ++i) {
                const type_id = cursor.u32();
                cursor.seek(2);
                const clone_count = cursor.u16();
                cursor.seek(4);
                const section_id = cursor.u16();
                cursor.seek(6);
                const x = cursor.f32();
                const y = cursor.f32();
                const z = cursor.f32();
                cursor.seek(16);
                const regular = (cursor.u32() & 0x800000) === 0;
                cursor.seek(8);
                const exp = cursor.u32(); // ?
                const skin = cursor.u32();
                const rt_index = cursor.u32(); // ?

                npcs.push({
                    type_id,
                    clone_count,
                    section_id,
                    position: [x, y, z],
                    regular,
                    exp,
                    skin,
                    rt_index,
                    area_id
                });
            }

            const bytes_read = cursor.position - start_position;

            if (bytes_read !== size) {
                console.warn(`Read ${bytes_read} bytes instead of expected ${size} for entity type ${entity_type}.`);
            }
        } else if (entity_type !== 1 && entity_type !== 3) {
            break;
        }

        offset += next_header;
    }

    return { npcs: List(npcs) };
}
