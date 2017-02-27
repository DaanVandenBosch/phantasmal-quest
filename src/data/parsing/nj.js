// @flow
import {
    BufferAttribute,
    BufferGeometry,
    DoubleSide,
    Euler,
    Matrix3,
    Matrix4,
    Mesh,
    MeshLambertMaterial,
    Object3D,
    Quaternion,
    Vector3
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
        const positions = [];
        const normals = [];
        const indices = [];
        parse_sibling_objects(cursor, new Matrix4(), positions, normals, indices);
        return create_object_3d(positions, normals, indices);
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
    cursor.seek(4);
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

    const matrix = new Matrix4()
        .compose(
        new Vector3(pos_x, pos_y, pos_z),
        new Quaternion().setFromEuler(new Euler(rotation_x, rotation_y, rotation_z)),
        new Vector3(scale_x, scale_y, scale_z)
        )
        .premultiply(parent_matrix);

    if (model_offset) {
        cursor.seek_start(model_offset);
        parse_model(cursor, matrix, positions, normals, indices);
    }

    if (child_offset) {
        cursor.seek_start(child_offset);
        parse_sibling_objects(cursor, matrix, positions, normals, indices);
    }

    if (sibling_offset) {
        cursor.seek_start(sibling_offset);
        parse_sibling_objects(cursor, parent_matrix, positions, normals, indices);
    }
}

function create_object_3d(
    positions: number[],
    normals: number[],
    indices: number[]
): Object3D {
    for (let i = 0; i < positions.length; ++i) {
        if (typeof positions[i] !== 'number') {
            positions[i] = 0;
        }
    }

    const geometry = new BufferGeometry();
    geometry.addAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
    geometry.addAttribute('normal', new BufferAttribute(new Float32Array(normals), 3));
    geometry.setIndex(new BufferAttribute(new Uint16Array(indices), 1));

    return new Mesh(
        geometry,
        new MeshLambertMaterial({
            color: 0xFF00FF,
            side: DoubleSide
        })
    );
}

