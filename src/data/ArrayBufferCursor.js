// @flow
import { TextDecoder } from 'text-encoding';

const ASCII_DECODER = new TextDecoder('ascii');
const UTF_16BE_DECODER = new TextDecoder('utf-16be');
const UTF_16LE_DECODER = new TextDecoder('utf-16le');

/**
 * A cursor for reading and writing binary data. Uses an ArrayBuffer internally.
 */
export class ArrayBufferCursor {
    //
    // Public properties
    //

    /**
     * The cursor's size. This value will always be equal to or smaller than the cursor's capacity.
     */
    size: number;

    /**
     * The position from where bytes will be read or written.
     */
    position: number;

    /**
     * Byte order mode.
     */
    little_endian: boolean;

    //
    // Private properties
    //

    _buffer: ArrayBuffer;
    _dv: DataView;
    _utf_16_decoder: TextDecoder;

    /**
     * @param buffer_or_capacity - If an ArrayBuffer is given, writes to the cursor will be reflected in this array buffer and vice versa until a cursor write that requires allocating a new internal buffer happens
     * @param little_endian - Decides in which byte order multi-byte integers and floats will be interpreted
     */
    constructor(buffer_or_capacity: ArrayBuffer | number, little_endian: ?boolean) {
        if (typeof buffer_or_capacity === 'number') {
            this._buffer = new ArrayBuffer(buffer_or_capacity);
            this.size = 0;
        } else {
            this._buffer = buffer_or_capacity;
            this.size = this._buffer.byteLength;
        }

        this.little_endian = !!little_endian;
        this.position = 0;
        this._dv = new DataView(this._buffer);
        this._utf_16_decoder = little_endian ? UTF_16LE_DECODER : UTF_16BE_DECODER;
    }

    //
    // Public methods
    //

    /**
     * The amount of bytes left to read from the current position onward.
     */
    get bytes_left(): number {
        return this.size - this.position;
    }

    /**
     * The size of the underlying buffer. This value will always be equal to or greater than the cursor's size.
     */
    get capacity(): number {
        return this._buffer.byteLength;
    }

    /**
     * Seek forward or backward by a number of bytes.
     * 
     * @param offset - if positive, seeks forward by offset bytes, otherwise seeks backward by -offset bytes.
     */
    seek(offset: number) {
        return this.seek_start(this.position + offset);
    }

    /**
     * Seek forward from the start of the cursor by a number of bytes.
     * 
     * @param offset - greater or equal to 0 and smaller than size
     */
    seek_start(offset: number) {
        if (offset < 0 || offset > this.size) {
            throw new Error(`Offset ${offset} is out of bounds.`);
        }

        this.position = offset;
        return this;
    }

    /**
     * Seek backward from the end of the cursor by a number of bytes.
     * 
     * @param offset - greater or equal to 0 and smaller than size
     */
    seek_end(offset: number) {
        if (offset < 0 || offset > this.size) {
            throw new Error(`Offset ${offset} is out of bounds.`);
        }

        this.position = this.size - offset;
        return this;
    }

    /**
     * Reads an unsigned 8-bit integer and increments position by 1.
     */
    u8() {
        return this._dv.getUint8(this.position++);
    }

    /**
     * Reads an unsigned 16-bit integer and increments position by 2.
     */
    u16() {
        const r = this._dv.getUint16(this.position, this.little_endian);
        this.position += 2;
        return r;
    }

    /**
     * Reads an unsigned 32-bit integer and increments position by 4.
     */
    u32() {
        const r = this._dv.getUint32(this.position, this.little_endian);
        this.position += 4;
        return r;
    }

    /**
     * Reads a signed 32-bit integer and increments position by 4.
     */
    i32() {
        const r = this._dv.getInt32(this.position, this.little_endian);
        this.position += 4;
        return r;
    }

    /**
     * Reads a 32-bit floating point number and increments position by 4.
     */
    f32() {
        const r = this._dv.getFloat32(this.position, this.little_endian);
        this.position += 4;
        return r;
    }

    /**
     * Reads n unsigned 8-bit integers and increments position by n.
     */
    u8_array(n: number): number[] {
        const array = [];
        for (let i = 0; i < n; ++i) array.push(this._dv.getUint8(this.position++));
        return array;
    }

    /**
     * Consumes a variable number of bytes.
     * 
     * @param size - the amount bytes to consume.
     * @returns a new cursor containing size bytes.
     */
    take(size: number): ArrayBufferCursor {
        if (size < 0 || size > this.size - this.position) {
            throw new Error(`Size ${size} out of bounds.`);
        }

        this.position += size;
        return new ArrayBufferCursor(
            this._buffer.slice(this.position - size, this.position), this.little_endian);
    }

