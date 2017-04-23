// @flow
import { Matrix3, Matrix4, Vector3 } from 'three';
import { ArrayBufferCursor } from '../../ArrayBufferCursor';

// TODO:
// - textures
// - colors
// - bump maps
// - animation

export type XjContext = {
    format: 'xj',
    positions: number[],
    normals: number[],
    indices: number[]
};

export function parse_xj_model(cursor: ArrayBufferCursor, matrix: Matrix4, context: XjContext): void {
    const { positions, normals, indices } = context;

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
        parse_triangle_strip_list(
            cursor,
            triangle_strip_list_a_offset,
            triangle_strip_a_count,
            positions,
            normals,
            indices,
            index_offset);
    }

    if (triangle_strip_list_b_offset) {
        parse_triangle_strip_list(
            cursor,
            triangle_strip_list_b_offset,
            triangle_strip_b_count,
            positions,
            normals,
            indices,
            index_offset);
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
