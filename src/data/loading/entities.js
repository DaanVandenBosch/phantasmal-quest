// @flow
import { Object3D } from 'three';
import { NpcType } from '../../domain';
import { get_npc_data } from './assets';
import { ArrayBufferCursor } from '../ArrayBufferCursor';
import { parse_nj } from '../parsing/nj';

const cache: Map<string, Promise<Object3D>> = new Map();

export function get_npc_geometry(npc_type: NpcType): Promise<Object3D> {
    let geometry = cache.get(String(npc_type.id));

    if (geometry) {
        return geometry;
    } else {
        geometry = get_npc_data(npc_type).then(array_buffer => {
            const object_3d = parse_nj(new ArrayBufferCursor(array_buffer, true));

            if (object_3d) {
                return object_3d;
            } else {
                throw new Error('NJ file could not be parsed into an Object3d.');
            }
        });

        cache.set(String(npc_type.id), geometry);
        return geometry;
    }
}