    /**
     * Consumes up to max_byte_length bytes.
     */
    string_ascii(max_byte_length: number, null_terminated: boolean, drop_remaining: boolean) {
        const string_length = null_terminated
            ? this._index_of_u8(0, max_byte_length) - this.position
            : max_byte_length;

        const r = ASCII_DECODER.decode(
            new DataView(this._buffer, this.position, string_length));
        this.position += drop_remaining ? max_byte_length : string_length;
        return r;
    }

    /**
     * Consumes up to max_byte_length bytes.
     */
    string_utf_16(max_byte_length: number, null_terminated: boolean, drop_remaining: boolean) {
        const string_length = null_terminated
            ? this._index_of_u16(0, max_byte_length) - this.position
            : Math.floor(max_byte_length / 2) * 2;

        const r = this._utf_16_decoder.decode(
            new DataView(this._buffer, this.position, string_length));
        this.position += drop_remaining ? max_byte_length : string_length;
        return r;
    }

    /**
     * Writes an unsigned 8-bit integer and increments position by 1. If necessary, grows the cursor and reallocates the underlying buffer.
     */
    write_u8(value: number) {
        this._ensure_capacity(this.position + 1);

        this._dv.setUint8(this.position++, value);

        if (this.position > this.size) {
            this.size = this.position;
        }

        return this;
    }

    /**
     * Writes an unsigned 16-bit integer and increments position by 2. If necessary, grows the cursor and reallocates the underlying buffer.
     */
    write_u16(value: number) {
        this._ensure_capacity(this.position + 2);

        this._dv.setUint16(this.position, value, this.little_endian);
        this.position += 2;

        if (this.position > this.size) {
            this.size = this.position;
        }

        return this;
    }

    /**
     * Writes an unsigned 32-bit integer and increments position by 4. If necessary, grows the cursor and reallocates the underlying buffer.
     */
    write_u32(value: number) {
        this._ensure_capacity(this.position + 4);

        this._dv.setUint32(this.position, value, this.little_endian);
        this.position += 4;

        if (this.position > this.size) {
            this.size = this.position;
        }

        return this;
    }

    /**
     * Writes a 32-bit floating point number and increments position by 4. If necessary, grows the cursor and reallocates the underlying buffer.
     */
    write_f32(value: number) {
        this._ensure_capacity(this.position + 4);

        this._dv.setFloat32(this.position, value, this.little_endian);
        this.position += 4;

        if (this.position > this.size) {
            this.size = this.position;
        }

        return this;
    }

    /**
     * Writes an array of unsigned 8-bit integers and increments position by the array's length. If necessary, grows the cursor and reallocates the underlying buffer.
     */
    write_u8_array(array: number[]) {
        this._ensure_capacity(this.position + array.length);

        new Uint8Array(this._buffer, this.position).set(new Uint8Array(array));
        this.position += array.length;

        if (this.position > this.size) {
            this.size = this.position;
        }

        return this;
    }

    /**
     * Writes the contents of other and increments position by the size of other. If necessary, grows the cursor and reallocates the underlying buffer.
     */
    write_cursor(other: ArrayBufferCursor) {
        this._ensure_capacity(this.position + other.size);

        new Uint8Array(this._buffer, this.position).set(new Uint8Array(other._buffer));
        this.position += other.size;

        if (this.position > this.size) {
            this.size = this.position;
        }

        return this;
    }

    //
    // Private methods
    //

    _index_of_u8(value: number, max_byte_length: number) {
        const max_pos = Math.min(this.position + max_byte_length, this.size);

        for (let i = this.position; i < max_pos; ++i) {
            if (this._dv.getUint8(i) === value) {
                return i;
            }
        }

        return this.position + max_byte_length;
    }

    _index_of_u16(value: number, max_byte_length: number) {
        const max_pos = Math.min(this.position + max_byte_length, this.size);

        for (let i = this.position; i < max_pos; i += 2) {
            if (this._dv.getUint16(i, this.little_endian) === value) {
                return i;
            }
        }

        return this.position + max_byte_length;
    }

    /**
     *  Increases buffer size if necessary.
     */
    _ensure_capacity(min_new_size: number) {
        if (min_new_size > this.capacity) {
            let new_size = this.capacity || min_new_size;

            do {
                new_size *= 2;
            } while (new_size < min_new_size);

            const new_buffer = new ArrayBuffer(new_size);
            new Uint8Array(new_buffer).set(new Uint8Array(this._buffer, 0, this.size));
            this._buffer = new_buffer;
            this._dv = new DataView(this._buffer);
        }
    }
}
