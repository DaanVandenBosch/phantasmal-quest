// @flow
import {
    BufferAttribute,
    BufferGeometry,
    Euler,
    Matrix3,
    Matrix4,
    Object3D,
    Quaternion,
    Vector3
} from 'three';
import { ArrayBufferCursor } from '../ArrayBufferCursor';

export function parse_xj(cursor: ArrayBufferCursor): ?Object3D {
    while (cursor.bytes_left) {
        // XNJ uses a little endian variant of the IFF format.
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

function parse_njcm(cursor: ArrayBufferCursor): ?BufferGeometry {
    if (cursor.bytes_left) {
        const positions: number[] = [];
        const normals: number[] = [];
        const indices: number[] = [];
        parse_sibling_objects(cursor, new Matrix4(), positions, normals, indices);
        return create_buffer_geometry(positions, normals, indices);
    } else {
        return null;
    }
}

function parse_sibling_objects(
    cursor: ArrayBufferCursor,
    parent_matrix: Matrix4,
    positions: number[],
    normals: number[],
    indices: number[]
): void {
    const eval_flags = cursor.u32();
    const no_translate = (eval_flags & 0b1) !== 0;
    const no_rotate = (eval_flags & 0b10) !== 0;
    const no_scale = (eval_flags & 0b100) !== 0;
    const hidden = (eval_flags & 0b1000) !== 0;
    const break_child_trace = (eval_flags & 0b10000) !== 0;
    const zxy_rotation_order = (eval_flags & 0b100000) !== 0;

    const model_offset = cursor.u32();
    const pos_x = cursor.f32();
    const pos_y = cursor.f32();
    const pos_z = cursor.f32();
    const rotation_x = cursor.i32() / 0xFFFF * 2 * Math.PI;
    const rotation_y = cursor.i32() / 0xFFFF * 2 * Math.PI;
    const rotation_z = cursor.i32() / 0xFFFF * 2 * Math.PI;
    const scale_x = cursor.f32();
    const scale_y = cursor.f32();
    const scale_z = cursor.f32();
    const child_offset = cursor.u32();
    const sibling_offset = cursor.u32();

    const rotation = new Euler(rotation_x, rotation_y, rotation_z, zxy_rotation_order ? 'ZXY' : 'ZYX');
    const matrix = new Matrix4()
        .compose(
        no_translate ? new Vector3() : new Vector3(pos_x, pos_y, pos_z),
        no_rotate ? new Quaternion(0, 0, 0, 1) : new Quaternion().setFromEuler(rotation),
        no_scale ? new Vector3(1, 1, 1) : new Vector3(scale_x, scale_y, scale_z)
        )
        .premultiply(parent_matrix);

    if (model_offset && !hidden) {
        cursor.seek_start(model_offset);
        parse_model(cursor, matrix, positions, normals, indices);
    }

    if (child_offset && !break_child_trace) {
        cursor.seek_start(child_offset);
        parse_sibling_objects(cursor, matrix, positions, normals, indices);
    }

    if (sibling_offset) {
        cursor.seek_start(sibling_offset);
        parse_sibling_objects(cursor, parent_matrix, positions, normals, indices);
    }
}

function create_buffer_geometry(
    positions: number[],
    normals: number[],
    indices: number[]
): BufferGeometry {
    const geometry = new BufferGeometry();
    geometry.addAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
    geometry.addAttribute('normal', new BufferAttribute(new Float32Array(normals), 3));
    geometry.setIndex(new BufferAttribute(new Uint16Array(indices), 1));
    return geometry;
}

function parse_model(
    cursor: ArrayBufferCursor,
    matrix: Matrix4,
    positions: number[],
    normals: number[],
    indices: number[]
): void {
    cursor.seek(4); // Flags according to QEdit, seemingly always 0.
    const vertex_info_list_offset = cursor.u32();
    cursor.seek(4); // Seems to be the vertex_info_count, always 1.
    const triangle_strip_list_a_offset = cursor.u32();
    const triangle_strip_a_count = cursor.u32();
    const triangle_strip_list_b_offset = cursor.u32();
    const triangle_strip_b_count = cursor.u32();
    cursor.seek(16); // Bounding sphere position and radius in floats.

    const normal_matrix = new Matrix3().getNormalMatrix(matrix);
    const index_offset = positions.length / 3;

    if (vertex_info_list_offset) {
        cursor.seek_start(vertex_info_list_offset);
        cursor.seek(4); // Possibly the vertex type.
        const vertex_list_offset = cursor.u32();
        const vertex_size = cursor.u32();
        const vertex_count = cursor.u32();

        for (let i = 0; i < vertex_count; ++i) {
            cursor.seek_start(vertex_list_offset + i * vertex_size);
            const position = new Vector3(
                cursor.f32(),
                cursor.f32(),
                cursor.f32()
            ).applyMatrix4(matrix);
            let normal;

            if (vertex_size === 28 || vertex_size === 32 || vertex_size === 36) {
                normal = new Vector3(
                    cursor.f32(),
                    cursor.f32(),
                    cursor.f32()
                ).applyMatrix3(normal_matrix);
            } else {
                normal = new Vector3(0, 1, 0);
            }

            positions.push(position.x);
            positions.push(position.y);
            positions.push(position.z);
            normals.push(normal.x);
            normals.push(normal.y);
            normals.push(normal.z);
        }
    }

    if (triangle_strip_list_a_offset) {
        parse_triangle_strip_list(cursor, triangle_strip_list_a_offset, triangle_strip_a_count, positions, normals, indices, index_offset);
    }

    if (triangle_strip_list_b_offset) {
        parse_triangle_strip_list(cursor, triangle_strip_list_b_offset, triangle_strip_b_count, positions, normals, indices, index_offset);
    }
}

function parse_triangle_strip_list(
    cursor: ArrayBufferCursor,
    triangle_strip_list_offset: number,
    triangle_strip_count: number,
    positions: number[],
    normals: number[],
    indices: number[],
    index_offset: number
): void {
    for (let i = 0; i < triangle_strip_count; ++i) {
        cursor.seek_start(triangle_strip_list_offset + i * 20);
        cursor.seek(8); // Skip material information.
        const index_list_offset = cursor.u32();
        const index_count = cursor.u32();
        // Ignoring 4 bytes.

        cursor.seek_start(index_list_offset);
        const strip_indices = cursor.u16_array(index_count);
        let ccw = true;

        for (let j = 2; j < strip_indices.length; ++j) {
            const a = index_offset + strip_indices[j - 2];
            const b = index_offset + strip_indices[j - 1];
            const c = index_offset + strip_indices[j];
            // const pa = positions.slice(3 * a, 3 * a + 3);
            // const pb = positions.slice(3 * b, 3 * b + 3);
            // const pc = positions.slice(3 * c, 3 * c + 3);
            // const na = normals.slice(3 * a, 3 * a + 3);
            // const nb = normals.slice(3 * b, 3 * b + 3);
            // const nc = normals.slice(3 * c, 3 * c + 3);

            // The following switch statement fixes most of model 180.xj (zanba).
            // switch (j) {
            //     case 9:
            //     case 53:
            //     case 70:
            //     case 126:
            //     case 140:
            //     case 148:
            //     case 187:
            //     case 200:
            //         ccw = !ccw;
            // }

            // function veq(v1, v2) {
            //     for (let i = 0; i < 3; ++i) {
            //         if (v1[i] !== v2[i]) {
            //             return false;
            //         }
            //     }

            //     return true;
            // }

            // if (veq(pa, pb) && veq(na, nb)) {
            //     ccw = !ccw;
            //     console.log('swapping winding at '+j, pa, na)
            // }

            if (j % 2 === (ccw ? 0 : 1)) {
                indices.push(a);
                indices.push(b);
                indices.push(c);
            } else {
                indices.push(b);
                indices.push(a);
                indices.push(c);
            }
        }
    }
}