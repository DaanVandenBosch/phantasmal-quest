// @flow
import { List } from 'immutable';
import { ArrayBufferCursor } from './ArrayBufferCursor';

export function parse_dat(cursor: ArrayBufferCursor) {
    const npcs = [];
    const objs = [];
    let offset = 0;

    while (offset < cursor.size) {
        cursor.seek_start(offset);
        const entity_type = cursor.u32();
        const total_size = cursor.u32();
        const area_id = cursor.u32();
        const entities_size = cursor.u32();

        if (entity_type === 0) {
            break;
        } else if (entity_type === 1) { // Object
            const object_count = Math.floor(entities_size / 68);
            const start_position = cursor.position;

            for (let i = 0; i < object_count; ++i) {
                const type_id = cursor.u16();
                cursor.seek(6);
                const id = cursor.u16();
                const group = cursor.u16();
                const section_id = cursor.u16();
                cursor.seek(2);
                const x = cursor.f32();
                const y = cursor.f32();
                const z = cursor.f32();
                cursor.seek(18);
                const object_id = cursor.u32();
                const action = cursor.u32();
                cursor.seek(14);

                objs.push({
                    type_id,
                    id,
                    group,
                    section_id,
                    position: [x, y, z],
                    object_id,
                    action,
                    area_id
                });
            }

            const bytes_read = cursor.position - start_position;

            if (bytes_read !== entities_size) {
                console.warn(`Read ${bytes_read} bytes instead of expected ${entities_size} for entity type ${entity_type} (Object).`);
            }
        } else if (entity_type === 2) { // NPCs
            const npc_count = Math.floor(entities_size / 72);
            const start_position = cursor.position;

            for (let i = 0; i < npc_count; ++i) {
                const type_id = cursor.u16();
                cursor.seek(4);
                const clone_count = cursor.u16();
                cursor.seek(4);
                const section_id = cursor.u16();
                cursor.seek(6);
                const x = cursor.f32();
                const y = cursor.f32();
                const z = cursor.f32();
                cursor.seek(4);
                const direction = cursor.u32();
                cursor.seek(4);
                const movement_data = cursor.f32();
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
                    direction,
                    movement_data,
                    regular,
                    exp,
                    skin,
                    rt_index,
                    area_id
                });
            }

            const bytes_read = cursor.position - start_position;

            if (bytes_read !== entities_size) {
                console.warn(`Read ${bytes_read} bytes instead of expected ${entities_size} for entity type ${entity_type} (NPC).`);
            }
        }
        // There are also unknown entity types 3, 4 and 5.

        offset += total_size;
    }

    return { objs: new List(objs), npcs: new List(npcs) };
}