function parse_model(
    cursor: ArrayBufferCursor,
    matrix: Matrix4,
    positions: number[],
    normals: number[],
    indices: number[]
): void {
    const vlist_offset = cursor.u32(); // Vertex list
    const plist_offset = cursor.u32(); // Triangle strip index list

    const normal_matrix = new Matrix3().getNormalMatrix(matrix);

    try {
        if (vlist_offset) {
            cursor.seek_start(vlist_offset);

            for (const chunk of parse_chunks(cursor)) {
                if (chunk.chunk_type === 'VERTEX') {
                    const {index, vertices} = (chunk.data: any);
                    let i = 3 * index;

                    for (const {position, normal} of vertices) {
                        if (typeof positions[i] !== 'number') {
                            const pos = new Vector3(...position).applyMatrix4(matrix);

                            positions[i] = pos.x;
                            positions[i + 1] = pos.y;
                            positions[i + 2] = pos.z;

                            if (normal) {
                                const norm = new Vector3(...normal).applyMatrix3(normal_matrix);

                                normals[i] = norm.x;
                                normals[i + 1] = norm.y;
                                normals[i + 2] = norm.z;
                            }
                        }

                        i += 3;
                    }
                }
            }
        }

        if (plist_offset) {
            cursor.seek_start(plist_offset);

            for (const chunk of parse_chunks(cursor)) {
                if (chunk.chunk_type === 'TRIANGLE_STRIP') {
                    for (const {clockwise_winding, indices: strip_indices} of (chunk.data: any)) {
                        for (let j = 2; j < strip_indices.length; ++j) {
                            const a = strip_indices[j - 2];
                            const b = strip_indices[j - 1];
                            const c = strip_indices[j];

                            if ((j % 2 === 0) !== clockwise_winding) {
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
            }
        }
    } catch (e) {
        console.error(e);
    }
}

function parse_chunks(cursor: ArrayBufferCursor): *[] {
    const chunks = [];
    let loop = true;

    while (loop) {
        const chunk_type_id = cursor.u8();
        cursor.seek(1); // Flags
        let chunk_type = 'UNKOWN';
        let data = null;

        if (chunk_type_id === 0) {
            chunk_type = 'NULL';
        } else if (chunk_type_id === 8 || chunk_type_id === 9) {
            // NJ_TEX1 or NJ_TEX2
            cursor.seek(2);
        } else if (16 <= chunk_type_id && chunk_type_id <= 23) {
            // NJ_MAT1 - 1st Texture Unit Material Definition
            cursor.seek(6);
        } else if (chunk_type_id === 24) {
            // NJ_BUMP - Bump Map Definition
            const size = cursor.u16();
            cursor.seek(2 * size);
        } else if (25 <= chunk_type_id && chunk_type_id <= 31) {
            // NJ_MAT2 - 2nd Texture Unit Material Definition
            const size = cursor.u16();
            cursor.seek(2 * size);
        } else if (32 <= chunk_type_id && chunk_type_id <= 50) {
            chunk_type = 'VERTEX';
            data = parse_chunk_vertex(cursor, chunk_type_id);
        } else if (56 <= chunk_type_id && chunk_type_id <= 58) {
            // NJ_VOLM - Volume Chunk
            const size = cursor.u16();
            cursor.seek(2 * size);
        } else if (64 <= chunk_type_id && chunk_type_id <= 75) {
            chunk_type = 'TRIANGLE_STRIP';
            data = parse_chunk_triangle_strip(cursor, chunk_type_id);
        } else if (chunk_type_id === 255) {
            chunk_type = 'END';
            loop = false;
        } else {
            // Ignore unknown chunks.
            console.warn(`Unknown chunk type: ${chunk_type_id}.`);
        }

        chunks.push({
            chunk_type,
            chunk_type_id,
            data
        });
    }

    return chunks;
}

type ChunkVertex = {
    position: [number, number, number],
    normal?: [number, number, number]
};

function parse_chunk_vertex(cursor: ArrayBufferCursor, chunk_type_id: number): { index: number, vertices: ChunkVertex[] } {
    const size = cursor.u16();
    const chunk_start_position = cursor.position;
    const index = cursor.u16();
    const vertex_count = cursor.u16();

    const vertices: ChunkVertex[] = [];

    for (let i = 0; i < vertex_count; ++i) {
        const vertex: ChunkVertex = {
            position: [
                cursor.f32(), // x
                cursor.f32(), // y
                cursor.f32(), // z
            ]
        };

        if (chunk_type_id === 32) {
            cursor.seek(4); // Always 1.0
        } else if (chunk_type_id === 33) {
            cursor.seek(4); // Always 1.0
            vertex.normal = [
                cursor.f32(), // x
                cursor.f32(), // y
                cursor.f32(), // z
            ];
            cursor.seek(4); // Always 0.0
        } else if (35 <= chunk_type_id && chunk_type_id <= 40) {
            // Skip various flags and material information.
            cursor.seek(4);
        } else if (41 <= chunk_type_id && chunk_type_id <= 47) {
            vertex.normal = [
                cursor.f32(), // x
                cursor.f32(), // y
                cursor.f32(), // z
            ];

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

        vertices.push(vertex);
    }

    cursor.seek_start(chunk_start_position + 4 * size);

    return { index, vertices };
}

type ChunkTriangleStrip = {
    clockwise_winding: boolean,
    indices: number[]
};

function parse_chunk_triangle_strip(cursor: ArrayBufferCursor, chunk_type_id: number): ChunkTriangleStrip[] {
    const size = cursor.u16();
    const chunk_start_position = cursor.position;
    const user_offset_and_strip_count = cursor.u16();
    const user_flags_size = user_offset_and_strip_count >>> 13;
    const strip_count = user_offset_and_strip_count & 0x3FFF;
    let options;

    switch (chunk_type_id) {
        case 64: options = [false, false, false, false]; break;
        case 65: options = [true, false, false, false]; break;
        case 66: options = [true, false, false, false]; break;
        case 67: options = [false, false, true, false]; break;
        case 68: options = [true, false, true, false]; break;
        case 69: options = [true, false, true, false]; break;
        case 70: options = [false, true, false, false]; break;
        case 71: options = [true, true, false, false]; break;
        case 72: options = [true, true, false, false]; break;
        case 73: options = [false, false, false, false]; break;
        case 74: options = [true, false, false, true]; break;
        case 75: options = [true, false, false, true]; break;
        default: throw new Error(`Unexpected chunk type ID: ${chunk_type_id}.`);
    }

    const [
        parse_texture_coords,
        parse_color,
        parse_normal,
        parse_texture_coords_hires
    ] = options;

    const strips = [];

    for (let i = 0; i < strip_count; ++i) {
        const winding_flag_and_index_count = cursor.i16();
        const clockwise_winding = winding_flag_and_index_count < 1;
        const index_count = Math.abs(winding_flag_and_index_count);

        const indices = [];

        for (let j = 0; j < index_count; ++j) {
            indices.push(cursor.u16());

            if (parse_texture_coords) {
                cursor.seek(4);
            }

            if (parse_color) {
                cursor.seek(4);
            }

            if (parse_normal) {
                cursor.seek(6);
            }

            if (parse_texture_coords_hires) {
                cursor.seek(8);
            }

            if (j >= 2) {
                cursor.seek(2 * user_flags_size);
            }
        }

        strips.push({ clockwise_winding, indices });
    }

    cursor.seek_start(chunk_start_position + 2 * size);

    return strips;
}
