import { ArrayBufferCursor } from './ArrayBufferCursor';

test('simple properties and invariants', () => {
    const cursor = new ArrayBufferCursor(10, true);

    expect(cursor.size).toBe(cursor.position + cursor.bytes_left);
    expect(cursor.size).toBeLessThanOrEqual(cursor.capacity);
    expect(cursor.size).toBe(0);
    expect(cursor.capacity).toBe(10);
    expect(cursor.position).toBe(0);
    expect(cursor.bytes_left).toBe(0);
    expect(cursor.little_endian).toBe(true);

    cursor.write_u8(99).write_u8(99).write_u8(99).write_u8(99);
    cursor.seek(-1);

    expect(cursor.size).toBe(cursor.position + cursor.bytes_left);
    expect(cursor.size).toBeLessThanOrEqual(cursor.capacity);
    expect(cursor.size).toBe(4);
    expect(cursor.capacity).toBe(10);
    expect(cursor.position).toBe(3);
    expect(cursor.bytes_left).toBe(1);
    expect(cursor.little_endian).toBe(true);
});

test('correct byte order handling', () => {
    const buffer = new Uint8Array([1, 2, 3, 4]).buffer;

    expect(new ArrayBufferCursor(buffer, false).u32()).toBe(0x01020304);
    expect(new ArrayBufferCursor(buffer, true).u32()).toBe(0x04030201);
});

test('reallocation of internal buffer when necessary', () => {
    const cursor = new ArrayBufferCursor(3, true);
    cursor.write_u8(99).write_u8(99).write_u8(99).write_u8(99);

    expect(cursor.size).toBe(4);
    expect(cursor.capacity).toBeGreaterThanOrEqual(4);
    expect(cursor._buffer.byteLength).toBeGreaterThanOrEqual(4);
});

function test_integer_read(method_name: string) {
    test(method_name, () => {
        const bytes = parseInt(method_name.replace(/^[iu](\d+)$/, '$1')) / 8;
        let test_number_1 = 0;
        let test_number_2 = 0;
        // The "false" arrays are for big endian tests and the "true" arrays for little endian tests.
        const test_arrays_1 = { false: [], true: [] };
        const test_arrays_2 = { false: [], true: [] };

        for (let i = 1; i <= bytes; ++i) {
            // Generates numbers of the form 0x010203...
            test_number_1 <<= 8;
            test_number_1 |= i;
            test_number_2 <<= 8;
            test_number_2 |= i + bytes;
            test_arrays_1[false].push(i);
            test_arrays_1[true].unshift(i);
            test_arrays_2[false].push(i + bytes);
            test_arrays_2[true].unshift(i + bytes);
        }

        for (const little_endian of [false, true]) {
            const cursor = new ArrayBufferCursor(0, little_endian);
            cursor[method_name](test_number_1);

            expect(cursor.position).toBe(bytes);
            expect(cursor.seek_start(0).u8_array(bytes))
                .toEqual(test_arrays_1[little_endian]);
            expect(cursor.position).toBe(bytes);

            cursor[method_name](test_number_2);

            expect(cursor.position).toBe(2 * bytes);
            expect(cursor.seek_start(0).u8_array(2 * bytes))
                .toEqual(test_arrays_1[little_endian].concat(test_arrays_2[little_endian]));
        }
    });
}

test('u8_array', () => {
    const cursor = new ArrayBufferCursor(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]).buffer, true);

    expect(cursor.u8_array(3)).toEqual([1, 2, 3]);
    expect(cursor.seek_start(2).u8_array(4)).toEqual([3, 4, 5, 6]);
    expect(cursor.seek_start(5).u8_array(3)).toEqual([6, 7, 8]);
});

test('string_ascii', () => {
    const cursor = new ArrayBufferCursor(new Uint8Array([7, 65, 66, 0, 255, 13]).buffer, true);

    expect(cursor.seek(1).string_ascii(4, true, true)).toBe('AB');
    expect(cursor.u8()).toBe(13);
});

test('string_utf_16', () => {
    const cursor = new ArrayBufferCursor(
        new Uint8Array([7, 65, 0, 66, 0, 0, 0, 255, 255, 13]).buffer, true);

    expect(cursor.seek(1).string_utf_16(8, true, true)).toBe('AB');
    expect(cursor.u8()).toBe(13);
});

function test_integer_write(method_name: string) {
    test(method_name, () => {
        const bytes = parseInt(method_name.replace(/^write_[iu](\d+)$/, '$1')) / 8;
        let test_number_1 = 0;
        let test_number_2 = 0;
        // The "false" arrays are for big endian tests and the "true" arrays for little endian tests.
        const test_arrays_1 = { false: [], true: [] };
        const test_arrays_2 = { false: [], true: [] };

        for (let i = 1; i <= bytes; ++i) {
            // Generates numbers of the form 0x010203...
            test_number_1 <<= 8;
            test_number_1 |= i;
            test_number_2 <<= 8;
            test_number_2 |= i + bytes;
            test_arrays_1[false].push(i);
            test_arrays_1[true].unshift(i);
            test_arrays_2[false].push(i + bytes);
            test_arrays_2[true].unshift(i + bytes);
        }

        for (const little_endian of [false, true]) {
            const cursor = new ArrayBufferCursor(0, little_endian);
            cursor[method_name](test_number_1);

            expect(cursor.position).toBe(bytes);
            expect(cursor.seek_start(0).u8_array(bytes))
                .toEqual(test_arrays_1[little_endian]);
            expect(cursor.position).toBe(bytes);

            cursor[method_name](test_number_2);

            expect(cursor.position).toBe(2 * bytes);
            expect(cursor.seek_start(0).u8_array(2 * bytes))
                .toEqual(test_arrays_1[little_endian].concat(test_arrays_2[little_endian]));
        }
    });
}

test_integer_write('write_u8');
test_integer_write('write_u16');
test_integer_write('write_u32');

test('write_f32', () => {
    for (const little_endian of [false, true]) {
        const cursor = new ArrayBufferCursor(0, little_endian);
        cursor.write_f32(1337.9001);

        expect(cursor.position).toBe(4);
        expect(cursor.seek(-4).f32()).toBeCloseTo(1337.9001, 4);
        expect(cursor.position).toBe(4);

        cursor.write_f32(103.502);

        expect(cursor.position).toBe(8);
        expect(cursor.seek(-4).f32()).toBeCloseTo(103.502, 3);
    }
});

test('write_u8_array', () => {
    for (const little_endian of [false, true]) {
        const bytes = 10;
        const cursor = new ArrayBufferCursor(2 * bytes, little_endian);
        const uint8_array = new Uint8Array(cursor._buffer);
        const test_array_1 = [];
        const test_array_2 = [];

        for (let i = 1; i <= bytes; ++i) {
            test_array_1.push(i);
            test_array_2.push(i + bytes);
        }

        cursor.write_u8_array(test_array_1);

        expect(cursor.position).toBe(bytes);

        for (let i = 0; i < bytes; ++i) {
            expect(uint8_array[i]).toBe(test_array_1[i]);
        }

        cursor.write_u8_array(test_array_2);

        expect(cursor.position).toBe(2 * bytes);

        for (let i = 0; i < bytes; ++i) {
            expect(uint8_array[i]).toBe(test_array_1[i]);
        }

        for (let i = 0; i < bytes; ++i) {
            expect(uint8_array[i + bytes]).toBe(test_array_2[i]);
        }
    }
});