import { ArrayBufferCursor } from './ArrayBufferCursor';

test('simple properties and invariants', () => {
    const cursor = new ArrayBufferCursor(10, true);

    expect(cursor.size).toBe(0);
    expect(cursor.capacity).toBe(10);
    expect(cursor.position).toBe(0);
    expect(cursor.bytes_left).toBe(0);
    expect(cursor.little_endian).toBe(true);
    
    cursor.write_u8(99).write_u8(99).write_u8(99).write_u8(99);
    cursor.seek(-1);

    expect(cursor.size).toBe(4);
    expect(cursor.capacity).toBe(10);
    expect(cursor.position).toBe(3);
    expect(cursor.bytes_left).toBe(1);
    expect(cursor.little_endian).toBe(true);
});

test('correct byte order handling', () => {
    const buffer = new Uint8Array([1, 2, 3, 4]).buffer;

    expect(new ArrayBufferCursor(buffer, false).u32()).toBe(16909060);
    expect(new ArrayBufferCursor(buffer, true).u32()).toBe(67305985);
});

test('reallocation of internal buffer when necessary', () => {
    const cursor = new ArrayBufferCursor(3, true);
    cursor.write_u8(99).write_u8(99).write_u8(99).write_u8(99);

    expect(cursor.size).toBe(4);
    expect(cursor.capacity).toBeGreaterThanOrEqual(4);
    expect(cursor._buffer.byteLength).toBeGreaterThanOrEqual(4);
});
