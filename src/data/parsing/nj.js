// @flow
import {
    BufferAttribute,
    BufferGeometry,
    Object3D,
    Points,
    PointsMaterial
} from 'three';
import { ArrayBufferCursor } from '../ArrayBufferCursor';

export function parse_nj(cursor: ArrayBufferCursor): ?Object3D {
    while (cursor.bytes_left) {
        // NJ uses a little endian variant of the IFF format.
        // IFF files contain chunks preceded by an 8-byte header.
        // The header consists of 4 ASCII characters for the "Type ID" and a 32-bit integer specifying the chunk size.
        const iff_type_id = cursor.string_ascii(4, false, false);
        const iff_chunk_size = cursor.u32();

        if (iff_type_id === 'NJCM') {
            return parse_njcm(cursor.take(iff_chunk_size));
        } else {
            cursor.seek(iff_chunk_size);
        }
    }

    return null;
}

function parse_njcm(cursor: ArrayBufferCursor): ?Object3D {
    if (cursor.bytes_left) {
        const objects = parse_sibling_objects(cursor, null);

        if (objects.length === 1) {
            return objects[0];
        } else {
            console.warn(`Expected the root object to have no siblings, but it has ${objects.length}.`);
            const object = new Object3D();
            object.add(...objects);
            return object;
        }
    } else {
        return null;
    }
}

function parse_sibling_objects(cursor: ArrayBufferCursor): Object3D[] {
    cursor.seek(4);
    const model_offset = cursor.u32();
    const pos_x = cursor.f32();
    const pos_y = cursor.f32();
    const pos_z = cursor.f32();
    const rotation_x = cursor.i32() / 0xFFFF * 2 * Math.PI;
    const rotation_y = cursor.i32() / 0xFFFF * 2 * Math.PI;
    const rotation_z = cursor.i32() / 0xFFFF * 2 * Math.PI;
    console.log(`rotation: ${rotation_x}, ${rotation_y}, ${rotation_z}`);
    const scale_x = cursor.f32();
    const scale_y = cursor.f32();
    const scale_z = cursor.f32();
    const child_offset = cursor.u32();
    const sibling_offset = cursor.u32();

    let object: Object3D;

    if (model_offset) {
        cursor.seek_start(model_offset);
        object = parse_model(cursor);
    } else {
        object = new Object3D();
    }

    object.position.set(pos_x, pos_y, pos_z);
    object.rotation.set(rotation_x, rotation_y, rotation_z);
    object.scale.set(scale_x, scale_y, scale_z);

    if (child_offset) {
        cursor.seek_start(child_offset);
        object.add(...parse_sibling_objects(cursor));
    }

    if (sibling_offset) {
        cursor.seek_start(sibling_offset);
        return [object, ...parse_sibling_objects(cursor)];
    } else {
        return [object];
    }
}

function parse_model(cursor: ArrayBufferCursor): Object3D {
    console.log(`model offset: ${cursor.position}`);
    const vlist_offset = cursor.u32();
    const plist_offset = cursor.u32();

    let positions = [];
    let normals = [];

    if (vlist_offset) {
        try {
            cursor.seek_start(vlist_offset);

            for (const chunk of parse_chunks(cursor)) {
                if (chunk.chunk_type === 'VERTEX') {
                    const [chunk_positions, chunk_normals] = chunk.data;
                    positions = positions.concat(chunk_positions);
                    normals = normals.concat(chunk_normals);
                }
            }
        } catch (e) {
            console.error(e);
        }
    }

    let indices;

    if (plist_offset) {
        cursor.seek_start(plist_offset);
        // TODO
    } else {
        indices = new Uint16Array();
    }

    const geometry = new BufferGeometry();
    geometry.addAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
    // geometry.setIndex(new BufferAttribute(indices, 1));

    const points = new Points(
        geometry,
        new PointsMaterial({ color: 0xC0FFFF, size: 0.1 })
        // new MeshLambertMaterial({
        //     color: 0xFF00FF,
        //     // transparent: true,
        //     // opacity: 0.25,
        //     side: DoubleSide
        // })
    );
    // mesh.setDrawMode(TriangleStripDrawMode);

    return points;
}

function parse_chunks(cursor: ArrayBufferCursor): *[] {
    const chunks = [];
    let loop = true;

    while (loop) {
        const chunk_type_id = cursor.u8();
        cursor.seek(1); // Flags
        const size = cursor.u16();
        const chunk_start_position = cursor.position;
        let stride = 2;
        let chunk_type = 'UNKOWN';
        let data = null;

        if (chunk_type_id === 0) {
            chunk_type = 'NULL';
        } else if (32 <= chunk_type_id && chunk_type_id <= 50) {
            chunk_type = 'VERTEX';
            data = parse_chunk_vertex(cursor, chunk_type_id);
            stride = 4;
        } else if (chunk_type_id === 255) {
            chunk_type = 'END';
            loop = false;
        } else {
            // Ignore unknown chunks.
            console.warn(`Unknown chunk type: ${chunk_type_id}.`);
        }

        cursor.seek_start(chunk_start_position + stride * size);

        chunks.push({
            chunk_type,
            chunk_type_id,
            data
        });
    }

    return chunks;
}

function parse_chunk_vertex(cursor: ArrayBufferCursor, chunk_type_id: number): [Float32Array, Float32Array] {
    const index_offsets = cursor.u16();
    const index_count = cursor.u16();

    const positions = [];
    const normals = [];

    console.log(`chunk_type: ${chunk_type_id}, index_offsets: ${index_offsets}, index_count: ${index_count}`);

    for (let i = 0; i < index_count; ++i) {
        // TODO: add default normal when not specified.
        positions.push(cursor.f32()); // x
        positions.push(cursor.f32()); // y
        positions.push(cursor.f32()); // z

        if (chunk_type_id === 32) {
            cursor.seek(4); // Always 1.0
        } else if (chunk_type_id === 33) {
            cursor.seek(4); // Always 1.0
            normals.push(cursor.f32()); // x
            normals.push(cursor.f32()); // y
            normals.push(cursor.f32()); // z
            cursor.seek(4); // Always 0.0
        } else if (35 <= chunk_type_id && chunk_type_id <= 40) {
            // Skip various flags and material information.
            cursor.seek(4);
        } else if (41 <= chunk_type_id && chunk_type_id <= 47) {
            normals.push(cursor.f32()); // x
            normals.push(cursor.f32()); // y
            normals.push(cursor.f32()); // z

            if (chunk_type_id > 41) {
                // Skip various flags and material information.
                cursor.seek(4);
            }
        } else if (chunk_type_id >= 48) {
            // Skip 32-bit vertex normal in format: reserved(2)|x(10)|y(10)|z(10)
            cursor.seek(4);

            if (chunk_type_id >= 49) {
                // Skip various flags and material information.
                cursor.seek(4);
            }
        }

        console.log(...positions.slice(-3));
    }

    return [positions, normals];
}
